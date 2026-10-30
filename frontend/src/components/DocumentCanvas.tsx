import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  PenTool,
  Trash2,
  Check,
  AlertCircle,
  FileText,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { FieldItem, MarkupAnnotation, BoundingBox } from '../types/shipping';
import { generateAuthenticDocumentSvg } from '../services/documentImageGenerator';
import { renderPdfToImages, RenderedPage } from '../services/pdfRenderer';

interface DocumentCanvasProps {
  title: string;
  subTitle: string;
  type: 'SI' | 'BL';
  companyName: string;
  data: Record<string, FieldItem>;
  selectedField: string | null;
  onSelectField: (field: string) => void;
  mismatchedFields: Set<string>;
  language: 'th' | 'en';
  imageSrc?: string | null;
  pdfSource?: File | Blob | string | null;
  serverImageBase64?: string | null;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  title,
  subTitle,
  type,
  companyName,
  data,
  selectedField,
  onSelectField,
  mismatchedFields,
  language,
  imageSrc,
  pdfSource,
  serverImageBase64,
}) => {
  const isTh = language === 'th';
  const [zoom, setZoom] = useState(1.0);
  const [viewMode, setViewMode] = useState<'image' | 'grid'>('image');
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [naturalDims, setNaturalDims] = useState<{ width: number; height: number }>({
    width: companyName === 'BETAGRO' ? 780 : companyName === 'ONE' ? 800 : 595,
    height: companyName === 'BETAGRO' || companyName === 'ONE' ? 740 : 842,
  });

  // Red-pen markup annotations
  const [annotations, setAnnotations] = useState<MarkupAnnotation[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotationText, setAnnotationText] = useState('');
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  // References for viewport and scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  const selectedBoxRef = useRef<HTMLDivElement>(null);

  // 1. Load real PDF pages if source is provided
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      if (!pdfSource) return;
      try {
        const pages = await renderPdfToImages(pdfSource, 2.0);
        if (!isCancelled && pages.length > 0) {
          setRenderedPages(pages);
          setCurrentPageIndex(0);
        }
      } catch (err) {
        console.warn('Could not render PDF, fallback to image:', err);
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfSource]);

  // 2. Smoothly scroll to spotlighted box whenever selectedField changes
  useEffect(() => {
    if (selectedField && selectedBoxRef.current && scrollContainerRef.current) {
      selectedBoxRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [selectedField, currentPageIndex, viewMode]);

  // Fallback authentic vector document image
  const fallbackSvgUrl = React.useMemo(() => {
    return generateAuthenticDocumentSvg(type, companyName, data, 595, 842);
  }, [type, companyName, data]);

  // Determine active document image
  const activeImageSrc = React.useMemo(() => {
    if (imageSrc) return imageSrc;
    if (companyName === 'BETAGRO') return '/samples/betagro_si_original.png';
    if (companyName === 'ONE') return '/samples/one_bl_original.png';

    if (renderedPages.length > 0 && renderedPages[currentPageIndex]) {
      return renderedPages[currentPageIndex].dataUrl;
    }
    if (serverImageBase64) {
      return serverImageBase64.startsWith('data:')
        ? serverImageBase64
        : `data:image/png;base64,${serverImageBase64}`;
    }
    return fallbackSvgUrl;
  }, [imageSrc, companyName, renderedPages, currentPageIndex, serverImageBase64, fallbackSvgUrl]);

  // Stable coordinate percentage normalizer
  const normalizeCoords = (box?: BoundingBox | BoundingBox[] | null) => {
    if (!box) return null;
    let b: BoundingBox;
    if (Array.isArray(box)) {
      if (box.length === 0) return null;
      b = box[0];
    } else {
      b = box;
    }

    if (!b || typeof b.x !== 'number') return null;

    const targetWidth = naturalDims.width > 0 ? naturalDims.width : (companyName === 'BETAGRO' ? 780 : companyName === 'ONE' ? 800 : 595);
    const targetHeight = naturalDims.height > 0 ? naturalDims.height : (companyName === 'BETAGRO' || companyName === 'ONE' ? 740 : 842);

    const leftPct = (b.x / targetWidth) * 100;
    const topPct = (b.y / targetHeight) * 100;
    const widthPct = ((b.width || 80) / targetWidth) * 100;
    const heightPct = ((b.height || 25) / targetHeight) * 100;

    return {
      leftPct,
      topPct,
      widthPct,
      heightPct,
      page: b.page ?? 1,
    };
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotating || !pageWrapperRef.current) return;
    const rect = pageWrapperRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;

    const newNote: MarkupAnnotation = {
      id: `note-${Date.now()}`,
      type: 'text',
      xRatio,
      yRatio,
      text: annotationText || (isTh ? 'แก้ไขเป็น: ...' : 'AMEND TO: ...'),
      color: '#ef4444',
    };

    setAnnotations((prev) => [...prev, newNote]);
    setIsAnnotating(false);
  };

  const removeAnnotation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden h-full">
      {/* ================= HEADER BAR ================= */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-0.5 rounded font-black tracking-wider shadow-xs ${
              type === 'SI' ? 'bg-sky-500 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {type}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm tracking-tight text-white">{title}</h3>
              <span className="text-[11px] px-2 py-0.2 rounded bg-slate-800 text-slate-300 font-mono font-semibold border border-slate-700">
                {companyName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">{subTitle}</p>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-1.5">
          {/* View Mode Toggle: Image vs Grid */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('image')}
              className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'image'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title={isTh ? 'ดูภาพเอกสารต้นฉบับพร้อม Bounding Box' : 'Original Document Image'}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isTh ? 'เอกสารต้นฉบับ' : 'Document Image'}</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title={isTh ? 'ดูตารางจัดรูปฟอร์ม' : 'Structured Grid View'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{isTh ? 'ตารางฟิลด์' : 'Grid'}</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-0.5" />

          {/* Zoom controls */}
          {viewMode === 'image' && (
            <div className="flex items-center gap-0.5 bg-slate-800 px-1 py-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.15, 2.2))}
                title={isTh ? 'ขยายรูป' : 'Zoom In'}
                className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-300 px-1 select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.15, 0.65))}
                title={isTh ? 'ย่อรูป' : 'Zoom Out'}
                className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(1.0)}
                title={isTh ? 'รีเซ็ต 100%' : 'Reset 100%'}
                className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Red Pen Markup Tool */}
          <button
            onClick={() => {
              setIsAnnotating(!isAnnotating);
              if (!isAnnotating && !annotationText) {
                setShowAddNoteModal(true);
              }
            }}
            title={isTh ? 'ปากกาแดง / บันทึกแก้ไข' : 'Red Pen Markup'}
            className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded font-bold transition-colors ${
              isAnnotating
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isTh ? 'ปากกาแดง' : 'Red Pen'}</span>
          </button>
        </div>
      </div>

      {/* ================= ANNOTATION BANNER ================= */}
      {isAnnotating && (
        <div className="bg-rose-50 border-b border-rose-300 px-3 py-1.5 text-xs text-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>
              {isTh
                ? 'โหมดปากกาแดงเปิดอยู่: คลิกบนหน้าเอกสารเพื่อแปะคำสั่งแก้ไข'
                : 'Red Markup active: Click anywhere on the document to place amendment notes.'}
            </span>
          </div>
          <button
            onClick={() => setIsAnnotating(false)}
            className="text-xs text-rose-700 font-bold hover:underline"
          >
            {isTh ? 'ยกเลิก' : 'Cancel'}
          </button>
        </div>
      )}

      {/* ================= MAIN DOCUMENT PREVIEW BODY ================= */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-slate-100 p-4 relative"
        style={{ minHeight: 650, maxHeight: 820 }}
      >
        {viewMode === 'image' ? (
          /* -------- MODE 1: ORIGINAL DOCUMENT IMAGE WITH PRECISE BOUNDING BOXES -------- */
          <div className="flex justify-center items-start min-w-full">
            <div
              ref={pageWrapperRef}
              onClick={handleContainerClick}
              style={{
                width: `${(naturalDims.width || 780) * (zoom * 0.95)}px`,
                transition: 'width 0.15s ease',
              }}
              className="relative bg-white shadow-xl rounded-md border border-slate-300 select-none overflow-hidden"
            >
              {/* The Actual Original Document Image */}
              <img
                src={activeImageSrc}
                alt={`${title} Original Document`}
                onLoad={(e) => {
                  if (e.currentTarget.naturalWidth > 0 && e.currentTarget.naturalHeight > 0) {
                    setNaturalDims({
                      width: e.currentTarget.naturalWidth,
                      height: e.currentTarget.naturalHeight,
                    });
                  }
                }}
                className="w-full h-auto block select-none"
                draggable={false}
              />

              {/* OVERLAY: Bounding Boxes with Precise Visual Match */}
              {Object.entries(data).map(([fieldKey, fieldItem]) => {
                const norm = normalizeCoords(fieldItem?.bbox);
                if (!norm) return null;

                const isSelected = selectedField === fieldKey;
                const isDiscrepant = mismatchedFields.has(fieldKey);

                return (
                  <div
                    key={fieldKey}
                    ref={isSelected ? selectedBoxRef : null}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectField(fieldKey);
                    }}
                    style={{
                      left: `${norm.leftPct}%`,
                      top: `${norm.topPct}%`,
                      width: `${norm.widthPct}%`,
                      height: `${norm.heightPct}%`,
                      position: 'absolute',
                      borderRadius: '4px',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                      ...(isSelected
                        ? {
                            border: '2.5px solid #eab308',
                            backgroundColor: 'rgba(254, 240, 138, 0.45)',
                            boxShadow: '0 0 0 3px rgba(234, 179, 8, 0.5), 0 0 12px rgba(234, 179, 8, 0.4)',
                            zIndex: 40,
                          }
                        : isDiscrepant
                        ? {
                            border: '2px solid #ef4444',
                            backgroundColor: 'rgba(254, 226, 226, 0.55)',
                            zIndex: 20,
                          }
                        : {
                            border: '1.5px solid #10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            zIndex: 10,
                          }),
                    }}
                    className="group"
                  >
                    {/* RED CIRCLE WITH EXCLAMATION MARK BADGE (MATCHING USER'S SCREENSHOT) */}
                    {isDiscrepant && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-11px',
                          right: '-11px',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          fontWeight: 900,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                          zIndex: 35,
                          pointerEvents: 'none',
                        }}
                      >
                        !
                      </div>
                    )}

                    {/* SPOTLIGHT BEACON PIN (Appears above the selected box) */}
                    {isSelected && (
                      <div className="absolute -top-7 left-0 z-50 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] shadow-md tracking-wider uppercase whitespace-nowrap animate-bounce">
                        <span>🎯</span>
                        <span>{fieldKey.replace(/_/g, ' ')}</span>
                      </div>
                    )}

                    {/* Hover Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-slate-900 text-white text-[10px] whitespace-nowrap z-50 shadow-md font-sans transition-opacity">
                      <div className="font-bold text-amber-300 uppercase tracking-wide">
                        {fieldKey.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[9px] text-slate-300 font-mono truncate max-w-[200px]">
                        {fieldItem?.value || '-'}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Red Pen Markup Pins & Notes */}
              {annotations.map((ann) => (
                <div
                  key={ann.id}
                  style={{
                    left: `${ann.xRatio * 100}%`,
                    top: `${ann.yRatio * 100}%`,
                  }}
                  className="absolute z-50 -translate-x-1/2 -translate-y-1/2 group"
                >
                  <div className="bg-rose-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-md flex items-center gap-1.5 border border-white">
                    <span>📌</span>
                    <span>{ann.text}</span>
                    <button
                      onClick={(e) => removeAnnotation(ann.id, e)}
                      className="ml-1 text-white hover:text-rose-200"
                      title="Delete"
                    >
                      <Trash2 className="w-2.5 h-2.5 inline" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* -------- MODE 2: STRUCTURED GRID VIEW -------- */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
            {Object.entries(data).map(([key, item]) => {
              const isSelected = selectedField === key;
              const isDiscrepant = mismatchedFields.has(key);

              return (
                <div
                  key={key}
                  onClick={() => onSelectField(key)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400 shadow-xs'
                      : isDiscrepant
                      ? 'border-rose-300 bg-rose-50/50 hover:bg-rose-100/50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                      {key.replace(/_/g, ' ')}
                    </span>
                    {isDiscrepant ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold text-[9px]">
                        <AlertCircle className="w-2.5 h-2.5" />
                        {isTh ? 'ไม่ตรงกัน' : 'MISMATCH'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">
                        <Check className="w-2.5 h-2.5" />
                        {isTh ? 'ตรงกัน' : 'MATCH'}
                      </span>
                    )}
                  </div>
                  <div
                    className={`font-mono text-xs leading-relaxed whitespace-pre-wrap break-words ${
                      isDiscrepant ? 'text-rose-950 font-medium' : 'text-slate-800'
                    }`}
                  >
                    {item?.value || '-'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= FOOTER STATUS / MULTI-PAGE BAR ================= */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-[11px]">
            {isTh
              ? 'ระบบจำลองการสแกนและจัดวาง Bounding Box แบบเปอร์เซ็นต์สเถียร 100%'
              : 'Spotlight coordinates anchored with 100% stable percentage mapping'}
          </span>
        </div>

        {renderedPages.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={currentPageIndex <= 0}
              onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
              className="p-1 rounded border border-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-bold font-mono">
              {currentPageIndex + 1} / {renderedPages.length}
            </span>
            <button
              disabled={currentPageIndex >= renderedPages.length - 1}
              onClick={() => setCurrentPageIndex((p) => Math.min(renderedPages.length - 1, p + 1))}
              className="p-1 rounded border border-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ================= RED PEN NOTE MODAL ================= */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-4 shadow-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-rose-600" />
              <span>{isTh ? 'ระบุข้อความคำสั่งแก้ไข (Red Pen Note)' : 'Enter Correction Note'}</span>
            </h4>
            <input
              type="text"
              value={annotationText}
              onChange={(e) => setAnnotationText(e.target.value)}
              placeholder={isTh ? 'เช่น AMEND POSTCODE TO 42000' : 'e.g., AMEND POSTCODE TO 42000'}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none mb-3"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddNoteModal(false);
                  setIsAnnotating(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {isTh ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setShowAddNoteModal(false);
                  setIsAnnotating(true);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-xs hover:bg-rose-700"
              >
                {isTh ? 'เริ่มคลิกวางบนเอกสาร' : 'Start Placing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

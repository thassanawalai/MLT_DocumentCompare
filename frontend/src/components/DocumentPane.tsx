/**
 * @license
 * Ported and enhanced from thassanawalai/MLT_DocumentCompare frontend/src/DocumentPane.jsx
 * Document Preview & Bounding Box Spotlight Engine
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DiscrepancyItem } from '../types/shipping';

// ============================================================
// Helper Functions
// ============================================================
export interface BBoxCoord {
  x: number;
  y: number;
  width: number;
  height: number;
  page?: number;
}

export interface CommentItem {
  id: string;
  type?: 'text' | 'line';
  pageIndex: number;
  xRatio: number;
  yRatio: number;
  text?: string;
  lineWidth?: number;
}

const parseFieldData = (val: any) => {
  if (val === null || val === undefined || val === '') {
    return { text: '', bbox: null, char_bboxes: [] };
  }
  if (typeof val === 'object') {
    return {
      text: val.value !== undefined ? String(val.value) : JSON.stringify(val),
      bbox: val.bbox || null,
      char_bboxes: val.char_bboxes || [],
    };
  }
  return { text: String(val), bbox: null, char_bboxes: [] };
};

const normalizeBoxCoords = (box: any): BBoxCoord | null => {
  if (!box) return null;
  if (Array.isArray(box) && box.length >= 4) {
    return {
      x: box[0],
      y: box[1],
      width: box[2] - box[0],
      height: box[3] - box[1],
      page: box[4] ?? 0,
    };
  }
  if (box.x !== undefined && box.y !== undefined) {
    return {
      x: box.x,
      y: box.y,
      width: box.width ?? (box.x2 ? box.x2 - box.x : 0),
      height: box.height ?? (box.y2 ? box.y2 - box.y : 0),
      page: box.page ?? 0,
    };
  }
  return null;
};

// ============================================================
// Draggable Comment Component (Original from MLT_DocumentCompare)
// ============================================================
interface DraggableCommentProps {
  comment: CommentItem;
  containerWidth: number;
  containerHeight: number;
  onUpdate?: (id: string, updated: CommentItem) => void;
  onDelete?: (id: string) => void;
  onEdit?: (comment: CommentItem) => void;
}

const DraggableComment: React.FC<DraggableCommentProps> = ({
  comment,
  containerWidth,
  containerHeight,
  onUpdate,
  onDelete,
  onEdit,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [pos, setPos] = useState({
    x: comment.xRatio * containerWidth,
    y: comment.yRatio * containerHeight,
  });
  const dragRef = useRef({ startX: 0, startY: 0, initBoxX: 0, initBoxY: 0 });

  useEffect(() => {
    if (!isDragging) {
      setPos({
        x: comment.xRatio * containerWidth,
        y: comment.yRatio * containerHeight,
      });
    }
  }, [comment.xRatio, comment.yRatio, containerWidth, containerHeight, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initBoxX: pos.x,
      initBoxY: pos.y,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPos({
        x: dragRef.current.initBoxX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.initBoxY + (e.clientY - dragRef.current.startY),
      });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (onUpdate && containerWidth > 0 && containerHeight > 0) {
          onUpdate(comment.id, {
            ...comment,
            xRatio: pos.x / containerWidth,
            yRatio: pos.y / containerHeight,
          });
        }
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, pos, containerWidth, containerHeight, comment, onUpdate]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 50,
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        userSelect: 'none',
      }}
    >
      {comment.type === 'line' && (
        <div
          style={{
            width: `${comment.lineWidth || 60}px`,
            height: '2px',
            backgroundColor: '#ef4444',
            borderRadius: '2px',
            boxShadow: '0 0 4px rgba(239, 68, 68, 0.6)',
          }}
        />
      )}

      {(comment.type === 'text' || !comment.type) && comment.text && (
        <div
          style={{
            color: '#ef4444',
            fontFamily: '"Sarabun", "Times New Roman", serif',
            fontSize: '13px',
            fontWeight: 'bold',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px dashed #ef4444',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            padding: '2px 6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          {comment.text}
        </div>
      )}

      {(isHovered || isDragging) && (
        <div
          style={{
            position: 'absolute',
            top: '-32px',
            left: 0,
            display: 'flex',
            gap: '4px',
            backgroundColor: '#fff',
            padding: '3px 6px',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
            border: '1px solid #cbd5e1',
            zIndex: 60,
          }}
        >
          {comment.type === 'text' && onEdit && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(comment);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                padding: '2px',
              }}
              title="แก้ไข"
            >
              ✏️
            </button>
          )}
          {comment.type === 'text' && <div style={{ width: '1px', backgroundColor: '#e2e8f0' }} />}
          {onDelete && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(comment.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                padding: '2px',
              }}
              title="ลบ"
            >
              ❌
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Main DocumentPane Component
// ============================================================
export interface DocumentPaneProps {
  title: string;
  fileData: {
    images?: string[];
    image?: string;
    data?: Record<string, any>;
  };
  discrepancies?: DiscrepancyItem[];
  selectedField: string | null;
  setSelectedField: (field: string | null) => void;
  hoveredField: string | null;
  setHoveredField: (field: string | null) => void;
  showFieldList?: boolean;
  notFoundLabel?: string;
  drawHighlights?: boolean;
  enableComments?: boolean;
  comments?: CommentItem[];
  onAddComment?: (comment: CommentItem) => void;
  onUpdateComment?: (id: string, updated: CommentItem) => void;
  onDeleteComment?: (id: string) => void;
  isBl?: boolean;
}

export const DocumentPane: React.FC<DocumentPaneProps> = ({
  title,
  fileData,
  discrepancies = [],
  selectedField,
  setSelectedField,
  hoveredField,
  setHoveredField,
  drawHighlights = true,
  enableComments = false,
  comments = [],
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  isBl = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [scales, setScales] = useState<Record<number, number>>({});
  const [activeTool, setActiveTool] = useState<'text' | 'line'>('text');
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean;
    mode?: 'add' | 'edit';
    id: string | null;
    pageIndex: number;
    xRatio: number;
    yRatio: number;
    text: string;
  }>({
    isOpen: false,
    id: null,
    pageIndex: 0,
    xRatio: 0,
    yRatio: 0,
    text: '',
  });

  const [drawingLine, setDrawingLine] = useState<{
    pageIndex: number;
    startX: number;
    startY: number;
    currentX: number;
  } | null>(null);

  // If real images exist in fileData, use them. Otherwise render the authentic SVG-rendered maritime page
  const images = useMemo(() => {
    if (fileData?.images?.length) return fileData.images;
    if (fileData?.image) return [fileData.image];
    return ['synthetic_page_1'];
  }, [fileData]);

  const isFieldMismatch = (fieldKey: string) =>
    discrepancies?.some((diff) => diff.field === fieldKey && !diff.isMatch);

  const calculateScale = (pageIndex: number, image: HTMLImageElement | null) => {
    if (image && image.naturalWidth > 0) {
      setScales((current) => ({
        ...current,
        [pageIndex]: (150 / 72) * (image.clientWidth / image.naturalWidth),
      }));
    } else {
      setScales((current) => ({
        ...current,
        [pageIndex]: 1.0,
      }));
    }
  };

  useEffect(() => {
    const recalculate = () => {
      Object.entries(pageRefs.current).forEach(([pageIndex, pageElement]) => {
        calculateScale(Number(pageIndex), pageElement?.querySelector('img') || null);
      });
    };
    recalculate();
    window.addEventListener('resize', recalculate);
    return () => window.removeEventListener('resize', recalculate);
  }, [images.length]);

  const handleImageMouseDown = (e: React.MouseEvent, pageIndex: number) => {
    if (!enableComments || !onAddComment) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'line') {
      setDrawingLine({ pageIndex, startX: x, startY: y, currentX: x });
    } else {
      setCommentModal({
        isOpen: true,
        mode: 'add',
        id: Date.now().toString(),
        pageIndex,
        xRatio: x / rect.width,
        yRatio: y / rect.height,
        text: '',
      });
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!drawingLine) return;
      const pageElement = pageRefs.current[drawingLine.pageIndex];
      if (!pageElement) return;
      const rect = pageElement.getBoundingClientRect();

      let x = e.clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      setDrawingLine((prev) => (prev ? { ...prev, currentX: x } : null));
    };

    const handleGlobalMouseUp = () => {
      if (!drawingLine) return;
      const pageElement = pageRefs.current[drawingLine.pageIndex];
      if (!pageElement) {
        setDrawingLine(null);
        return;
      }
      const widthPx = pageElement.clientWidth;
      const heightPx = pageElement.clientHeight;
      const startX = Math.min(drawingLine.startX, drawingLine.currentX);
      const endX = Math.max(drawingLine.startX, drawingLine.currentX);
      const lineWidth = endX - startX;

      if (lineWidth > 5 && onAddComment) {
        onAddComment({
          id: Date.now().toString(),
          type: 'line',
          pageIndex: drawingLine.pageIndex,
          xRatio: startX / widthPx,
          yRatio: drawingLine.startY / heightPx,
          lineWidth: lineWidth,
        });
      }
      setDrawingLine(null);
    };

    if (drawingLine) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [drawingLine, onAddComment]);

  const handleSaveTextComment = () => {
    if (!commentModal.text.trim()) return;
    const payload: CommentItem = {
      id: commentModal.id || Date.now().toString(),
      type: 'text',
      pageIndex: commentModal.pageIndex,
      xRatio: commentModal.xRatio,
      yRatio: commentModal.yRatio,
      text: commentModal.text,
    };

    if (commentModal.mode === 'edit' && onUpdateComment) {
      onUpdateComment(payload.id, payload);
    } else if (onAddComment) {
      onAddComment(payload);
    }
    setCommentModal({
      isOpen: false,
      id: null,
      pageIndex: 0,
      xRatio: 0,
      yRatio: 0,
      text: '',
    });
  };

  // Render bounding box spotlights (Matching MLT_DocumentCompare exact logic)
  const renderBoxes = (pageIndex: number) => {
    if (!fileData || !fileData.data) return null;

    return Object.entries(fileData.data).flatMap(([key, item]) => {
      const { bbox: rawBbox, char_bboxes } = parseFieldData(item);
      const mismatch = isFieldMismatch(key);

      const boxesToDraw =
        mismatch && Array.isArray(char_bboxes) && char_bboxes.length > 0
          ? char_bboxes
          : Array.isArray(rawBbox)
          ? rawBbox
          : rawBbox
          ? [rawBbox]
          : [];

      return boxesToDraw
        .map(normalizeBoxCoords)
        .filter((box): box is BBoxCoord => box !== null && (box.page ?? 0) === pageIndex)
        .map((box, index) => {
          const scale = scales[pageIndex] || 1;

          let bgColor = 'transparent';
          let borderColor = 'transparent';
          let zIndex = 1;

          // MLT_DocumentCompare Spotlight color states
          if (mismatch && drawHighlights) {
            bgColor = 'rgba(239, 68, 68, 0.35)'; // Red for discrepancies
            borderColor = 'rgba(239, 68, 68, 0.8)';
            zIndex = 2;
          }

          if (selectedField === key) {
            bgColor = 'rgba(254, 240, 138, 0.65)'; // Yellow spotlight on select
            borderColor = '#eab308';
            zIndex = 10;
          } else if (hoveredField === key) {
            bgColor = 'rgba(59, 130, 246, 0.45)'; // Blue spotlight on hover
            borderColor = '#3b82f6';
            zIndex = 5;
          }

          return (
            <div
              key={`box-${key}-${index}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedField(key);
              }}
              onMouseEnter={() => setHoveredField(key)}
              onMouseLeave={() => setHoveredField(null)}
              title={`${key.replace(/_/g, ' ').toUpperCase()}: ${
                typeof item === 'object' ? item.value : item
              }`}
              style={{
                position: 'absolute',
                left: `${box.x * scale}px`,
                top: `${box.y * scale}px`,
                width: `${Math.max(box.width * scale, 4)}px`,
                height: `${Math.max(box.height * scale, 4)}px`,
                backgroundColor: bgColor,
                border: borderColor !== 'transparent' ? `2px solid ${borderColor}` : '1px dashed rgba(148, 163, 184, 0.25)',
                borderRadius: '3px',
                cursor: 'pointer',
                pointerEvents: 'auto',
                zIndex,
                transition: 'background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease',
                boxShadow:
                  selectedField === key
                    ? '0 0 10px rgba(234, 179, 8, 0.7)'
                    : hoveredField === key
                    ? '0 0 10px rgba(59, 130, 246, 0.7)'
                    : undefined,
              }}
            >
              {/* Optional Field Tag Indicator for Selected or Hovered Box */}
              {(selectedField === key || hoveredField === key) && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    left: 0,
                    backgroundColor: selectedField === key ? '#854d0e' : '#1e3a8a',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 20,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  {key.replace(/_/g, ' ').toUpperCase()}
                </div>
              )}
            </div>
          );
        });
    });
  };

  return (
    <div
      style={{
        flex: 1,
        padding: '16px',
        border: '1px solid #334155',
        borderRadius: '12px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          color: '#f1f5f9',
          borderBottom: '2px solid #334155',
          paddingBottom: '10px',
          margin: '0 0 14px 0',
          fontSize: '1em',
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </h2>

      {/* Comment & Annotation Toolbar (from MLT_DocumentCompare) */}
      {enableComments && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '14px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTool('text')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px',
              border: activeTool === 'text' ? '2px solid #3b82f6' : '1px solid #475569',
              backgroundColor: activeTool === 'text' ? '#1e3a8a' : '#1e293b',
              color: activeTool === 'text' ? '#93c5fd' : '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📝</span>
            <span>พิมพ์ข้อความ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('line')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px',
              border: activeTool === 'line' ? '2px solid #ef4444' : '1px solid #475569',
              backgroundColor: activeTool === 'line' ? '#7f1d1d' : '#1e293b',
              color: activeTool === 'line' ? '#fca5a5' : '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>➖</span>
            <span>ลากเส้นขีดฆ่า</span>
          </button>
        </div>
      )}

      {/* Document Viewport Container (Height 700-1000px scrollable) */}
      <div style={{ textAlign: 'center' }}>
        <div
          ref={containerRef}
          style={{
            height: '780px',
            overflowY: 'auto',
            position: 'relative',
            border: '1px solid #334155',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          {images.map((img, pageIndex) => (
            <div
              key={pageIndex}
              ref={(element) => {
                pageRefs.current[pageIndex] = element;
              }}
              style={{
                position: 'relative',
                marginBottom: pageIndex === images.length - 1 ? 0 : '16px',
                cursor: enableComments
                  ? activeTool === 'line'
                    ? 'ew-resize'
                    : 'text'
                  : 'default',
                minHeight: '842px',
                width: '100%',
                backgroundColor: '#ffffff',
              }}
              onMouseDown={(e) => handleImageMouseDown(e, pageIndex)}
            >
              {img.startsWith('data:image') || img.startsWith('http') || img.startsWith('/') ? (
                <img
                  src={img}
                  alt={`${title} page ${pageIndex + 1}`}
                  onLoad={(event) => calculateScale(pageIndex, event.currentTarget)}
                  style={{
                    width: '100%',
                    display: 'block',
                    userSelect: 'none',
                    WebkitUserDrag: 'none',
                  } as React.CSSProperties}
                  draggable={false}
                />
              ) : (
                /* Authentic Document Paper with exact Coordinates matching maritime layout */
                <div
                  style={{
                    width: '100%',
                    height: '842px',
                    position: 'relative',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontFamily: '"Courier New", Courier, monospace',
                    padding: '24px',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    userSelect: 'none',
                  }}
                >
                  {/* Document Header */}
                  <div
                    style={{
                      borderBottom: '2px solid #0f172a',
                      paddingBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px' }}>
                        {isBl ? 'OCEAN BILL OF LADING' : 'SHIPPING INSTRUCTION / PARTICULAR'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        {isBl
                          ? 'CARRIER ISSUED ORIGINAL / DRAFT'
                          : 'SHIPPER EXPORT DOCUMENTATION'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold' }}>PAGE 1 OF 1</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>FORM REV. 2026/MLT</div>
                    </div>
                  </div>

                  {/* Render simulated layout lines and text placeholders */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '50px',
                      top: '95px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#64748b',
                    }}
                  >
                    1. SHIPPER / EXPORTER:
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '50px',
                      top: '110px',
                      width: '260px',
                      fontSize: '11px',
                      lineHeight: '1.3',
                      color: '#0f172a',
                    }}
                  >
                    {fileData?.data?.shipper?.value || ''}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      left: '420px',
                      top: '55px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#64748b',
                    }}
                  >
                    BOOKING NO.:
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '420px',
                      top: '70px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#0f172a',
                    }}
                  >
                    {fileData?.data?.booking_no?.value || ''}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      left: '50px',
                      top: '172px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#64748b',
                    }}
                  >
                    2. CONSIGNEE:
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '50px',
                      top: '185px',
                      width: '260px',
                      fontSize: '11px',
                      lineHeight: '1.3',
                      color: '#0f172a',
                    }}
                  >
                    {fileData?.data?.consignee?.value || ''}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      left: '50px',
                      top: '247px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#64748b',
                    }}
                  >
                    3. NOTIFY PARTY:
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '50px',
                      top: '260px',
                      width: '260px',
                      fontSize: '11px',
                      lineHeight: '1.3',
                      color: '#0f172a',
                    }}
                  >
                    {fileData?.data?.notify_party?.value || ''}
                  </div>

                  {/* Route Grid */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '50px',
                      top: '305px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#64748b',
                    }}
                  >
                    PRE-CARRIAGE / FEEDER:
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '50px',
                      top: '320px',
                      fontSize: '11px',
                      color: '#0f172a',
                    }}
                  >
                    {fileData?.data?.pre_carriage_by?.value || '-'}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      left: '220px',
                      top: '305px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#64748b',
                    }}
                  >
                    OCEAN VESSEL & VOYAGE:
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '220px',
                      top: '320px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#0f172a',
                    }}
                  >
                    {fileData?.data?.vessel?.value || '-'}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      left: '50px',
                      top: '342px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#64748b',
                    }}
                  >
                    PORT OF LOADING:
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '50px',
                      top: '355px',
                      fontSize: '11px',
                      color: '#0f172a',
                    }}
                  >
                    {fileData?.data?.port_of_loading?.value || '-'}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      left: '220px',
                      top: '342px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#64748b',
                    }}
                  >
                    PORT OF DISCHARGE:
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '220px',
                      top: '355px',
                      fontSize: '11px',
                      color: '#0f172a',
                    }}
                  >
                    {fileData?.data?.port_of_discharge?.value || '-'}
                  </div>

                  {/* Cargo Description Area */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '50px',
                      top: '395px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#64748b',
                    }}
                  >
                    CONTAINER NO. / SEAL:
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '50px',
                      top: '410px',
                      width: '180px',
                      fontSize: '10px',
                      whiteSpace: 'pre-wrap',
                      color: '#0f172a',
                    }}
                  >
                    {fileData?.data?.mark?.value || ''}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      left: '240px',
                      top: '395px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#64748b',
                    }}
                  >
                    COMMODITY DESCRIPTION:
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '240px',
                      top: '410px',
                      width: '200px',
                      fontSize: '10px',
                      whiteSpace: 'pre-wrap',
                      color: '#0f172a',
                    }}
                  >
                    {fileData?.data?.description?.value || ''}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      left: '450px',
                      top: '395px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#64748b',
                    }}
                  >
                    GROSS WEIGHT:
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '450px',
                      top: '410px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#0f172a',
                    }}
                  >
                    {fileData?.data?.gross_weight?.value || ''}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      left: '450px',
                      top: '435px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#64748b',
                    }}
                  >
                    MEASUREMENT / CBM:
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '450px',
                      top: '450px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#0f172a',
                    }}
                  >
                    {fileData?.data?.measurement?.value || ''}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      left: '450px',
                      top: '475px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#64748b',
                    }}
                  >
                    FREIGHT TERMS:
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '450px',
                      top: '490px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#0f172a',
                    }}
                  >
                    {fileData?.data?.freight_term?.value || ''}
                  </div>

                  {/* Watermark in background */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '55%',
                      transform: 'translate(-50%, -50%) rotate(-30deg)',
                      fontSize: '48px',
                      fontWeight: 900,
                      color: 'rgba(203, 213, 225, 0.25)',
                      pointerEvents: 'none',
                      letterSpacing: '8px',
                    }}
                  >
                    {isBl ? 'DRAFT B/L' : 'SI VERIFIED'}
                  </div>
                </div>
              )}

              {/* Render spotlight boxes */}
              {renderBoxes(pageIndex)}

              {/* Dragging line preview */}
              {drawingLine && drawingLine.pageIndex === pageIndex && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${Math.min(drawingLine.startX, drawingLine.currentX)}px`,
                    top: `${drawingLine.startY}px`,
                    width: `${Math.abs(drawingLine.currentX - drawingLine.startX)}px`,
                    height: '2px',
                    backgroundColor: '#ef4444',
                    zIndex: 100,
                    pointerEvents: 'none',
                    boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)',
                  }}
                />
              )}

              {/* User comments and draggable annotations */}
              {comments
                .filter((c) => c.pageIndex === pageIndex)
                .map((comment) => (
                  <DraggableComment
                    key={comment.id}
                    comment={comment}
                    containerWidth={pageRefs.current[pageIndex]?.clientWidth || 595}
                    containerHeight={pageRefs.current[pageIndex]?.clientHeight || 842}
                    onUpdate={onUpdateComment}
                    onDelete={onDeleteComment}
                    onEdit={(cmt) =>
                      setCommentModal({
                        isOpen: true,
                        mode: 'edit',
                        id: cmt.id,
                        pageIndex: cmt.pageIndex,
                        xRatio: cmt.xRatio,
                        yRatio: cmt.yRatio,
                        text: cmt.text || '',
                      })
                    }
                  />
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Comment Input Modal (Original from MLT_DocumentCompare) */}
      {commentModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '450px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
              border: '1px solid #334155',
              color: '#f8fafc',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                color: '#f1f5f9',
                fontSize: '1.15em',
                fontWeight: 'bold',
              }}
            >
              📝 พิมพ์ข้อความที่ถูกต้อง
            </h3>
            <textarea
              autoFocus
              value={commentModal.text}
              onChange={(e) => setCommentModal({ ...commentModal, text: e.target.value })}
              placeholder="พิมพ์ข้อความที่ต้องการบันทึกหรือแจ้งเตือน..."
              style={{
                width: '100%',
                height: '110px',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #475569',
                fontFamily: 'inherit',
                fontSize: '0.95em',
                resize: 'none',
                outline: 'none',
                backgroundColor: '#0f172a',
                color: '#ffffff',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => setCommentModal({ isOpen: false, id: null, pageIndex: 0, xRatio: 0, yRatio: 0, text: '' })}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  backgroundColor: '#334155',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12px',
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveTextComment}
                style={{
                  padding: '8px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)',
                }}
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

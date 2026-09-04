import React, { useEffect, useRef, useState } from 'react';
import DocumentPane from './DocumentPane';
import logo from './assets/LOGO2.png';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const DiffText = ({ diffData }) => {
  if (!diffData || diffData.length === 0) return null;
  return (
    <>
      {diffData.map((part, index) => (
        <span key={index} className={`diff-${part.tag}`}>
          {part.value}
        </span>
      ))}
    </>
  );
};

// ============================================================
// Parse field data
// ============================================================
const parseFieldData = (val) => {
  if (val === null || val === undefined || val === '') {
    return { text: '', bbox: null };
  }
  if (typeof val === 'object') {
    return {
      text: val.value !== undefined ? String(val.value) : '',
      bbox: val.bbox || null,
    };
  }
  return { text: String(val), bbox: null };
};

const parseDisplayFieldData = (val) => {
  if (val && typeof val === 'object' && val.clean_value !== undefined) {
    return { text: String(val.clean_value ?? ''), bbox: val.bbox || null };
  }
  return parseFieldData(val);
};

// ============================================================
// Theme — enterprise slate palette
// ============================================================
const theme = {
  bg: '#f0f2f5',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  ink: '#111827',
  inkSoft: '#6b7280',
  inkMid: '#374151',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',

  navy: '#0f172a',
  navyMid: '#1e293b',

  blue: '#1d4ed8',
  blueHover: '#1e40af',
  blueSoft: '#eff6ff',
  blueAccent: '#3b82f6',

  green: '#15803d',
  greenSoft: '#f0fdf4',
  greenAccent: '#22c55e',

  red: '#b91c1c',
  redSoft: '#fef2f2',
  redAccent: '#ef4444',

  amber: '#b45309',
  amberSoft: '#fffbeb',

  shadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
  shadowMd: '0 4px 24px rgba(0,0,0,0.10)',
  shadowLg: '0 8px 40px rgba(0,0,0,0.12)',
};

// ============================================================
// Translations
// ============================================================
const translations = {
  th: {
    language: 'ภาษา',
    verification: 'MLT Verification',
    heading: 'ระบบเปรียบเทียบเอกสาร (Demo)',
    subheading: 'เครื่องมือสำหรับตรวจสอบเอกสาร MARITIME ALLIANCES.',
    originalDocument: 'Bill of Lading (B/L)',
    originalDescription: 'นำเข้าเอกสารที่นี่',
    programDocument: 'Shipping Instruction',
    programDescription: 'นำเข้าเอกสารที่นี่',
    template: 'รูปแบบเอกสาร:',
    uploadRequired: 'กรุณาอัปโหลดเอกสารให้ครบทั้ง 2 ฝั่ง',
    comparing: 'กำลังเปรียบเทียบเอกสาร...',
    compare: 'เปรียบเทียบข้อมูล',
    templateLoadError: 'ไม่สามารถโหลดรายการรูปแบบเอกสารได้',
    unknownError: 'ไม่ทราบข้อผิดพลาด',
    dataFetchError: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
    comparisonTitle: 'ตารางเปรียบเทียบข้อมูล',
    comparisonHint: 'ข้อมูลแต่ละ field อยู่ในแถวเดียวกันเพื่อเทียบซ้าย–ขวาได้ทันที · คลิกแถวเพื่อดูตำแหน่งบน PDF',
    field: 'ฟิลด์',
    noData: '(ไม่พบข้อมูล)',
    errorList: 'รายการข้อมูลที่ไม่ตรงกัน',
    discrepanciesFound: 'พบข้อมูลไม่ตรงกัน',
    points: 'จุด',
    fieldName: 'ชื่อฟิลด์',
    allMatch: 'ยอดเยี่ยม! ข้อมูลตรงกันทุกจุด',
    howToUse: 'วิธีใช้: อัปโหลดเอกสารสองฉบับ เลือกเทมเพลตที่ถูกต้อง แล้วคลิก "เปรียบเทียบ" เพื่อดูความแตกต่าง',
    stepUpload1: 'อัปโหลดฝั่งซ้าย',
    stepUpload2: 'อัปโหลดฝั่งขวา',
    stepTemplate: 'เลือกเทมเพลต',
    stepCompare: 'เปรียบเทียบ',
    stepReview: 'ตรวจสอบผล',
    dropzone: 'วางไฟล์ที่นี่หรือคลิกเพื่อเลือก',
    pdfOnly: 'รองรับไฟล์ PDF เท่านั้น',
    fileSelected: 'เลือกไฟล์แล้ว',
    clear: 'ลบ',
  },
  en: {
    language: 'Language',
    verification: 'MLT Verification',
    heading: 'Document Comparison System (Demo)',
    subheading: 'A document verification tool for MARITIME ALLIANCES.',
    originalDocument: 'Bill of Lading (B/L)',
    originalDescription: 'Upload your file here',
    programDocument: 'Shipping Instruction',
    programDescription: 'Upload your file here',
    template: 'Template:',
    uploadRequired: 'Please upload both documents.',
    comparing: 'Comparing documents...',
    compare: 'Compare Documents',
    templateLoadError: 'Unable to load the template list',
    unknownError: 'Unknown Error',
    dataFetchError: 'An error occurred while retrieving data.',
    comparisonTitle: 'Field Comparison',
    comparisonHint: 'Each field is aligned in one row for easy side-by-side comparison · Click a row to view its location in the PDF.',
    field: 'Field',
    noData: '(Not found)',
    errorList: 'Discrepancy List',
    discrepanciesFound: 'discrepancies found',
    points: '',
    fieldName: 'Field Name',
    allMatch: 'All fields match.',
    howToUse: 'How to use: Upload two documents, select the appropriate template, and click "Compare" to see the differences.',
    stepUpload1: 'Upload Left',
    stepUpload2: 'Upload Right',
    stepTemplate: 'Select Templates',
    stepCompare: 'Compare',
    stepReview: 'Review',
    dropzone: 'Drop file here or click to browse',
    pdfOnly: 'PDF files only',
    fileSelected: 'File selected',
    clear: 'Remove',
  },
};

// ============================================================
// Templates for each document type
// ============================================================
const billOfLadingTemplateOptions = [
  { value: 'OOCL', label: 'OOCL' },
  { value: 'YANGMING', label: 'YANG MING' },
  { value: 'ONE', label: 'ONE' },
  { value: 'SHANGHAI', label: 'SHANGHAI JINJIANG' },
  { value: 'WANHAI', label: 'WANHAI' },
];

const shippingInstructionTemplateOptions = [
  { value: 'MCKEY', label: 'MCKEY' },
  { value: 'SUPER_SIERRA', label: 'B.FOODS/NO LOGO' },
  { value: 'BFOODS_1', label: 'B.FOODS/LOGO BETAGRO UPSTAIRS ' },
  // { value: 'BFOODS_2', label: 'B.FOODS/LOGO BETAGRO UPSTAIRS' },
  { value: 'BFOODS_3', label: 'B.FOODS/LOGO BETAGRO RIGHT SIDE' },
  { value: 'PPI', label: 'B.FOOD/ONE/PPI' },
  { value: 'AJIMOMOTO', label: 'AJINOMOTO' },
  { value: 'SIAMCHAI', label: 'SIAMCHAI' },
  { value: 'SURAPON', label: 'SURAPON' },
  { value: 'POLYPLEX', label: 'POLYPLEX' },
  { value: 'BETAGRO', label: 'BETAGRO' },
  { value: 'FORTUNE', label: 'FORTUNE'},
  { value: 'GC-M', label: 'GC-M' },
  { value: 'MITSUI', label: 'MITSUI'}
];

// ============================================================
// Icons
// ============================================================
const IconDoc = ({ size = 32, color = theme.blueAccent }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
);
const IconCheck = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IconX = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const IconWarn = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const IconUpload = ({ size = 28, color = theme.inkSoft }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
);
const IconSpinner = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" style={{ animation: 'spin 0.8s linear infinite', transformOrigin: '50% 50%' }}/></svg>
);
const IconMenu = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const IconDownload = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const IconPrint = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
);
const IconMessageSquare = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);

// ============================================================
// UploadZone
// ============================================================
const UploadZone = ({ fileRef, file, onFileChange, onClear, accentColor, accentSoft, copy, label }) => {
  const [dragging, setDragging] = useState(false);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      const dt = new DataTransfer();
      dt.items.add(dropped);
      if (fileRef.current) fileRef.current.files = dt.files;
      onFileChange(dropped);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => onFileChange(e.target.files[0])}
        style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }}
      />
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? accentColor : file ? accentColor : theme.borderStrong}`,
          borderRadius: '10px',
          backgroundColor: dragging ? accentSoft : file ? accentSoft : theme.surfaceAlt,
          padding: '22px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconDoc size={18} color="#fff" />
            </div>
            <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82em', color: theme.inkSoft, marginBottom: 2 }}>{copy.fileSelected}</div>
              <div style={{ fontWeight: 700, color: theme.ink, fontSize: '0.9em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              style={{
                zIndex: 10, position: 'relative', flexShrink: 0, width: 28, height: 28, borderRadius: 6,
                border: `1px solid ${theme.borderStrong}`, backgroundColor: theme.surface, color: theme.red,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <IconX size={14} />
            </button>
          </div>
        ) : (
          <div>
            <IconUpload size={26} color={theme.inkSoft} />
            <div style={{ marginTop: 8, fontSize: '0.88em', fontWeight: 600, color: theme.inkMid }}>{copy.dropzone}</div>
            <div style={{ marginTop: 4, fontSize: '0.78em', color: theme.inkSoft }}>{copy.pdfOnly}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// ComparisonFields
// ============================================================
const ComparisonFields = ({ originalData, programData, discrepancies, selectedField, onSelectField, copy, leftTitle, rightTitle }) => {
  const fieldKeys = Array.from(new Set([
    ...Object.keys(originalData || {}),
    ...Object.keys(programData || {}),
  ]));

  const discrepancyFields = new Set((discrepancies || []).map(({ field }) => field));

  return (
    <section style={{ marginTop: 32, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.surface, boxShadow: theme.shadow }}>
      <div style={{ padding: '18px 24px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.surfaceAlt }}>
        <h2 style={{ color: theme.ink, margin: 0, fontSize: '1.05em', fontWeight: 700, letterSpacing: '-0.01em' }}>{copy.comparisonTitle}</h2>
        <p style={{ color: theme.inkSoft, margin: '4px 0 0', fontSize: '0.83em' }}>{copy.comparisonHint}</p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 720 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px,0.75fr) minmax(260px,1.6fr) minmax(260px,1.6fr)', backgroundColor: '#f1f5f9', borderBottom: `1px solid ${theme.border}` }}>
            {[copy.field, leftTitle, rightTitle].map((h, i) => (
              <div key={i} style={{ padding: '10px 16px', fontSize: '0.75em', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.inkSoft }}>
                {h}
              </div>
            ))}
          </div>

          {fieldKeys.map((key) => {
            const isMismatch = discrepancyFields.has(key);
            const isSelected = selectedField === key;
            const originalValue = parseDisplayFieldData(originalData?.[key]).text;
            const programValue = parseDisplayFieldData(programData?.[key]).text;

            const rowBg = isSelected ? '#fefce8' : isMismatch ? '#fff5f5' : theme.surface;

            return (
              <div
                key={key}
                onClick={() => onSelectField(key)}
                style={{
                  display: 'grid', gridTemplateColumns: 'minmax(160px,0.75fr) minmax(260px,1.6fr) minmax(260px,1.6fr)',
                  cursor: 'pointer', backgroundColor: rowBg, borderBottom: `1px solid ${theme.border}`, transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = isMismatch ? '#ffeded' : '#f8fafc'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = rowBg; }}
              >
                <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.04em', color: isMismatch ? theme.red : theme.inkMid, borderRight: `1px solid ${theme.border}`, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  {isMismatch && <span style={{ marginTop: 1, flexShrink: 0, color: theme.redAccent }}><IconWarn size={13}/></span>}
                  {key.replace(/_/g, ' ')}
                </div>
                <div style={{ padding: '12px 16px', color: theme.ink, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.55, fontSize: '0.9em', borderRight: `1px solid ${theme.border}` }}>
                  {originalValue || <span style={{ color: theme.inkSoft, fontStyle: 'italic' }}>{copy.noData}</span>}
                </div>
                <div style={{ padding: '12px 16px', color: theme.ink, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.55, fontSize: '0.9em' }}>
                  {programValue || <span style={{ color: theme.inkSoft, fontStyle: 'italic' }}>{copy.noData}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ============================================================
// ComparisonPage (Component กลาง)
// ============================================================
const ComparisonPage = ({
  pageTitle,
  pageSubheading,
  leftTitle,
  leftDesc,
  rightTitle,
  rightDesc,
  leftTemplates,
  rightTemplates,
  copy
}) => {
  const [fileOriginal, setFileOriginal] = useState(null); // ฝั่งขวา (B/L)
  const [fileProgram, setFileProgram] = useState(null);   // ฝั่งซ้าย (SI)
  const originalFileInputRef = useRef(null);
  const programFileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [companyOrig, setCompanyOrig] = useState(rightTemplates[0]?.value || '');
  const [companyProg, setCompanyProg] = useState(leftTemplates[0]?.value || '');

  const [selectedField, setSelectedField] = useState(null);
  const [hoveredField, setHoveredField] = useState(null);

  // โหมดการเขียนคอมเมนต์
  const [isCommenting, setIsCommenting] = useState(false);
  // State สำหรับเก็บข้อมูล Comment ที่พิมพ์บน PDF Preview
  const [pdfComments, setPdfComments] = useState([]);

  const handleProcessFiles = async () => {
    if (!fileOriginal || !fileProgram) { setErrorMessage(copy.uploadRequired); return; }
    setLoading(true);
    setIsCommenting(false);
    setErrorMessage('');
    setResults(null);
    setSelectedField(null);
    // แนะนำ: หากต้องการเก็บคอมเมนต์เก่าไว้ ให้ลบการล้าง State นี้ออก 
    // แต่ในเคสอัปโหลดไฟล์ใหม่ การล้างทิ้งจะปลอดภัยกว่าเพื่อป้องกันพิกัดเพี้ยน
    if (pdfComments.length > 0) {
       if(confirm("การเปรียบเทียบใหม่จะล้าง Marks เดิมทิ้ง ต้องการดำเนินการต่อหรือไม่?")) { setPdfComments([]); } else { setLoading(false); return; }
    }

    const formData = new FormData();
    formData.append('company_original', companyOrig);
    formData.append('company_program', companyProg);
    formData.append('file_original', fileOriginal);
    formData.append('file_program', fileProgram);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/v1/process-pdf`, { method: 'POST', body: formData });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorDetail = errorData.detail ? JSON.stringify(errorData.detail, null, 2) : copy.unknownError;
        throw new Error(`Backend Error (${response.status}):\n${errorDetail}`);
      }

      const result = await response.json();
      if (result.status === 'success') { setResults(result); }
      else { setErrorMessage(result.detail || copy.dataFetchError); }
    } catch (error) {
      console.error('Upload error details:', error.message);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateMarkedPDF = async () => {
    if (!fileOriginal) return null;
    try {
      const existingPdfBytes = await fileOriginal.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      pdfDoc.registerFontkit(fontkit);

      // 2. ดึงไฟล์ฟอนต์มา และเช็กด้วยว่าดึงสำเร็จไหม!
      const fontRes = await fetch('/fonts/THSarabunNew.ttf');
      if (!fontRes.ok) {
        throw new Error(`โหลดไฟล์ฟอนต์ไม่สำเร็จ (HTTP Status: ${fontRes.status}) โปรดเช็กว่าไฟล์อยู่ใน public/fonts/`);
      }

      const fontBytes = await fontRes.arrayBuffer();
      const customFont = await pdfDoc.embedFont(fontBytes);

      const pages = pdfDoc.getPages();

     pdfComments.forEach(comment => {
        const page = pages[comment.pageIndex];
        if (!page) return;

        const { width, height } = page.getSize();
        const fontSize = 12;
        
        const pdfX = comment.xRatio * width;
        const pdfY = height - (comment.yRatio * height) - fontSize; 

        // 🔥 ถ้าคอมเมนต์นี้เป็นโหมด "เส้นแดงขีดฆ่า"
        if (comment.type === 'line') {
           const lineY = pdfY + (fontSize / 2.5); // ขยับเส้นให้อยู่ประมาณกึ่งกลางบรรทัด
           page.drawLine({
              start: { x: pdfX, y: lineY },
              end: { x: pdfX + (comment.lineWidth || 60), y: lineY },
              thickness: 1.5,
              color: rgb(1, 0, 0)
           });
        } 
        // 🔥 ถ้าคอมเมนต์นี้เป็นโหมด "ข้อความ"
        else {
           if (comment.text && comment.text.trim() !== '') {
              page.drawText(comment.text, {
                x: pdfX,
                y: pdfY,
                size: fontSize,
                font: customFont,
                color: rgb(1, 0, 0),
              });
           }
        }
      });
      
      return await pdfDoc.save();
      
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert(`ไม่สามารถสร้าง PDF ได้เนื่องจาก:\n\n${error.message}`);
      throw error;
    }
  };

  const handleExportPDF = async () => {
    try {
      const pdfBytes = await generateMarkedPDF();
      if (!pdfBytes) return;
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Marked_${fileOriginal.name}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการ Export PDF");
    }
  };

  const handlePrintPDF = async () => {
    try {
      const pdfBytes = await generateMarkedPDF();
      if (!pdfBytes) return;
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) win.focus();
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการสั่งพิมพ์");
    }
  };

  const selectStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: theme.surface,
    color: theme.ink, boxSizing: 'border-box', cursor: 'pointer', fontSize: '0.9em', fontWeight: 500, appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32,
  };

  const labelStyle = { display: 'block', marginBottom: 6, fontWeight: 600, color: theme.inkMid, fontSize: '0.82em', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ maxWidth: 1500, margin: '0 auto', padding: '0 36px 64px' }}>
      {/* ======== PAGE HEADER ======== */}
      <div style={{ padding: '44px 0 32px', borderBottom: `1px solid ${theme.border}`, marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: '0.75em', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.blueAccent }}>
              Document Verification
            </p>
            <h1 style={{ margin: 0, fontSize: '1.9em', fontWeight: 800, color: theme.ink, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              {pageTitle}
            </h1>
            <p style={{ margin: '10px 0 0', color: theme.inkSoft, fontSize: '0.95em', lineHeight: 1.6 }}>
              {pageSubheading}
            </p>
          </div>
        </div>
      </div>

      <main>
        {/* ======== UPLOAD CARDS ======== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: 24, marginBottom: 24 }}>

          {/* ---- Card 1: ฝั่งซ้าย ---- */}
          <div style={{ backgroundColor: theme.surface, borderRadius: 14, border: `1px solid ${theme.border}`, boxShadow: theme.shadow, overflow: 'hidden' }}>
            <div style={{ height: 4, backgroundColor: theme.green }} />
            <div style={{ padding: '22px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: theme.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75em', fontWeight: 800, color: theme.green }}>01</span>
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: theme.ink, fontSize: '1em' }}>{leftTitle}</div>
                  <div style={{ fontSize: '0.8em', color: theme.inkSoft, marginTop: 1 }}>{leftDesc}</div>
                </div>
                {fileProgram && (
                  <div style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', backgroundColor: theme.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.green, flexShrink: 0 }}>
                    <IconCheck size={13} />
                  </div>
                )}
              </div>

              <UploadZone
                fileRef={programFileInputRef}
                file={fileProgram}
                onFileChange={setFileProgram}
                onClear={() => { setFileProgram(null); if (programFileInputRef.current) programFileInputRef.current.value = ''; }}
                accentColor={theme.green}
                accentSoft={theme.greenSoft}
                copy={copy}
                label={leftTitle}
              />

              <div style={{ marginTop: 18 }}>
                <label style={labelStyle}>{copy.template}</label>
                <select value={companyProg} onChange={(e) => setCompanyProg(e.target.value)} style={selectStyle}>
                  {leftTemplates.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label?.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ---- Card 2: ฝั่งขวา ---- */}
          <div style={{ backgroundColor: theme.surface, borderRadius: 14, border: `1px solid ${theme.border}`, boxShadow: theme.shadow, overflow: 'hidden' }}>
            <div style={{ height: 4, backgroundColor: theme.blue }} />
            <div style={{ padding: '22px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: theme.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75em', fontWeight: 800, color: theme.blue }}>02</span>
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: theme.ink, fontSize: '1em' }}>{rightTitle}</div>
                  <div style={{ fontSize: '0.8em', color: theme.inkSoft, marginTop: 1 }}>{rightDesc}</div>
                </div>
                {fileOriginal && (
                  <div style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', backgroundColor: theme.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.green, flexShrink: 0 }}>
                    <IconCheck size={13} />
                  </div>
                )}
              </div>

              <UploadZone
                fileRef={originalFileInputRef}
                file={fileOriginal}
                onFileChange={setFileOriginal}
                onClear={() => { setFileOriginal(null); if (originalFileInputRef.current) originalFileInputRef.current.value = ''; }}
                accentColor={theme.blue}
                accentSoft={theme.blueSoft}
                copy={copy}
                label={rightTitle}
              />

              <div style={{ marginTop: 18 }}>
                <label style={labelStyle}>{copy.template}</label>
                <select value={companyOrig} onChange={(e) => setCompanyOrig(e.target.value)} style={selectStyle}>
                  {rightTemplates.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label?.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ======== ACTIONS (Compare / Export) ======== */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28 }}>
          <button
            onClick={handleProcessFiles}
            disabled={loading}
            style={{
              padding: '13px 48px', fontSize: '0.95em', fontWeight: 700,
              backgroundColor: loading ? '#94a3b8' : theme.blue, color: '#fff',
              border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s, transform 0.1s',
              boxShadow: loading ? 'none' : `0 4px 20px rgba(29,78,216,0.35)`,
              display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = theme.blueHover; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = theme.blue; }}
          >
            {loading && <IconSpinner size={16} />}
            {loading ? copy.comparing : copy.compare}
          </button>

          {results && (
            <>
              <button
                onClick={() => setIsCommenting(!isCommenting)}
                style={{
                  padding: '13px 32px', fontSize: '0.95em', fontWeight: 700,
                  backgroundColor: isCommenting ? theme.amber : theme.inkMid, color: '#fff',
                  border: 'none', borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: `0 4px 15px rgba(0,0,0,0.15)`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <IconMessageSquare />
                {isCommenting ? "Finish Commenting" : "Add Comment"}
              </button>

              <button
                onClick={handleExportPDF}
                style={{
                  padding: '13px 32px', fontSize: '0.95em', fontWeight: 700,
                  backgroundColor: '#111827', color: '#fff',
                  border: 'none', borderRadius: 10, cursor: 'pointer',
                  transition: 'background-color 0.2s, transform 0.1s',
                  boxShadow: `0 4px 20px rgba(15,23,42,0.35)`,
                  display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '0.01em',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.navyMid; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = theme.navy; }}
              >
                <IconDownload size={18} />
                Export PDF
              </button>

              <button
                onClick={handlePrintPDF}
                style={{
                  padding: '13px 32px', fontSize: '0.95em', fontWeight: 700,
                  backgroundColor: theme.surface, color: theme.ink,
                  border: `1px solid ${theme.borderStrong}`, borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: `0 4px 15px rgba(0,0,0,0.05)`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <IconPrint size={18} />
                Print
              </button>
            </>
          )}
        </div>

        {/* ======== ERROR MESSAGE ======== */}
        {errorMessage && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px',
            backgroundColor: theme.redSoft, color: theme.red, border: `1px solid #fecaca`,
            borderLeft: `4px solid ${theme.redAccent}`, borderRadius: 10, marginBottom: 24,
            fontWeight: 500, whiteSpace: 'pre-wrap', fontSize: '0.9em',
          }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}><IconWarn size={18} /></span>
            {errorMessage}
          </div>
        )}

        {/* ======== RESULTS ======== */}
        {results && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
              <span style={{ fontSize: '0.75em', fontWeight: 700, color: theme.inkSoft, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Document Preview
              </span>
              <div style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
            </div>

            {/* ส่วนแสดงผล PDF ซ้าย-ขวา */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'flex-start' }}>
              {/* ซ้าย (Shipping Instruction) */}
              <div style={{ border: `1px solid ${theme.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: theme.shadow }}>
                <div style={{ backgroundColor: theme.navy, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.greenAccent }} />
                  <span style={{ color: '#e2e8f0', fontSize: '0.8em', fontWeight: 700 }}>{leftTitle}</span>
                </div>
                <DocumentPane
                  title={leftTitle}
                  fileData={results.program}
                  discrepancies={results.discrepancies}
                  selectedField={selectedField}
                  setSelectedField={setSelectedField}
                  hoveredField={hoveredField}
                  setHoveredField={setHoveredField}
                  showFieldList={false}
                  notFoundLabel={copy.noData}
                  drawHighlights={false} 
                  enableComments={false}
                />
              </div>

              {/* ขวา (Bill of Lading) */}
              <div style={{ border: `1px solid ${theme.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: theme.shadow }}>
                <div style={{ backgroundColor: theme.navy, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.blueAccent }} />
                  <span style={{ color: '#e2e8f0', fontSize: '0.8em', fontWeight: 700 }}>{rightTitle}</span>
                </div>
                <DocumentPane
                  title={rightTitle}
                  fileData={results.original}
                  discrepancies={results.discrepancies}
                  selectedField={selectedField}
                  setSelectedField={setSelectedField}
                  hoveredField={hoveredField}
                  setHoveredField={setHoveredField}
                  showFieldList={false}
                  notFoundLabel={copy.noData}
                  drawHighlights={true} 
                  enableComments={isCommenting}
                  comments={pdfComments}
                  onAddComment={(cmt) => setPdfComments(prev => [...prev, cmt])}
                  onUpdateComment={(id, updated) => setPdfComments(prev => prev.map(c => c.id === id ? updated : c))}
                  onDeleteComment={(id) => setPdfComments(prev => prev.filter(c => c.id !== id))}
                />
              </div>
            </div>

            {/* ตาราง Discrepancies */}
            <div style={{
              marginTop: 28, border: `1px solid ${results.discrepancies.length > 0 ? '#fca5a5' : '#86efac'}`,
              borderLeft: `4px solid ${results.discrepancies.length > 0 ? theme.redAccent : theme.greenAccent}`,
              borderRadius: 14, backgroundColor: theme.surface, boxShadow: theme.shadow, overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 24px', backgroundColor: results.discrepancies.length > 0 ? theme.redSoft : theme.greenSoft,
                borderBottom: results.discrepancies.length > 0 ? `1px solid #fecaca` : `1px solid #bbf7d0`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ color: results.discrepancies.length > 0 ? theme.redAccent : theme.greenAccent }}>
                  {results.discrepancies.length > 0 ? <IconWarn size={20} /> : <IconCheck size={20} />}
                </span>
                <h2 style={{ margin: 0, fontSize: '1em', fontWeight: 700, color: results.discrepancies.length > 0 ? theme.red : theme.green }}>
                  {results.discrepancies.length > 0
                    ? `${copy.errorList}: ${results.discrepancies.length} ${copy.discrepanciesFound}`
                    : copy.allMatch}
                </h2>
              </div>

              {results.discrepancies.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: theme.surface, minWidth: 620 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#fef2f2' }}>
                        {[copy.fieldName, leftTitle, rightTitle].map((h, i) => (
                          <th key={i} style={{
                            padding: '10px 16px', textAlign: 'left', fontSize: '0.73em',
                            fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                            color: theme.red, borderBottom: `1px solid #fecaca`,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.discrepancies.map((diff, idx) => {
                        const isSelectedRow = selectedField === diff.field;
                        const programDiffData = diff.program_value.diff;
                        const originalDiffData = diff.original_value.diff;
                        const programRawText = programDiffData 
                          ? programDiffData.map(p => p.value).join('') 
                          : (parseDisplayFieldData(diff.program_value).text || '(ว่าง)');

                        return (
                          <tr
                            key={idx}
                            onClick={() => setSelectedField(diff.field)}
                            onMouseEnter={(e) => { setHoveredField(diff.field); if (!isSelectedRow) e.currentTarget.style.backgroundColor = '#fff5f5'; }}
                            onMouseLeave={(e) => { setHoveredField(null); if (!isSelectedRow) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            style={{ cursor: 'pointer', backgroundColor: isSelectedRow ? '#fefce8' : 'transparent', transition: 'background-color 0.15s' }}
                          >
                            <td style={{ borderBottom: `1px solid ${theme.border}`, padding: '11px 16px', fontWeight: 700, fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '0.04em', color: theme.inkMid, whiteSpace: 'nowrap' }}>
                              {diff.field.replace(/_/g, ' ')}
                            </td>
                            <td style={{ borderBottom: `1px solid ${theme.border}`, padding: '11px 16px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.88em' }}>
                              {programRawText || '(ว่าง)'}
                            </td>
                            <td style={{ borderBottom: `1px solid ${theme.border}`, padding: '11px 16px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.88em' }}>
                              {originalDiffData ? <DiffText diffData={originalDiffData} /> : (parseDisplayFieldData(diff.original_value).text || '(ว่าง)')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ตาราง ComparisonFields */}
            <ComparisonFields
              originalData={results.program.data}
              programData={results.original.data}
              discrepancies={results.discrepancies}
              selectedField={selectedField}
              onSelectField={setSelectedField}
              copy={copy}
              leftTitle={leftTitle}
              rightTitle={rightTitle}
            />
          </>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '32px 0 8px', color: theme.inkSoft, fontSize: '0.82em', borderTop: `1px solid ${theme.border}`, marginTop: 52 }}>
        {copy.howToUse}
      </footer>
    </div>
  );
};

// ============================================================
// Main App
// ============================================================
function App() {
  const [language, setLanguage] = useState('en');
  const copy = translations[language];
  
  const [activeTab, setActiveTab] = useState('MAIN');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getPageProps = () => {
    switch(activeTab) {
      case 'HBL':
        return {
          pageTitle: 'HBL Verification (Set 1)',
          pageSubheading: 'ตรวจสอบความถูกต้องระหว่าง SI จาก Shipper และ HBL จาก Maritime',
          leftTitle: 'SI FROM SHIPPER',
          leftDesc: copy.programDescription,
          rightTitle: 'HBL MARITIME',
          rightDesc: copy.originalDescription,
          leftTemplates: shippingInstructionTemplateOptions,
          rightTemplates: billOfLadingTemplateOptions,
        };
      case 'MBL':
        return {
          pageTitle: 'MBL Verification (Set 2)',
          pageSubheading: 'ตรวจสอบความถูกต้องระหว่าง SI จาก Maritime และ MBL ของสายเรือ',
          leftTitle: 'SI FROM MARITIME',
          leftDesc: copy.programDescription,
          rightTitle: 'MBL/ONE',
          rightDesc: copy.originalDescription,
          leftTemplates: shippingInstructionTemplateOptions,
          rightTemplates: billOfLadingTemplateOptions,
        };
      case 'MAIN':
      default:
        return {
          pageTitle: copy.heading,
          pageSubheading: copy.subheading,
          leftTitle: copy.programDocument,
          leftDesc: copy.programDescription,
          rightTitle: copy.originalDocument,
          rightDesc: copy.originalDescription,
          leftTemplates: shippingInstructionTemplateOptions,
          rightTemplates: billOfLadingTemplateOptions,
        };
    }
  };

  const currentProps = getPageProps();

  const menuItems = [
    { id: 'MAIN', label: 'หน้าหลักเดิม', desc: 'SI vs B/L' },
    { id: 'HBL', label: 'HBL (Set 1)', desc: 'SI Shipper vs HBL' },
    { id: 'MBL', label: 'MBL (Set 2)', desc: 'SI Maritime vs MBL' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: theme.bg, fontFamily: "'Times New Roman', 'TH Sarabun New', 'TH Sarabun PSK', serif" }}>
      <style>{`
        * { font-family: 'Sarabun', sans-serif !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        .diff-equal { color: #15803d; font-weight: 500; }
        .diff-insert { background-color: #fee2e2; color: #b91c1c; border-radius: 2px; padding: 0 2px; }
        .diff-delete { background-color: #fee2e2; color: #b91c1c; border-radius: 2px; padding: 0 2px; }
        select:focus, button:focus { outline: 2px solid #3b82f6; outline-offset: 2px; }
        
        .sidebar::-webkit-scrollbar { width: 6px; }
        .sidebar::-webkit-scrollbar-track { background: transparent; }
        .sidebar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        
        .main-content::-webkit-scrollbar { width: 8px; }
        .main-content::-webkit-scrollbar-track { background: transparent; }
        .main-content::-webkit-scrollbar-thumb { background-color: #94a3b8; border-radius: 10px; }
      `}</style>

      {/* ======== TOP NAV ======== */}
      <nav style={{ backgroundColor: theme.navy, borderBottom: `1px solid ${theme.navyMid}`, zIndex: 100 }}>
        <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{
                background: 'transparent', border: 'none', color: '#94a3b8',
                cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4,
                borderRadius: 4
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <IconMenu size={24} />
            </button>

            <img src={logo} alt="Maritime Alliance" style={{ height: 34, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.92 }} />
            <div style={{ width: 1, height: 20, backgroundColor: '#334155', flexShrink: 0 }} />
            <span style={{ color: '#94a3b8', fontSize: '0.8em', fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              {copy.verification}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#64748b', fontSize: '0.75em', fontWeight: 600, marginRight: 4 }}>{copy.language}</span>
            {['th', 'en'].map((code) => (
              <button key={code} type="button" onClick={() => setLanguage(code)} style={{
                padding: '5px 12px', borderRadius: 6,
                border: `1px solid ${language === code ? '#3b82f6' : '#334155'}`,
                backgroundColor: language === code ? '#1d4ed8' : 'transparent',
                color: language === code ? '#fff' : '#94a3b8',
                fontWeight: 700, fontSize: '0.78em', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {code === 'th' ? 'ไทย' : 'EN'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ======== LAYOUT ======== */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* ---- Sidebar ---- */}
        <aside className="sidebar" style={{
          width: isSidebarOpen ? 260 : 0,           
          opacity: isSidebarOpen ? 1 : 0,           
          visibility: isSidebarOpen ? 'visible' : 'hidden', 
          backgroundColor: theme.surface,
          borderRight: isSidebarOpen ? `1px solid ${theme.border}` : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          flexShrink: 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        }}>
          <div style={{ padding: '24px 16px 12px', width: 260 }}>
            <p style={{ margin: '0 0 12px 8px', fontSize: '0.75em', fontWeight: 700, color: theme.inkSoft, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Menu / โหมดการตรวจสอบ
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      padding: '12px 16px', borderRadius: 10,
                      backgroundColor: isActive ? theme.blueSoft : 'transparent',
                      border: `1px solid ${isActive ? theme.blueAccent : 'transparent'}`,
                      color: isActive ? theme.blue : theme.inkMid,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = theme.surfaceAlt; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.95em', marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.75em', color: isActive ? theme.blueAccent : theme.inkSoft }}>
                      {item.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ---- Main Content ---- */}
        <div className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
          <ComparisonPage
            key={activeTab} 
            {...currentProps}
            copy={copy}
          />
        </div>
      </div>

    </div>
  );
}

export default App;
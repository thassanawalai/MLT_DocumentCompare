import React, { useState, useRef, useEffect } from 'react';

// Helper function to parse field data
const parseFieldData = (val) => {
  if (val === null || val === undefined || val === '') return { text: '', bbox: null, char_bboxes: [] };
  if (typeof val === 'object') {
    return {
      text: val.value !== undefined ? String(val.value) : JSON.stringify(val),
      bbox: val.bbox || null,
      char_bboxes: val.char_bboxes || []
    };
  }
  return { text: String(val), bbox: null, char_bboxes: [] };
};

// Helper แปลงพิกัดไม่ว่ามาแบบไหนให้เป็น { x, y, width, height }
const normalizeBoxCoords = (box) => {
  if (!box) return null;
  // กรณีมาเป็น Array [x1, y1, x2, y2]
  if (Array.isArray(box) && box.length >= 4) {
    return {
      x: box[0],
      y: box[1],
      width: box[2] - box[0],
      height: box[3] - box[1],
      page: box[4] ?? 0
    };
  }
  // กรณีมาเป็น Object { x, y, width, height }
  if (box.x !== undefined && box.y !== undefined) {
    return {
      x: box.x,
      y: box.y,
      width: box.width ?? (box.x2 ? box.x2 - box.x : 0),
      height: box.height ?? (box.y2 ? box.y2 - box.y : 0),
      page: box.page ?? 0
    };
  }
  return null;
};

// --- Style Objects ---
const paneStyle = { 
  flex: 1, 
  padding: '20px', 
  border: '1px solid #ddd', 
  borderRadius: '8px', 
  backgroundColor: '#fafafa' 
};

const titleStyle = { 
  textAlign: 'center', 
  color: '#333', 
  borderBottom: '2px solid #ccc', 
  paddingBottom: '10px' 
};

const imageContainerStyle = { 
  height: '500px', 
  overflowY: 'auto', 
  position: 'relative',
  border: '1px solid #ccc',
  backgroundColor: '#fff'
};

const imageStyle = { 
  width: '100%', 
  display: 'block' 
};

// --- Component ---
const DocumentPane = ({ 
  title, 
  fileData, 
  discrepancies, 
  selectedField, 
  setSelectedField, 
  hoveredField, 
  setHoveredField,
  showFieldList = true,
  notFoundLabel = 'Not Found',
  drawHighlights = true, // ควบคุมการแสดงสีไฮไลต์ตอน Error
}) => {
  const containerRef = useRef(null);
  const pageRefs = useRef({});
  const [scales, setScales] = useState({});

  const images = fileData?.images?.length
    ? fileData.images
    : (fileData?.image ? [fileData.image] : []);

  const isFieldMismatch = (fieldKey) => discrepancies?.some(diff => diff.field === fieldKey);

  const calculateScale = (pageIndex, image) => {
    if (image) {
      const { clientWidth, naturalWidth } = image;
      if (naturalWidth > 0) {
        const dpiScale = 150 / 72;
        setScales((current) => ({
          ...current,
          [pageIndex]: dpiScale * (clientWidth / naturalWidth),
        }));
      }
    }
  };

  useEffect(() => {
    const recalculate = () => {
      Object.entries(pageRefs.current).forEach(([pageIndex, pageElement]) => {
        const image = pageElement?.querySelector('img');
        calculateScale(Number(pageIndex), image);
      });
    };
    window.addEventListener('resize', recalculate);
    return () => window.removeEventListener('resize', recalculate);
  }, [images.length]);

  useEffect(() => {
    if (selectedField && fileData?.data?.[selectedField]) {
      const { bbox } = parseFieldData(fileData.data[selectedField]);
      const firstBbox = Array.isArray(bbox) ? bbox[0] : bbox;
      const normalized = normalizeBoxCoords(firstBbox);
      const pageIndex = normalized?.page ?? 0;
      if (normalized && containerRef.current && pageRefs.current[pageIndex]) {
        containerRef.current.scrollTo({
          top: pageRefs.current[pageIndex].offsetTop + (normalized.y * (scales[pageIndex] || 1)) - 50,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedField, scales, fileData]);

  const renderBoxes = (pageIndex) => {
    if (!fileData || !fileData.data) return null;

    return Object.entries(fileData.data).flatMap(([key, item]) => {
      const { bbox: rawBbox, char_bboxes } = parseFieldData(item);
      const mismatch = isFieldMismatch(key);

      let boxesToDraw = [];

      // 1. ถ้าผิด: ให้ใช้ char_bboxes ก่อน (พิกัดเฉพาะตัวอักษร) ถ้าไม่มีให้ใช้ rawBbox กันพัง
      if (mismatch && Array.isArray(char_bboxes) && char_bboxes.length > 0) {
        boxesToDraw = char_bboxes;
      } else {
        boxesToDraw = Array.isArray(rawBbox) ? rawBbox : (rawBbox ? [rawBbox] : []);
      }

      return boxesToDraw
        .map(normalizeBoxCoords)
        .filter((box) => box && (box.page ?? 0) === pageIndex)
        .map((box, index) => {
          const scale = scales[pageIndex] || 1;
          const isSelected = selectedField === key;
          const isHovered = hoveredField === key;

          // 🔥 ค่าเริ่มต้น: โปร่งใส (ไม่มีสีเขียว, ไม่มีสีแดงสำหรับฝั่งซ้าย)
          let bgColor = 'transparent';
          let zIndex = 1;

          // 🔥 ถ้าผิด + เป็นเอกสารฝั่งขวา (drawHighlights=true) ให้ใส่สีแดง
          if (mismatch && drawHighlights) {
            bgColor = 'rgba(239, 68, 68, 0.4)';
            zIndex = 2;
          }

          // 🔥 ถ้าเอาเมาส์ชี้ หรือคลิกเลือก (ทำงานทั้งสองฝั่ง เพื่อให้รู้ว่ากดโดนอะไร)
          if (isSelected) {
            bgColor = 'rgba(254, 240, 138, 0.5)'; // สีเหลือง
            zIndex = 10;
          } else if (isHovered) {
            bgColor = 'rgba(59, 130, 246, 0.35)'; // สีฟ้า
            zIndex = 5;
          }

          return (
            <div
              key={`box-${key}-${index}`}
              onClick={() => setSelectedField(key)}
              onMouseEnter={() => setHoveredField(key)}
              onMouseLeave={() => setHoveredField(null)}
              style={{
                position: 'absolute',
                left: `${box.x * scale}px`,
                top: `${box.y * scale}px`,
                width: `${Math.max(box.width * scale, 2)}px`,
                height: `${Math.max(box.height * scale, 2)}px`,
                backgroundColor: bgColor,
                border: 'none', // 🔥 ปิดการตีกรอบทั้งหมด
                cursor: 'pointer',
                pointerEvents: 'auto', // ทำให้ยังรับ Event คลิก/Hover ได้แม้โปร่งใส
                zIndex: zIndex,
                transition: 'background-color 0.15s ease',
              }}
            />
          );
        });
    });
  };

  return (
    <div style={paneStyle}>
      <h2 style={titleStyle}>{title}</h2>

      {images.length > 0 && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div ref={containerRef} style={imageContainerStyle}>
            {images.map((image, pageIndex) => (
              <div
                key={pageIndex}
                ref={(element) => { pageRefs.current[pageIndex] = element; }}
                style={{ position: 'relative', marginBottom: pageIndex === images.length - 1 ? 0 : '16px' }}
              >
                <img
                  src={`data:image/png;base64,${image}`}
                  alt={`${title} — page ${pageIndex + 1}`}
                  onLoad={(event) => calculateScale(pageIndex, event.currentTarget)}
                  style={imageStyle}
                />
                {renderBoxes(pageIndex)}
              </div>
            ))}
          </div>
        </div>
      )}

      {showFieldList && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(fileData.data).map(([key, item]) => {
            const mismatch = isFieldMismatch(key);
            const { text: displayValue, bbox } = parseFieldData(item);
            const isSelected = selectedField === key;

            return (
              <div 
                key={key}
                onClick={() => setSelectedField(key)}
                onMouseEnter={() => setHoveredField(key)}
                onMouseLeave={() => setHoveredField(null)}
                style={{ 
                  padding: '10px', 
                  backgroundColor: isSelected ? '#fff9c4' : (mismatch ? '#ffe6e6' : '#fff'), 
                  border: isSelected ? '2px solid #fbc02d' : (mismatch ? '2px solid #ff4d4f' : '1px solid #ddd'), 
                  borderRadius: '4px',
                  cursor: bbox ? 'pointer' : 'default',
                  transition: 'background-color 0.2s'
                }}
              >
                <strong style={{ display: 'block', color: mismatch ? '#d9363e' : '#555', fontSize: '0.85em', textTransform: 'uppercase' }}>
                  {key.replace(/_/g, ' ')}
                </strong>
                <span style={{ fontSize: '1em', color: displayValue ? '#000' : '#999', whiteSpace: 'pre-wrap' }}>
                  {displayValue || notFoundLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentPane;
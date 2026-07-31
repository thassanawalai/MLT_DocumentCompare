import React, { useState, useRef, useEffect } from 'react';

// ฟังก์ชันช่วยดึงข้อความ (เอามาไว้ในไฟล์นี้ด้วย คอมโพเนนต์จะได้ทำงานจบในตัวมันเอง)
const parseFieldData = (val) => {
  if (val === null || val === undefined || val === '') return { text: '', bbox: null };
  if (typeof val === 'object') {
    return {
      text: val.value !== undefined ? String(val.value) : JSON.stringify(val),
      bbox: val.bbox || null 
    };
  }
  return { text: String(val), bbox: null };
};

const DocumentPane = ({ 
  title, 
  fileData, 
  discrepancies, 
  selectedField, 
  setSelectedField, 
  hoveredField, 
  setHoveredField 
}) => {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [scale, setScale] = useState(1);

  const isFieldMismatch = (fieldKey) => {
    return discrepancies?.some(diff => diff.field === fieldKey);
  };

  const calculateScale = () => {
    if (imgRef.current) {
      const { clientWidth, naturalWidth } = imgRef.current;
      if (naturalWidth > 0) {
        const dpiScale = 150 / 72; 
        setScale(dpiScale * (clientWidth / naturalWidth));
      }
    }
  };

  useEffect(() => {
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  useEffect(() => {
    if (selectedField && fileData?.data?.[selectedField]) {
      const { bbox } = parseFieldData(fileData.data[selectedField]);
      if (bbox && containerRef.current) {
        containerRef.current.scrollTo({
          top: (bbox.y * scale) - 50,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedField, scale, fileData]);

  const renderBoxes = () => {
    if (!fileData || !fileData.data) return null;

    return Object.entries(fileData.data).map(([key, item]) => {
      const { bbox } = parseFieldData(item);
      if (!bbox || bbox.x === undefined) return null;

      // 1. เช็ก mismatch แค่รอบเดียวพอ!
      const mismatch = isFieldMismatch(key);

      // 2. ฟังก์ชันช่วยเช็กว่าอยู่กลุ่มเดียวกันไหม
      const isSameGroup = (fieldA, fieldB) => {
        if (!fieldA || !fieldB) return false;
        const baseA = fieldA.split('_')[0];
        const baseB = fieldB.split('_')[0];
        return baseA === baseB;
      };

      // 3. เอามาเช็กสถานะ Hover / Select
      const isSelected = isSameGroup(selectedField, key);
      const isHovered = isSameGroup(hoveredField, key);

      let bgColor = 'transparent';
      let borderColor = 'transparent';
      let zIndex = 1;

      if (isSelected) {
        bgColor = 'rgba(255, 235, 59, 0.4)'; 
        borderColor = '#fbc02d';
        zIndex = 10;
      } else if (isHovered) {
        bgColor = 'rgba(0, 123, 255, 0.3)'; 
        borderColor = '#007BFF';
        zIndex = 5;
      } else if (mismatch) {
        bgColor = 'rgba(255, 0, 0, 0.15)'; 
        borderColor = '#ff4d4f';
        zIndex = 2;
      } else {
        return null; 
      }

      return (
        <div
          key={`box-${key}`}
          style={{
            position: 'absolute',
            left: `${bbox.x * scale}px`,
            top: `${bbox.y * scale}px`,
            width: `${bbox.width * scale}px`,
            height: `${bbox.height * scale}px`,
            backgroundColor: bgColor,
            border: `2px solid ${borderColor}`,
            pointerEvents: 'none', 
            zIndex: zIndex,
            transition: 'all 0.3s ease'
          }}
        />
      );
    });
  };

  return (
    <div style={{ flex: 1, padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h2 style={{ textAlign: 'center', color: '#333', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
        {title}
      </h2>
      
      {fileData.image && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div 
            ref={containerRef}
            style={{ 
              height: '500px', 
              overflowY: 'auto', 
              position: 'relative',
              border: '1px solid #ccc',
              backgroundColor: '#fff'
            }}
          >
            <img 
              ref={imgRef}
              src={`data:image/png;base64,${fileData.image}`} 
              alt={title} 
              onLoad={calculateScale} 
              style={{ width: '100%', display: 'block' }} 
            />
            {renderBoxes()}
          </div>
        </div>
      )}

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
                {displayValue || 'Not Found'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ส่งออกให้ไฟล์อื่นเรียกใช้ได้
export default DocumentPane;
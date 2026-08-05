import React, { useState, useRef, useEffect } from 'react';

// Helper function to parse field data
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

}) => {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [scale, setScale] = useState(1);

  const isFieldMismatch = (fieldKey) => discrepancies?.some(diff => diff.field === fieldKey);

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
    calculateScale(); // Initial calculation
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  useEffect(() => {
    if (selectedField && fileData?.data?.[selectedField]) {
      const { bbox } = parseFieldData(fileData.data[selectedField]);
      const firstBbox = Array.isArray(bbox) ? bbox[0] : bbox;
      if (firstBbox && containerRef.current) {
        containerRef.current.scrollTo({
          top: (firstBbox.y * scale) - 50,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedField, scale, fileData]);

  const renderBoxes = () => {
    if (!fileData || !fileData.data) return null;

    return Object.entries(fileData.data).flatMap(([key, item]) => {
      const { bbox: rawBbox } = parseFieldData(item);
      const bboxes = Array.isArray(rawBbox) ? rawBbox : (rawBbox ? [rawBbox] : []);

      if (bboxes.length === 0) return [];

      const mismatch = isFieldMismatch(key);
      // Highlight only the exact field.  Grouping by the first word made
      // `port_of_loading` and `port_of_discharge` highlight each other.
      const isSelected = selectedField === key;
      const isHovered = hoveredField === key;

      let bgColor = 'rgba(76, 175, 80, 0.15)';
      let borderColor = '#4caf50';
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
        bgColor = 'rgba(244, 67, 54, 0.2)';
        borderColor = '#f44336';
        zIndex = 2;
      }

      return bboxes.map((box, index) => {
        if (!box || box.x === undefined) return null;

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
              width: `${box.width * scale}px`,
              height: `${box.height * scale}px`,
              backgroundColor: bgColor,
              border: `2px solid ${borderColor}`,
              cursor: 'pointer',
              pointerEvents: 'auto',
              zIndex: zIndex,
              transition: 'all 0.2s ease-in-out',
            }}
          />
        );
      });
    });
  };

  return (
    <div style={paneStyle}>
      <h2 style={titleStyle}>{title}</h2>

      {fileData.image && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div ref={containerRef} style={imageContainerStyle}>
            <img 
              ref={imgRef}
              src={`data:image/png;base64,${fileData.image}`} 
              alt={title} 
              onLoad={calculateScale} 
              style={imageStyle} 
            />
            {renderBoxes()}
          </div>
        </div>
      )}

      {showFieldList && <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
      </div>}
    </div>
  );
};

export default DocumentPane;

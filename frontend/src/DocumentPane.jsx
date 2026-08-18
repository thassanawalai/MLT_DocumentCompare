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
      const pageIndex = firstBbox?.page ?? 0;
      if (firstBbox && containerRef.current && pageRefs.current[pageIndex]) {
        containerRef.current.scrollTo({
          top: pageRefs.current[pageIndex].offsetTop + (firstBbox.y * (scales[pageIndex] || 1)) - 50,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedField, scales, fileData]);

  const renderBoxes = (pageIndex) => {
    if (!fileData || !fileData.data) return null;

    return Object.entries(fileData.data).flatMap(([key, item]) => {
      const { bbox: rawBbox } = parseFieldData(item);
      const bboxes = (Array.isArray(rawBbox) ? rawBbox : (rawBbox ? [rawBbox] : []))
        .filter((box) => (box?.page ?? 0) === pageIndex);

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
              left: `${box.x * (scales[pageIndex] || 1)}px`,
              top: `${box.y * (scales[pageIndex] || 1)}px`,
              width: `${box.width * (scales[pageIndex] || 1)}px`,
              height: `${box.height * (scales[pageIndex] || 1)}px`,
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

import React, { useState, useRef, useEffect } from 'react';

// ============================================================
// Helper Functions
// ============================================================
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

const normalizeBoxCoords = (box) => {
  if (!box) return null;
  if (Array.isArray(box) && box.length >= 4) {
    return {
      x: box[0], y: box[1], width: box[2] - box[0], height: box[3] - box[1], page: box[4] ?? 0
    };
  }
  if (box.x !== undefined && box.y !== undefined) {
    return {
      x: box.x, y: box.y, width: box.width ?? (box.x2 ? box.x2 - box.x : 0), height: box.height ?? (box.y2 ? box.y2 - box.y : 0), page: box.page ?? 0
    };
  }
  return null;
};

// ============================================================
// Styles
// ============================================================
const paneStyle = { flex: 1, padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' };
const titleStyle = { textAlign: 'center', color: '#333', borderBottom: '2px solid #ccc', paddingBottom: '10px' };
const imageContainerStyle = { height: '500px', overflowY: 'auto', position: 'relative', border: '1px solid #ccc', backgroundColor: '#fff' };
const imageStyle = { width: '100%', display: 'block' };

// ============================================================
// Draggable Comment Component
// ============================================================
const DraggableComment = ({ comment, containerWidth, containerHeight, onUpdate, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [pos, setPos] = useState({ x: comment.xRatio * containerWidth, y: comment.yRatio * containerHeight });
  const dragRef = useRef({ startX: 0, startY: 0, initBoxX: 0, initBoxY: 0 });

  useEffect(() => {
    if (!isDragging) {
      setPos({ x: comment.xRatio * containerWidth, y: comment.yRatio * containerHeight });
    }
  }, [comment.xRatio, comment.yRatio, containerWidth, containerHeight, isDragging]);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    dragRef.current = { startX: e.clientX, startY: e.clientY, initBoxX: pos.x, initBoxY: pos.y };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPos({ x: dragRef.current.initBoxX + dx, y: dragRef.current.initBoxY + dy });
    };
    
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onUpdate(comment.id, {
          ...comment,
          xRatio: pos.x / containerWidth,
          yRatio: pos.y / containerHeight
        });
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
        left: `${pos.x}px`, top: `${pos.y}px`, zIndex: 50,
        cursor: isDragging ? 'grabbing' : 'grab',
        color: '#ef4444', 
        fontFamily: '"Times New Roman", "TH Sarabun New", "TH Sarabun PSK", serif',
        fontSize: '18px', fontWeight: 'bold', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        userSelect: 'none', 
        textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff',
      }}
    >
      {comment.text}
      {(isHovered || isDragging) && (
        <button 
          onMouseDown={(e) => e.stopPropagation()} 
          onClick={(e) => { e.stopPropagation(); onDelete(comment.id); }} 
          style={{
            position: 'absolute', top: '-12px', right: '-16px',
            backgroundColor: '#fff', border: '1px solid #ef4444', color: '#ef4444',
            borderRadius: '50%', width: '18px', height: '18px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            fontSize: '14px', padding: '0 0 2px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontFamily: 'sans-serif'
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
};

// ============================================================
// Main DocumentPane Component
// ============================================================
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
  drawHighlights = true,
  enableComments = false,
  comments = [],
  onAddComment,
  onUpdateComment,
  onDeleteComment
}) => {
  const containerRef = useRef(null);
  const pageRefs = useRef({});
  const [scales, setScales] = useState({});

  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    pageIndex: null,
    xRatio: null,
    yRatio: null,
    text: ''
  });

  const images = fileData?.images?.length ? fileData.images : (fileData?.image ? [fileData.image] : []);
  const isFieldMismatch = (fieldKey) => discrepancies?.some(diff => diff.field === fieldKey);

  const calculateScale = (pageIndex, image) => {
    if (image && image.naturalWidth > 0) {
      const dpiScale = 150 / 72;
      setScales((current) => ({
        ...current,
        [pageIndex]: dpiScale * (image.clientWidth / image.naturalWidth),
      }));
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

  const handleImageClick = (e, pageIndex) => {
    if (!enableComments || !onAddComment) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // แทนที่จะใช้ prompt() เราจะเปิดกล่อง Modal แทน พร้อมเก็บพิกัดที่คลิกไว้
    setCommentModal({
      isOpen: true,
      pageIndex,
      xRatio: x / rect.width,
      yRatio: y / rect.height,
      text: ''
    });
  };

  // ฟังก์ชันสำหรับเซฟคอมเมนต์
  const handleSaveComment = () => {
    if (commentModal.text && commentModal.text.trim() !== "") {
      onAddComment({
        id: Date.now().toString(),
        text: commentModal.text,
        pageIndex: commentModal.pageIndex,
        xRatio: commentModal.xRatio,
        yRatio: commentModal.yRatio
      });
    }
    // ปิดกล่อง
    setCommentModal({ ...commentModal, isOpen: false, text: '' });
  };

  const renderBoxes = (pageIndex) => {
    if (!fileData || !fileData.data) return null;
    return Object.entries(fileData.data).flatMap(([key, item]) => {
      const { bbox: rawBbox, char_bboxes } = parseFieldData(item);
      const mismatch = isFieldMismatch(key);
      let boxesToDraw = (mismatch && Array.isArray(char_bboxes) && char_bboxes.length > 0) 
                        ? char_bboxes : (Array.isArray(rawBbox) ? rawBbox : (rawBbox ? [rawBbox] : []));

      return boxesToDraw.map(normalizeBoxCoords).filter((box) => box && (box.page ?? 0) === pageIndex).map((box, index) => {
        const scale = scales[pageIndex] || 1;
        const isSelected = selectedField === key;
        const isHovered = hoveredField === key;
        let bgColor = 'transparent';
        let zIndex = 1;

        if (mismatch && drawHighlights) { bgColor = 'rgba(239, 68, 68, 0.4)'; zIndex = 2; }
        if (isSelected) { bgColor = 'rgba(254, 240, 138, 0.5)'; zIndex = 10; } 
        else if (isHovered) { bgColor = 'rgba(59, 130, 246, 0.35)'; zIndex = 5; }

        return (
          <div
            key={`box-${key}-${index}`}
            onClick={(e) => { e.stopPropagation(); setSelectedField(key); }}
            onMouseEnter={() => setHoveredField(key)}
            onMouseLeave={() => setHoveredField(null)}
            style={{
              position: 'absolute', left: `${box.x * scale}px`, top: `${box.y * scale}px`,
              width: `${Math.max(box.width * scale, 2)}px`, height: `${Math.max(box.height * scale, 2)}px`,
              backgroundColor: bgColor, cursor: 'pointer', pointerEvents: 'auto', zIndex, transition: 'background-color 0.15s ease',
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
                style={{ position: 'relative', marginBottom: pageIndex === images.length - 1 ? 0 : '16px', cursor: enableComments ? 'crosshair' : 'default' }}
                onClick={(e) => handleImageClick(e, pageIndex)}
              >
                <img
                  src={`data:image/png;base64,${image}`}
                  alt={`${title} — page ${pageIndex + 1}`}
                  onLoad={(event) => calculateScale(pageIndex, event.currentTarget)}
                  style={imageStyle}
                />
                {renderBoxes(pageIndex)}
                
                {comments.filter(c => c.pageIndex === pageIndex).map(comment => (
                  <DraggableComment 
                    key={comment.id}
                    comment={comment}
                    containerWidth={pageRefs.current[pageIndex]?.clientWidth || 0}
                    containerHeight={pageRefs.current[pageIndex]?.clientHeight || 0}
                    onUpdate={onUpdateComment}
                    onDelete={onDeleteComment}
                  />
                ))}
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
                  borderRadius: '4px', cursor: bbox ? 'pointer' : 'default', transition: 'background-color 0.2s'
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
      {commentModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', 
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(3px)' 
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px',
            width: '90%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.25em', fontWeight: 'bold' }}>
              📝 Comment
            </h3>
            
            <textarea
              autoFocus
              value={commentModal.text}
              onChange={(e) => setCommentModal({ ...commentModal, text: e.target.value })}
              placeholder="Type the text you want to comment here..."
              style={{
                width: '100%', height: '120px', padding: '14px', borderRadius: '10px',
                border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '1.05em',
                resize: 'none', boxSizing: 'border-box', outline: 'none',
                backgroundColor: '#f8fafc', color: '#334155'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setCommentModal({ ...commentModal, isOpen: false })}
                style={{
                  padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  backgroundColor: '#fff', color: '#64748b', cursor: 'pointer',
                  fontWeight: '600', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveComment}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#1d4ed8', color: '#fff', cursor: 'pointer',
                  fontWeight: 'bold', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(29, 78, 216, 0.2)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1e40af'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#1d4ed8'}
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

export default DocumentPane;
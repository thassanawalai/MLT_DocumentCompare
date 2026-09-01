import React, { useState, useRef, useEffect } from 'react';

// ============================================================
// Helper Functions
// ============================================================
const parseFieldData = (val) => {
  if (val === null || val === undefined || val === '') return { text: '', bbox: null, char_bboxes: [] };
  if (typeof val === 'object') {
    return { text: val.value !== undefined ? String(val.value) : JSON.stringify(val), bbox: val.bbox || null, char_bboxes: val.char_bboxes || [] };
  }
  return { text: String(val), bbox: null, char_bboxes: [] };
};

const normalizeBoxCoords = (box) => {
  if (!box) return null;
  if (Array.isArray(box) && box.length >= 4) return { x: box[0], y: box[1], width: box[2] - box[0], height: box[3] - box[1], page: box[4] ?? 0 };
  if (box.x !== undefined && box.y !== undefined) return { x: box.x, y: box.y, width: box.width ?? (box.x2 ? box.x2 - box.x : 0), height: box.height ?? (box.y2 ? box.y2 - box.y : 0), page: box.page ?? 0 };
  return null;
};

const paneStyle = { flex: 1, padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' };
const titleStyle = { textAlign: 'center', color: '#333', borderBottom: '2px solid #ccc', paddingBottom: '10px' };
const imageContainerStyle = { height: '500px', overflowY: 'auto', position: 'relative', border: '1px solid #ccc', backgroundColor: '#fff' };
const imageStyle = { width: '100%', display: 'block', userSelect: 'none', WebkitUserDrag: 'none' }; // 🔥 ป้องกันการเผลอลากรูปภาพ

// ============================================================
// Draggable Comment Component
// ============================================================
const DraggableComment = ({ comment, containerWidth, containerHeight, onUpdate, onDelete, onEdit }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [pos, setPos] = useState({ x: comment.xRatio * containerWidth, y: comment.yRatio * containerHeight });
  const dragRef = useRef({ startX: 0, startY: 0, initBoxX: 0, initBoxY: 0 });

  useEffect(() => {
    if (!isDragging) setPos({ x: comment.xRatio * containerWidth, y: comment.yRatio * containerHeight });
  }, [comment.xRatio, comment.yRatio, containerWidth, containerHeight, isDragging]);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    dragRef.current = { startX: e.clientX, startY: e.clientY, initBoxX: pos.x, initBoxY: pos.y };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPos({ x: dragRef.current.initBoxX + (e.clientX - dragRef.current.startX), y: dragRef.current.initBoxY + (e.clientY - dragRef.current.startY) });
    };
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onUpdate(comment.id, { ...comment, xRatio: pos.x / containerWidth, yRatio: pos.y / containerHeight });
      }
    };
    if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, pos, containerWidth, containerHeight, comment, onUpdate]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute', left: `${pos.x}px`, top: `${pos.y}px`, zIndex: 50,
        cursor: isDragging ? 'grabbing' : 'grab', display: 'flex', alignItems: 'center', userSelect: 'none'
      }}
    >
      {comment.type === 'line' && (
        <div style={{ width: `${comment.lineWidth}px`, height: '2px', backgroundColor: '#ef4444', borderRadius: '2px' }} />
      )}
      
      {(comment.type === 'text' || !comment.type) && comment.text && (
        <div style={{
          color: '#ef4444', fontFamily: '"Sarabun", "Times New Roman", serif', fontSize: '13px', 
          fontWeight: 'normal', backgroundColor: 'transparent', whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '0 2px'
        }}>
          {comment.text}
        </div>
      )}

      {(isHovered || isDragging) && (
        <div style={{
          position: 'absolute', top: '-30px', left: 0, display: 'flex', gap: '4px',
          backgroundColor: '#fff', padding: '4px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0'
        }}>
          {comment.type === 'text' && (
             <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onEdit(comment); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }} title="แก้ไข">✏️</button>
          )}
          {comment.type === 'text' && <div style={{ width: '1px', backgroundColor: '#e2e8f0' }} />}
          <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDelete(comment.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }} title="ลบ">❌</button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Main DocumentPane Component
// ============================================================
const DocumentPane = ({ 
  title, fileData, discrepancies, selectedField, setSelectedField, hoveredField, setHoveredField,
  showFieldList = true, notFoundLabel = 'Not Found', drawHighlights = true,
  enableComments = false, comments = [], onAddComment, onUpdateComment, onDeleteComment
}) => {
  const containerRef = useRef(null);
  const pageRefs = useRef({});
  const [scales, setScales] = useState({});
  const [activeTool, setActiveTool] = useState('text');
  const [commentModal, setCommentModal] = useState({ isOpen: false, id: null, text: '' });
  
  // 🔥 State สำหรับเก็บข้อมูลระหว่างการ "ลากวาดเส้น"
  const [drawingLine, setDrawingLine] = useState(null);

  const images = fileData?.images?.length ? fileData.images : (fileData?.image ? [fileData.image] : []);
  const isFieldMismatch = (fieldKey) => discrepancies?.some(diff => diff.field === fieldKey);

  const calculateScale = (pageIndex, image) => {
    if (image && image.naturalWidth > 0) {
      setScales((current) => ({ ...current, [pageIndex]: (150 / 72) * (image.clientWidth / image.naturalWidth) }));
    }
  };

  useEffect(() => {
    const recalculate = () => { Object.entries(pageRefs.current).forEach(([pageIndex, pageElement]) => calculateScale(Number(pageIndex), pageElement?.querySelector('img'))); };
    window.addEventListener('resize', recalculate); return () => window.removeEventListener('resize', recalculate);
  }, [images.length]);

  const handleImageMouseDown = (e, pageIndex) => {
    if (!enableComments || !onAddComment) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'line') {
      setDrawingLine({ pageIndex, startX: x, startY: y, currentX: x });
    } else {
      setCommentModal({
        isOpen: true, type: 'text', id: Date.now().toString(), pageIndex,
        xRatio: x / rect.width, yRatio: y / rect.height, text: ''
      });
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!drawingLine) return;
      const pageElement = pageRefs.current[drawingLine.pageIndex];
      if (!pageElement) return;
      const rect = pageElement.getBoundingClientRect();
      
      // ดักไม่ให้ลากทะลุขอบกระดาษ
      let x = e.clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      setDrawingLine(prev => ({ ...prev, currentX: x }));
    };

    const handleGlobalMouseUp = () => {
      if (!drawingLine) return;
      const pageElement = pageRefs.current[drawingLine.pageIndex];
      if (!pageElement) { setDrawingLine(null); return; }

      const widthPx = pageElement.clientWidth;
      const heightPx = pageElement.clientHeight;

      const startX = Math.min(drawingLine.startX, drawingLine.currentX);
      const endX = Math.max(drawingLine.startX, drawingLine.currentX);
      const lineWidth = endX - startX;

      if (lineWidth > 5) {
         onAddComment({
            id: Date.now().toString(),
            type: 'line',
            pageIndex: drawingLine.pageIndex,
            xRatio: startX / widthPx,
            yRatio: drawingLine.startY / heightPx,
            lineWidth: lineWidth
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
    const payload = { ...commentModal };
    if (commentModal.mode === 'edit') onUpdateComment(payload.id, payload);
    else onAddComment(payload);
    setCommentModal({ isOpen: false, id: null, text: '' });
  };

  const renderBoxes = (pageIndex) => {
    if (!fileData || !fileData.data) return null;
    return Object.entries(fileData.data).flatMap(([key, item]) => {
      const { bbox: rawBbox, char_bboxes } = parseFieldData(item);
      const mismatch = isFieldMismatch(key);
      let boxesToDraw = (mismatch && Array.isArray(char_bboxes) && char_bboxes.length > 0) ? char_bboxes : (Array.isArray(rawBbox) ? rawBbox : (rawBbox ? [rawBbox] : []));

      return boxesToDraw.map(normalizeBoxCoords).filter((box) => box && (box.page ?? 0) === pageIndex).map((box, index) => {
        const scale = scales[pageIndex] || 1;
        let bgColor = 'transparent', zIndex = 1;
        if (mismatch && drawHighlights) { bgColor = 'rgba(239, 68, 68, 0.4)'; zIndex = 2; }
        if (selectedField === key) { bgColor = 'rgba(254, 240, 138, 0.5)'; zIndex = 10; } 
        else if (hoveredField === key) { bgColor = 'rgba(59, 130, 246, 0.35)'; zIndex = 5; }

        return <div key={`box-${key}-${index}`} onClick={(e) => { e.stopPropagation(); setSelectedField(key); }} onMouseEnter={() => setHoveredField(key)} onMouseLeave={() => setHoveredField(null)} style={{ position: 'absolute', left: `${box.x * scale}px`, top: `${box.y * scale}px`, width: `${Math.max(box.width * scale, 2)}px`, height: `${Math.max(box.height * scale, 2)}px`, backgroundColor: bgColor, cursor: 'pointer', pointerEvents: 'auto', zIndex, transition: 'background-color 0.15s ease' }} />;
      });
    });
  };

  return (
    <div style={paneStyle}>
      <h2 style={titleStyle}>{title}</h2>
      
      {enableComments && images.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
          <button onClick={() => setActiveTool('text')} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', border: activeTool === 'text' ? '2px solid #3b82f6' : '1px solid #cbd5e1', backgroundColor: activeTool === 'text' ? '#eff6ff' : '#fff', color: activeTool === 'text' ? '#1d4ed8' : '#64748b' }}>
            📝 พิมพ์ข้อความ
          </button>
          <button onClick={() => setActiveTool('line')} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', border: activeTool === 'line' ? '2px solid #ef4444' : '1px solid #cbd5e1', backgroundColor: activeTool === 'line' ? '#fef2f2' : '#fff', color: activeTool === 'line' ? '#b91c1c' : '#64748b' }}>
            ➖ ลากเส้นขีดฆ่า
          </button>
        </div>
      )}

      {images.length > 0 && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div ref={containerRef} style={imageContainerStyle}>
            {images.map((image, pageIndex) => (
              <div key={pageIndex} ref={(element) => { pageRefs.current[pageIndex] = element; }} style={{ position: 'relative', marginBottom: pageIndex === images.length - 1 ? 0 : '16px', cursor: enableComments ? (activeTool === 'line' ? 'ew-resize' : 'text') : 'default' }} onMouseDown={(e) => handleImageMouseDown(e, pageIndex)}>
                <img src={`data:image/png;base64,${image}`} alt={`${title} page ${pageIndex + 1}`} onLoad={(event) => calculateScale(pageIndex, event.currentTarget)} style={imageStyle} draggable="false" />
                {renderBoxes(pageIndex)}
                
                {drawingLine && drawingLine.pageIndex === pageIndex && (
                  <div style={{
                    position: 'absolute',
                    left: `${Math.min(drawingLine.startX, drawingLine.currentX)}px`,
                    top: `${drawingLine.startY}px`,
                    width: `${Math.abs(drawingLine.currentX - drawingLine.startX)}px`,
                    height: '2px', backgroundColor: '#ef4444', zIndex: 100, pointerEvents: 'none'
                  }} />
                )}

                {comments.filter(c => c.pageIndex === pageIndex).map(comment => (
                  <DraggableComment key={comment.id} comment={comment} containerWidth={pageRefs.current[pageIndex]?.clientWidth || 0} containerHeight={pageRefs.current[pageIndex]?.clientHeight || 0} onUpdate={onUpdateComment} onDelete={onDeleteComment} onEdit={(cmt) => setCommentModal({ isOpen: true, mode: 'edit', ...cmt })} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {commentModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.25em', fontWeight: 'bold' }}>📝 พิมพ์ข้อความที่ถูกต้อง</h3>
            <textarea autoFocus value={commentModal.text} onChange={(e) => setCommentModal({ ...commentModal, text: e.target.value })} placeholder="พิมพ์ข้อความ..." style={{ width: '100%', height: '100px', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '1.05em', resize: 'none', outline: 'none', backgroundColor: '#f8fafc' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setCommentModal({ isOpen: false, text: '' })} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: '600' }}>ยกเลิก</button>
              <button onClick={handleSaveTextComment} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPane;
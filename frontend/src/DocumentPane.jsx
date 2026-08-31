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
const imageStyle = { width: '100%', display: 'block' };

// ============================================================
// Draggable Comment Component (อัปเกรด: ขีดฆ่า + Edit + ลบขอบขาว)
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
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none'
      }}
    >
      {/* เส้นขีดฆ่า */}
      {comment.showStrikethrough && (
        <div style={{ width: `${comment.strikeWidth}px`, height: '1.5px', backgroundColor: '#ef4444', borderRadius: '2px' }} />
      )}
      
      {/* ข้อความคอมเมนต์ (เอาเงาขาวออกเหลือแดงล้วน) */}
      {comment.text && (
        <div style={{
          color: '#ef4444', 
          fontFamily: '"Sarabun", "Times New Roman", serif',
          fontSize: '10px',
          fontWeight: 'normal',
          backgroundColor: 'transparent',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          padding: '0 2px'
        }}>
          {comment.text}
        </div>
      )}

      {/* เมนูจัดการ: แก้ไข / ลบ */}
      {(isHovered || isDragging) && (
        <div style={{
          position: 'absolute', top: '-30px', left: 0, display: 'flex', gap: '4px',
          backgroundColor: '#fff', padding: '4px', borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0'
        }}>
          <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onEdit(comment); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }} title="แก้ไข">✏️</button>
          <div style={{ width: '1px', backgroundColor: '#e2e8f0' }} />
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
  
  // State คุมกล่องใส่คอมเมนต์
  const [commentModal, setCommentModal] = useState({ isOpen: false, mode: 'add', id: null, pageIndex: null, xRatio: null, yRatio: null, text: '', showStrikethrough: false, strikeWidth: 60 });

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

  const handleImageClick = (e, pageIndex) => {
    if (!enableComments || !onAddComment) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setCommentModal({
      isOpen: true, mode: 'add', id: Date.now().toString(), pageIndex,
      xRatio: (e.clientX - rect.left) / rect.width, yRatio: (e.clientY - rect.top) / rect.height,
      text: '', showStrikethrough: false, strikeWidth: 60
    });
  };

  const handleSaveComment = () => {
    const payload = { ...commentModal };
    if (commentModal.mode === 'add') onAddComment(payload);
    else onUpdateComment(payload.id, payload);
    setCommentModal({ ...commentModal, isOpen: false });
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
      {images.length > 0 && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div ref={containerRef} style={imageContainerStyle}>
            {images.map((image, pageIndex) => (
              <div key={pageIndex} ref={(element) => { pageRefs.current[pageIndex] = element; }} style={{ position: 'relative', marginBottom: pageIndex === images.length - 1 ? 0 : '16px', cursor: enableComments ? 'crosshair' : 'default' }} onClick={(e) => handleImageClick(e, pageIndex)}>
                <img src={`data:image/png;base64,${image}`} alt={`${title} page ${pageIndex + 1}`} onLoad={(event) => calculateScale(pageIndex, event.currentTarget)} style={imageStyle} />
                {renderBoxes(pageIndex)}
                {comments.filter(c => c.pageIndex === pageIndex).map(comment => (
                  <DraggableComment 
                    key={comment.id} comment={comment}
                    containerWidth={pageRefs.current[pageIndex]?.clientWidth || 0} containerHeight={pageRefs.current[pageIndex]?.clientHeight || 0}
                    onUpdate={onUpdateComment} onDelete={onDeleteComment}
                    onEdit={(cmt) => setCommentModal({ isOpen: true, mode: 'edit', ...cmt })}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal กล่องคอมเมนต์ (อัปเกรด) */}
      {commentModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.25em', fontWeight: 'bold' }}>
              {commentModal.mode === 'add' ? '📝 เพิ่มคอมเมนต์' : '✏️ แก้ไขคอมเมนต์'}
            </h3>
            
            {/* กล่องข้อความ */}
            <textarea
              autoFocus
              value={commentModal.text}
              onChange={(e) => setCommentModal({ ...commentModal, text: e.target.value })}
              placeholder="พิมพ์ข้อความที่ถูกต้อง..."
              style={{ width: '100%', height: '100px', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '1.05em', resize: 'none', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f8fafc', color: '#334155' }}
            />

            {/* ออปชันเสริม: ขีดฆ่า */}
            <div style={{ marginTop: '20px', backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#334155', fontWeight: 600 }}>
                <input type="checkbox" checked={commentModal.showStrikethrough} onChange={(e) => setCommentModal({...commentModal, showStrikethrough: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                เพิ่มเส้นขีดฆ่าข้อความที่ผิด
              </label>

              {commentModal.showStrikethrough && (
                <div style={{ marginTop: '12px', paddingLeft: '26px' }}>
                  <label style={{ fontSize: '0.9em', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                    ความยาวของเส้นขีดฆ่า: {commentModal.strikeWidth}px
                  </label>
                  <input type="range" min="20" max="300" value={commentModal.strikeWidth} onChange={(e) => setCommentModal({...commentModal, strikeWidth: Number(e.target.value)})} style={{ width: '100%', cursor: 'pointer' }} />
                </div>
              )}
            </div>

            {/* ปุ่มกด */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setCommentModal({ ...commentModal, isOpen: false })} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: '600' }}>ยกเลิก</button>
              <button onClick={handleSaveComment} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPane;
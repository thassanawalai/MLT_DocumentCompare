import React, { useState, useRef, useEffect } from 'react';

// 1. ฟังก์ชันดึงข้อความและพิกัด bbox ออกมาใช้อย่างปลอดภัย
const parseFieldData = (val) => {
  if (val === null || val === undefined || val === '') {
    return { text: '', bbox: null };
  }
  
  if (typeof val === 'object') {
    return {
      text: val.value !== undefined ? String(val.value) : JSON.stringify(val),
      bbox: val.bbox || null 
    };
  }
  
  return { text: String(val), bbox: null };
};

function App() {
  const [fileOriginal, setFileOriginal] = useState(null);
  const [fileProgram, setFileProgram] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 👉 State ใหม่ 2 ตัว สำหรับจัดการ Auto Zoom และ Highlight
  const [selectedField, setSelectedField] = useState(null); 
  const [hoveredField, setHoveredField] = useState(null);

  const handleProcessFiles = async () => {
    if (!fileOriginal || !fileProgram) {
      setErrorMessage('กรุณาอัปโหลดเอกสารให้ครบทั้ง 2 ฝั่งครับ (Original และ Program)');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setResults(null);
    setSelectedField(null); // รีเซ็ตโฟกัส
    
    const formData = new FormData();
    formData.append('company', 'OOCL');
    formData.append('file_original', fileOriginal);
    formData.append('file_program', fileProgram);

    try {
      const response = await fetch('http://localhost:8000/api/v1/process-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorDetail = errorData.detail 
            ? JSON.stringify(errorData.detail, null, 2) 
            : 'Unknown Error';
        throw new Error(`Backend Error (${response.status}):\n${errorDetail}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        setResults(result);
      } else {
        setErrorMessage(result.detail || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      }
    } catch (error) {
      console.error("Upload error details:", error.message);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isFieldMismatch = (fieldKey) => {
    if (!results) return false;
    return results.discrepancies.some(diff => diff.field === fieldKey);
  };

  // ---------------------------------------------------------
  // 3. คอมโพเนนต์แสดงผล + ระบบ Auto Zoom
  // ---------------------------------------------------------
  const DocumentPane = ({ title, fileData, isOriginal }) => {
    const containerRef = useRef(null);
    const imgRef = useRef(null);
    const [scale, setScale] = useState(1);

    // สูตรคำนวณสัดส่วน (แปลงพิกัดจาก PDF มาเป็นพิกัดรูปบนหน้าเว็บ)
    const calculateScale = () => {
      if (imgRef.current) {
        const { clientWidth, naturalWidth } = imgRef.current;
        if (naturalWidth > 0) {
          // พิกัด Backend เป็น 72 DPI แตปภาพถูกแคปมาเป็น 150 DPI
          const dpiScale = 150 / 72;
          setScale(dpiScale * (clientWidth / naturalWidth));
        }
      }
    };

    // คำนวณสเกลใหม่ทุกครั้งที่หน้าจอขยาย
    useEffect(() => {
      window.addEventListener('resize', calculateScale);
      return () => window.removeEventListener('resize', calculateScale);
    }, []);

    // 🌟 ระบบ AUTO ZOOM: เลื่อน Scrollbar ไปหาจุดที่คลิก 🌟
    useEffect(() => {
      if (selectedField && fileData?.data?.[selectedField]) {
        const { bbox } = parseFieldData(fileData.data[selectedField]);
        if (bbox && containerRef.current) {
          containerRef.current.scrollTo({
            top: (bbox.y * scale) - 50, // -50 เพื่อเว้นที่ว่างด้านบนให้อ่านง่าย
            behavior: 'smooth'
          });
        }
      }
    }, [selectedField, scale, fileData]);

    // ฟังก์ชันวาดกล่องไฮไลต์อัจฉริยะ (เปลี่ยนสีตามสถานะ)
    const renderBoxes = () => {
      if (!fileData || !fileData.data) return null;

      return Object.entries(fileData.data).map(([key, item]) => {
        const { bbox } = parseFieldData(item);
        if (!bbox || bbox.x === undefined) return null;

        const mismatch = isFieldMismatch(key);
        const isSelected = selectedField === key;
        const isHovered = hoveredField === key;

        let bgColor = 'transparent';
        let borderColor = 'transparent';
        let zIndex = 1;

        // เปลี่ยนสีกรอบตามเงื่อนไข (เรียงตามลำดับความสำคัญ)
        if (isSelected) {
          bgColor = 'rgba(255, 235, 59, 0.4)'; // สีเหลือง (ตอนคลิกเลือก)
          borderColor = '#fbc02d';
          zIndex = 10;
        } else if (isHovered) {
          bgColor = 'rgba(0, 123, 255, 0.3)'; // สีฟ้า (ตอนเอาเมาส์ชี้)
          borderColor = '#007BFF';
          zIndex = 5;
        } else if (mismatch) {
          bgColor = 'rgba(255, 0, 0, 0.15)'; // สีแดง (กรณีข้อมูลไม่ตรงกัน)
          borderColor = '#ff4d4f';
          zIndex = 2;
        } else {
          return null; // ถ้าตรงปกติ และไม่ได้ชี้เมาส์/ไม่ได้คลิก ไม่ต้องวาดกล่องให้รก
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
              pointerEvents: 'none', // ให้เมาส์ทะลุกล่องได้
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
            {/* กล่องบรรจุรูปภาพ ทำให้เลื่อน (Scroll) ได้เพื่อทำ Auto Zoom */}
            <div 
              ref={containerRef}
              style={{ 
                height: '500px', // ล็อคความสูงหน้าต่าง
                overflowY: 'auto', // ให้เลื่อนขึ้นลงได้
                position: 'relative',
                border: '1px solid #ccc',
                backgroundColor: '#fff'
              }}
            >
              <img 
                ref={imgRef}
                src={`data:image/png;base64,${fileData.image}`} 
                alt={title} 
                onLoad={calculateScale} // คำนวณสเกลทันทีที่รูปโหลดเสร็จ
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
                onClick={() => setSelectedField(key)} // 👈 คลิกแล้วตั้งค่าเป็น Auto Zoom
                onMouseEnter={() => setHoveredField(key)} // 👈 ชี้เมาส์แล้วเกิดไฮไลต์
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

  // ---------------------------------------------------------
  // 4. ส่วนแสดงผลหลัก UI
  // ---------------------------------------------------------
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Document Compare & Approve System</h1>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1, padding: '20px', border: '2px dashed #007BFF', borderRadius: '8px', textAlign: 'center' }}>
          <h3>ฝั่งซ้าย: เอกสารต้นฉบับ (Original)</h3>
          <input type="file" accept="application/pdf" onChange={(e) => setFileOriginal(e.target.files[0])} />
        </div>
        <div style={{ flex: 1, padding: '20px', border: '2px dashed #28A745', borderRadius: '8px', textAlign: 'center' }}>
          <h3>ฝั่งขวา: เอกสารจากโปรแกรม (Compare)</h3>
          <input type="file" accept="application/pdf" onChange={(e) => setFileProgram(e.target.files[0])} />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button 
          onClick={handleProcessFiles} 
          disabled={loading}
          style={{ padding: '12px 30px', fontSize: '1.1em', backgroundColor: loading ? '#999' : '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'กำลังเปรียบเทียบเอกสาร...' : 'เปรียบเทียบข้อมูล (Compare)'}
        </button>
      </div>

      {errorMessage && (
        <div style={{ padding: '15px', backgroundColor: '#FFD2D2', color: '#D8000C', borderRadius: '4px', textAlign: 'center', marginBottom: '20px' }}>
          {errorMessage}
        </div>
      )}

      {results && (
        <>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <DocumentPane title="Original Document (ซ้าย)" fileData={results.original} isOriginal={true} />
            <DocumentPane title="Program Document (ขวา)" fileData={results.program} isOriginal={false} />
          </div>

          <div style={{ marginTop: '30px', padding: '20px', border: '2px solid #ff4d4f', borderRadius: '8px', backgroundColor: '#fff1f0' }}>
            <h2 style={{ color: '#cf1322', marginTop: 0 }}>
              ⚠️ Error List: พบจุดที่ข้อมูลไม่ตรงกันทั้งหมด {results.discrepancies.length} จุด
            </h2>
            
            {results.discrepancies.length === 0 ? (
              <p style={{ color: '#389e0d', fontWeight: 'bold', fontSize: '1.2em' }}>✅ ยอดเยี่ยม! ข้อมูลตรงกันทุกจุด</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', backgroundColor: '#fff' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ffccc7', padding: '10px', backgroundColor: '#ffa39e', textAlign: 'left' }}>Field Name</th>
                    <th style={{ border: '1px solid #ffccc7', padding: '10px', backgroundColor: '#ffa39e', textAlign: 'left' }}>ข้อมูลต้นฉบับ (ซ้าย)</th>
                    <th style={{ border: '1px solid #ffccc7', padding: '10px', backgroundColor: '#ffa39e', textAlign: 'left' }}>ข้อมูลจากโปรแกรม (ขวา)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.discrepancies.map((diff, idx) => (
                    <tr 
                      key={idx}
                      onClick={() => setSelectedField(diff.field)} // คลิกที่ตารางก็ Auto Zoom ได้เหมือนกัน!
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ border: '1px solid #ffccc7', padding: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {diff.field.replace(/_/g, ' ')}
                      </td>
                      <td style={{ border: '1px solid #ffccc7', padding: '10px', color: '#d9363e' }}>{parseFieldData(diff.original_value).text || '(ว่าง)'}</td>
                      <td style={{ border: '1px solid #ffccc7', padding: '10px', color: '#d9363e' }}>{parseFieldData(diff.program_value).text || '(ว่าง)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
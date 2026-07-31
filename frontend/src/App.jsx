import React, { useState } from 'react';
import DocumentPane from './DocumentPane';

// ฟังก์ชันนี้ยังต้องเก็บไว้ใน App.jsx เพราะใช้ตอนวาดตาราง Error List ข้างล่าง
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

function App() {
  const [fileOriginal, setFileOriginal] = useState(null);
  const [fileProgram, setFileProgram] = useState(null);
  
  // State สำหรับเก็บค่าบริษัทที่เลือก (ค่าเริ่มต้นเป็น OOCL)
  const [selectedCompany, setSelectedCompany] = useState('OOCL'); 
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // ศูนย์กลางควบคุม State
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
    setSelectedField(null);
    
    const formData = new FormData();
    // ส่งชื่อบริษัทตามที่ผู้ใช้งานเลือกผ่าน Dropdown
    formData.append('company', selectedCompany); 
    formData.append('file_original', fileOriginal);
    formData.append('file_program', fileProgram);

    try {
      const response = await fetch('http://localhost:8000/api/v1/process-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorDetail = errorData.detail ? JSON.stringify(errorData.detail, null, 2) : 'Unknown Error';
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

      {/* ส่วนเลือกบริษัท (Dropdown) */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <label style={{ marginRight: '15px', fontWeight: 'bold', fontSize: '1.2em' }}>
          เลือกบริษัท (Shipping Line):
        </label>
        <select 
          value={selectedCompany} 
          onChange={(e) => setSelectedCompany(e.target.value)}
          style={{ 
            padding: '10px 20px', 
            fontSize: '1.1em', 
            borderRadius: '6px', 
            border: '2px solid #ccc',
            cursor: 'pointer'
          }}
        >
          <option value="OOCL">OOCL</option>
          <option value="B_FOODS">B.FOODS</option>
        </select>
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
            <DocumentPane 
              title="Original Document (ซ้าย)" 
              fileData={results.original} 
              discrepancies={results.discrepancies}
              selectedField={selectedField}
              setSelectedField={setSelectedField}
              hoveredField={hoveredField}
              setHoveredField={setHoveredField}
            />
            <DocumentPane 
              title="Program Document (ขวา)" 
              fileData={results.program} 
              discrepancies={results.discrepancies}
              selectedField={selectedField}
              setSelectedField={setSelectedField}
              hoveredField={hoveredField}
              setHoveredField={setHoveredField}
            />
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
                  {results.discrepancies.map((diff, idx) => {
                    const isSelectedRow = selectedField === diff.field;
                    
                    return (
                      <tr 
                        key={idx}
                        onClick={() => setSelectedField(diff.field)} 
                        onMouseEnter={() => setHoveredField(diff.field)}
                        onMouseLeave={() => setHoveredField(null)}
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: isSelectedRow ? '#fff9c4' : 'transparent',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <td style={{ border: '1px solid #ffccc7', padding: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          {diff.field.replace(/_/g, ' ')}
                        </td>
                        <td style={{ border: '1px solid #ffccc7', padding: '10px', color: '#d9363e' }}>{parseFieldData(diff.original_value).text || '(ว่าง)'}</td>
                        <td style={{ border: '1px solid #ffccc7', padding: '10px', color: '#d9363e' }}>{parseFieldData(diff.program_value).text || '(ว่าง)'}</td>
                      </tr>
                    );
                  })}
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
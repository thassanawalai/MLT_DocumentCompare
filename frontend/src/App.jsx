import React, { useEffect, useState } from 'react';
import DocumentPane from './DocumentPane';

// Helper component to render diffs
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

// This parse function is used in both ComparisonFields and the discrepancy list
const parseFieldData = (val) => {
  if (val === null || val === undefined || val === '') return { text: '', bbox: null };
  if (typeof val === 'object') {
    return {
      text: val.value !== undefined ? String(val.value) : '',
      bbox: val.bbox || null 
    };
  }
  return { text: String(val), bbox: null };
};

// ---- ชุดสีและสไตล์กลาง (ปรับแค่ความสวยงาม ไม่กระทบ logic) ----
const theme = {
  bg: '#eef2f6',
  surface: '#ffffff',
  ink: '#1f2937',
  inkSoft: '#64748b',
  border: '#e2e8f0',
  blue: '#2563eb',
  blueSoft: '#eff6ff',
  green: '#16a34a',
  greenSoft: '#ecfdf5',
  red: '#dc2626',
  redSoft: '#fef2f2',
  shadow: '0 10px 30px -12px rgba(15, 23, 42, 0.18)',
};

const translations = {
  th: {
    language: 'ภาษา', verification: 'MLT Verification', heading: 'ระบบเปรียบเทียบเอกสาร', subheading: 'เครื่องมือสำหรับตรวจสอบเอกสาร MLT',
    originalDocument: 'เอกสารต้นฉบับ', originalDescription: 'นำเข้าเอกสารที่นี่',
    programDocument: 'เอกสารจากโปรแกรม', programDescription: 'นำเข้าเอกสารที่นี่', template: 'รูปแบบเอกสาร:',
    uploadRequired: 'กรุณาอัปโหลดเอกสารให้ครบทั้ง 2 ฝั่ง (ต้นฉบับ และ โปรแกรม)', comparing: 'กำลังเปรียบเทียบเอกสาร...', compare: 'เปรียบเทียบข้อมูล',
    templateLoadError: 'ไม่สามารถโหลดรายการรูปแบบเอกสารได้', unknownError: 'ไม่ทราบข้อผิดพลาด', dataFetchError: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
    originalPane: 'เอกสารต้นฉบับ (ซ้าย)', programPane: 'เอกสารจากโปรแกรม (ขวา)',
    comparisonTitle: 'ตารางเปรียบเทียบข้อมูล', comparisonHint: 'ข้อมูลแต่ละ field อยู่ในแถวเดียวกันเพื่อเทียบซ้าย–ขวาได้ทันที · คลิกแถวเพื่อดูตำแหน่งบน PDF',
    field: 'ฟิลด์', originalColumn: 'ต้นฉบับ (ซ้าย)', programColumn: 'โปรแกรม (ขวา)', noData: '(ไม่พบข้อมูล)',
    errorList: 'รายการข้อมูลที่ไม่ตรงกัน', discrepanciesFound: 'พบข้อมูลไม่ตรงกัน', points: 'จุด', fieldName: 'ชื่อฟิลด์',
    originalData: 'ข้อมูลต้นฉบับ (ซ้าย)', programData: 'ข้อมูลจากโปรแกรม (ขวา)', allMatch: 'ยอดเยี่ยม! ข้อมูลตรงกันทุกจุด',
  },
  en: {
    language: 'Language', verification: 'MLT Verification', heading: 'Document Comparison System', subheading: 'A tool for MLT document verification.',
    originalDocument: 'Original Document', originalDescription: 'Upload your file here',
    programDocument: 'Program Document', programDescription: 'Upload your file here', template: 'Template:',
    uploadRequired: 'Please upload both documents (Original and Program).', comparing: 'Comparing documents...', compare: 'Compare Data',
    templateLoadError: 'Unable to load the template list', unknownError: 'Unknown Error', dataFetchError: 'An error occurred while retrieving data.',
    originalPane: 'Original Document (Left)', programPane: 'Program Document (Right)',
    comparisonTitle: 'Field Comparison', comparisonHint: 'Each field is aligned in one row for easy side-by-side comparison · Click a row to view its location in the PDF.',
    field: 'Field', originalColumn: 'Original (Left)', programColumn: 'Program (Right)', noData: '(Not found)',
    errorList: 'Discrepancy List', discrepanciesFound: 'discrepancies found', points: '', fieldName: 'Field Name',
    originalData: 'Original Data (Left)', programData: 'Program Data (Right)', allMatch: 'Excellent! All data points match.',
  },
};

const ComparisonFields = ({ originalData, programData, discrepancies, selectedField, onSelectField, copy }) => {
  const fieldKeys = Array.from(new Set([
    ...Object.keys(originalData || {}),
    ...Object.keys(programData || {})
  ]));
  const discrepancyFields = new Set((discrepancies || []).map(({ field }) => field));

  const cellStyle = (isMismatch, isSelected) => ({
    padding: '14px 16px',
    borderBottom: `1px solid ${theme.border}`,
    backgroundColor: isSelected ? '#fef9c3' : (isMismatch ? theme.redSoft : theme.surface),
    color: theme.ink,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    lineHeight: 1.5,
  });

  return (
    <section style={{
      marginTop: '32px',
      border: `1px solid ${theme.border}`,
      borderRadius: '16px',
      overflow: 'hidden',
      backgroundColor: theme.surface,
      boxShadow: theme.shadow,
    }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}` }}>
        <h2 style={{ color: theme.ink, margin: 0, fontSize: '1.35em' }}>{copy.comparisonTitle}</h2>
        <p style={{ color: theme.inkSoft, margin: '6px 0 0' }}>{copy.comparisonHint}</p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '720px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(170px, 0.8fr) minmax(260px, 1.6fr) minmax(260px, 1.6fr)', backgroundColor: theme.blueSoft, color: theme.ink, fontWeight: 800 }}>
            <div style={{ padding: '12px 16px' }}>{copy.field}</div>
            <div style={{ padding: '12px 16px' }}>{copy.originalColumn}</div>
            <div style={{ padding: '12px 16px' }}>{copy.programColumn}</div>
          </div>
          {fieldKeys.map((key) => {
            const isMismatch = discrepancyFields.has(key);
            const isSelected = selectedField === key;

            // Reverted to showing plain text only
            const originalValue = parseFieldData(originalData?.[key]).text;
            const programValue = parseFieldData(programData?.[key]).text;

            return (
              <div
                key={key}
                onClick={() => onSelectField(key)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(170px, 0.8fr) minmax(260px, 1.6fr) minmax(260px, 1.6fr)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ ...cellStyle(isMismatch, isSelected), fontWeight: 800, textTransform: 'uppercase', color: isMismatch ? theme.red : theme.ink }}>
                  {key.replace(/_/g, ' ')}
                </div>
                <div style={cellStyle(isMismatch, isSelected)}>{originalValue || copy.noData}</div>
                <div style={cellStyle(isMismatch, isSelected)}>{programValue || copy.noData}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};


// Map between user-facing labels and backend values
const templateOptions = [
  { value: 'OOCL', label: 'OOCL' },
  { value: 'MCKEY', label: 'MCKEY' },
  { value: 'BFOODS_1', label: 'B.FOODS_1' },
  { value: 'BFOODS_2', label: 'B.FOODS_2' },
  { value: 'BFOODS_3', label: 'B.FOODS_3' },
  { value: 'AJIMOMOTO', label: 'AJINOMOTO' },
  { value: 'SIAMCHAI', label: 'SIAMCHAI' },
  { value: 'SURAPON', label: 'SURAPON' },
  { value: 'POLYPLEX', label: 'POLYPLEX' },
];

function App() {
  const [fileOriginal, setFileOriginal] = useState(null);
  const [fileProgram, setFileProgram] = useState(null);
  const [language, setLanguage] = useState('en');
  const copy = translations[language];
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // State for dropdowns. The value stored here is the backend value (e.g., 'BETAGRO')
  const [companyOrig, setCompanyOrig] = useState('OOCL');
  const [companyProg, setCompanyProg] = useState('MCKEY');

  // Center of state control
  const [selectedField, setSelectedField] = useState(null); 
  const [hoveredField, setHoveredField] = useState(null);

  useEffect(() => {
    // Templates are now hardcoded, no need to fetch.
  }, []);

  const handleProcessFiles = async () => {
    if (!fileOriginal || !fileProgram) {
      setErrorMessage(copy.uploadRequired);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setResults(null);
    setSelectedField(null);
    
    const formData = new FormData();
    // Send company names for each side
    formData.append('company_original', companyOrig);
    formData.append('company_program', companyProg);
    formData.append('file_original', fileOriginal);
    formData.append('file_program', fileProgram);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/v1/process-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorDetail = errorData.detail ? JSON.stringify(errorData.detail, null, 2) : copy.unknownError;
        throw new Error(`Backend Error (${response.status}):\n${errorDetail}`);
      }

      const result = await response.json();
      if (result.status === 'success') {
        setResults(result);
      } else {
          setErrorMessage(result.detail || copy.dataFetchError);
      }
    } catch (error) {
      console.error("Upload error details:", error.message);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      backgroundImage: 'radial-gradient(circle at 15% 0%, rgba(37,99,235,0.06), transparent 45%), radial-gradient(circle at 85% 0%, rgba(22,163,74,0.06), transparent 45%)',
      fontFamily: "'IBM Plex Sans Thai', 'IBM Plex Sans', 'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '40px 24px' }}>
        <header style={{ textAlign: 'center', marginBottom: '36px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center', gap: '6px', color: theme.inkSoft, fontSize: '0.85em', fontWeight: 700 }}>
            <span>{copy.language}</span>
            {['th', 'en'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                style={{ padding: '6px 10px', border: `1px solid ${theme.border}`, borderRadius: '7px', backgroundColor: language === code ? theme.blue : theme.surface, color: language === code ? 'white' : theme.inkSoft, fontWeight: 800, cursor: 'pointer' }}
              >
                {code === 'th' ? 'ไทย' : 'EN'}
              </button>
            ))}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            color: theme.inkSoft,
            fontSize: '0.8em',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: theme.shadow,
            marginBottom: '18px',
          }}>
            {copy.verification}
          </div>
          <h1 style={{
            color: theme.ink,
            fontSize: '2.6em',
            margin: 0,
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}>{copy.heading}</h1>
          <p style={{ color: theme.inkSoft, fontSize: '1.1em', marginTop: '10px' }}>
            {copy.subheading}
          </p>
        </header>
        
        {/* Control Panel */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '24px', 
          marginBottom: '28px', 
        }}>
          {/* Left Side */}
          <div style={{
            padding: '24px',
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            backgroundColor: theme.surface,
            boxShadow: theme.shadow,
            borderTop: `4px solid ${theme.blue}`,
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: theme.blueSoft,
              color: theme.blue,
              fontWeight: 800,
              marginBottom: '12px',
            }}>1</div>
            <h3 style={{ color: theme.ink, marginTop: 0, marginBottom: '4px', fontSize: '1.2em' }}>{copy.originalDocument}</h3>
            <p style={{ fontSize: '0.9em', color: theme.inkSoft, marginTop: 0 }}>{copy.originalDescription}</p>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFileOriginal(e.target.files[0])}
              style={{
                marginBottom: '18px',
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: `1px dashed ${theme.border}`,
                backgroundColor: theme.blueSoft,
                color: theme.ink,
                boxSizing: 'border-box',
              }}
            />
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, color: theme.ink }}>{copy.template}</label>
            <select 
              value={companyOrig} 
              onChange={(e) => setCompanyOrig(e.target.value)}
              style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.surface, color: theme.ink, boxSizing: 'border-box', cursor: 'pointer' }}
            >
              {templateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Right Side */}
          <div style={{
            padding: '24px',
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            backgroundColor: theme.surface,
            boxShadow: theme.shadow,
            borderTop: `4px solid ${theme.green}`,
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: theme.greenSoft,
              color: theme.green,
              fontWeight: 800,
              marginBottom: '12px',
            }}>2</div>
            <h3 style={{ color: theme.ink, marginTop: 0, marginBottom: '4px', fontSize: '1.2em' }}>{copy.programDocument}</h3>
            <p style={{ fontSize: '0.9em', color: theme.inkSoft, marginTop: 0 }}>{copy.programDescription}</p>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFileProgram(e.target.files[0])}
              style={{
                marginBottom: '18px',
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: `1px dashed ${theme.border}`,
                backgroundColor: theme.greenSoft,
                color: theme.ink,
                boxSizing: 'border-box',
              }}
            />
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, color: theme.ink }}>{copy.template}</label>
            <select 
              value={companyProg} 
              onChange={(e) => setCompanyProg(e.target.value)}
              style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.surface, color: theme.ink, boxSizing: 'border-box', cursor: 'pointer' }}
            >
              {templateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <button 
            onClick={handleProcessFiles} 
            disabled={loading}
            style={{
              padding: '15px 44px',
              fontSize: '1.15em',
              fontWeight: 700,
              backgroundColor: loading ? '#94a3b8' : theme.blue,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.15s ease, background-color 0.3s, box-shadow 0.3s',
              boxShadow: loading ? 'none' : '0 12px 24px -10px rgba(37,99,235,0.7)',
            }}
          >
            {loading ? copy.comparing : copy.compare}
          </button>
        </div>

        {errorMessage && (
          <div style={{
            padding: '16px 18px',
            backgroundColor: theme.redSoft,
            color: theme.red,
            border: `1px solid #fecaca`,
            borderRadius: '12px',
            textAlign: 'center',
            marginBottom: '20px',
            fontWeight: 600,
            whiteSpace: 'pre-wrap',
          }}>
            {errorMessage}
          </div>
        )}

        {results && (
          <>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
              <DocumentPane 
                title={copy.originalPane}
                fileData={results.original} 
                discrepancies={results.discrepancies}
                selectedField={selectedField}
                setSelectedField={setSelectedField}
                hoveredField={hoveredField}
                setHoveredField={setHoveredField}
                showFieldList={false}
                notFoundLabel={copy.noData}
              />
              <DocumentPane 
                title={copy.programPane}
                fileData={results.program} 
                discrepancies={results.discrepancies}
                selectedField={selectedField}
                setSelectedField={setSelectedField}
                hoveredField={hoveredField}
                setHoveredField={setHoveredField}
                showFieldList={false}
                notFoundLabel={copy.noData}
              />
            </div>

            <div style={{
              marginTop: '32px',
              padding: '24px',
              border: `1px solid #fecaca`,
              borderRadius: '16px',
              backgroundColor: theme.surface,
              boxShadow: theme.shadow,
              borderTop: `4px solid ${theme.red}`,
            }}>
              <h2 style={{ color: theme.red, marginTop: 0, fontSize: '1.4em' }}>
                ⚠️ {copy.errorList}: {results.discrepancies.length} {copy.discrepanciesFound} {copy.points}
              </h2>
              
              {results.discrepancies.length === 0 ? (
                <p style={{ color: theme.green, fontWeight: 700, fontSize: '1.2em' }}>✅ {copy.allMatch}</p>
              ) : (
                <div style={{ overflow: 'hidden', borderRadius: '12px', border: `1px solid ${theme.border}`, marginTop: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: theme.surface }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '12px 14px', backgroundColor: theme.redSoft, color: theme.red, textAlign: 'left', fontSize: '0.85em', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${theme.border}` }}>{copy.fieldName}</th>
                        <th style={{ padding: '12px 14px', backgroundColor: theme.redSoft, color: theme.red, textAlign: 'left', fontSize: '0.85em', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${theme.border}` }}>{copy.originalData}</th>
                        <th style={{ padding: '12px 14px', backgroundColor: theme.redSoft, color: theme.red, textAlign: 'left', fontSize: '0.85em', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${theme.border}` }}>{copy.programData}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.discrepancies.map((diff, idx) => {
                        const isSelectedRow = selectedField === diff.field;
                        const originalDiffData = diff.original_value.diff;
                        const programDiffData = diff.program_value.diff;
                        
                        return (
                          <tr 
                            key={idx}
                            onClick={() => setSelectedField(diff.field)} 
                            onMouseEnter={() => setHoveredField(diff.field)}
                            onMouseLeave={() => setHoveredField(null)}
                            style={{ 
                              cursor: 'pointer',
                              backgroundColor: isSelectedRow ? '#fef9c3' : 'transparent',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            <td style={{ borderBottom: `1px solid ${theme.border}`, padding: '12px 14px', fontWeight: 700, textTransform: 'uppercase', color: theme.ink }}>
                              {diff.field.replace(/_/g, ' ')}
                            </td>
                            <td style={{ borderBottom: `1px solid ${theme.border}`, padding: '12px 14px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                              {originalDiffData ? <DiffText diffData={originalDiffData} /> : (parseFieldData(diff.original_value).text || '(ว่าง)')}
                            </td>
                            <td style={{ borderBottom: `1px solid ${theme.border}`, padding: '12px 14px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                              {programDiffData ? <DiffText diffData={programDiffData} /> : (parseFieldData(diff.program_value).text || '(ว่าง)')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <ComparisonFields
              originalData={results.original.data}
              programData={results.program.data}
              discrepancies={results.discrepancies}
              selectedField={selectedField}
              onSelectField={setSelectedField}
              copy={copy}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;

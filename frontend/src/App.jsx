import React, { useState, useEffect } from 'react';
import DocumentPane from './DocumentPane';

// This function should be kept in App.jsx as it is used for rendering the Error List table below.
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

  // State for the list of companies/templates
  const [templates, setTemplates] = useState([]);
  // Separate states for each dropdown
  const [selectedCompanyOriginal, setSelectedCompanyOriginal] = useState(''); 
  const [selectedCompanyProgram, setSelectedCompanyProgram] = useState(''); 

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Central state control
  const [selectedField, setSelectedField] = useState(null); 
  const [hoveredField, setHoveredField] = useState(null);

  // Fetch templates from the backend when the component mounts
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/templates');
        if (!response.ok) {
          throw new Error('Could not fetch templates');
        }
        const data = await response.json();
        const templateNames = data.templates || [];
        setTemplates(templateNames);
        // Set default values for dropdowns
        if (templateNames.length > 0) {
          setSelectedCompanyOriginal(templateNames[0]);
          setSelectedCompanyProgram(templateNames[0]);
        }
      } catch (error) {
        setErrorMessage('Error fetching template list: ' + error.message);
      }
    };
    fetchTemplates();
  }, []);

  const handleProcessFiles = async () => {
    if (!fileOriginal || !fileProgram) {
      setErrorMessage('Please upload documents for both sides (Original and Program).');
      return;
    }
    if (!selectedCompanyOriginal || !selectedCompanyProgram) {
      setErrorMessage('Please select a template for both documents.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setResults(null);
    setSelectedField(null);

    const formData = new FormData();
    // Append the two selected company names
    formData.append('company_original', selectedCompanyOriginal); 
    formData.append('company_program', selectedCompanyProgram); 
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
        setErrorMessage(result.detail || 'An error occurred while fetching data.');
      }
    } catch (error) {
      console.error("Upload error details:", error.message);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const dropdownStyle = { 
    padding: '10px 20px', 
    fontSize: '1.1em', 
    borderRadius: '6px', 
    border: '2px solid #ccc',
    cursor: 'pointer'
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Document Compare & Approve System</h1>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1, padding: '20px', border: '2px dashed #007BFF', borderRadius: '8px', textAlign: 'center' }}>
          <h3>Left Side: Original Document</h3>
          <input type="file" accept="application/pdf" onChange={(e) => setFileOriginal(e.target.files[0])} />
        </div>
        <div style={{ flex: 1, padding: '20px', border: '2px dashed #28A745', borderRadius: '8px', textAlign: 'center' }}>
          <h3>Right Side: Program Document (Compare)</h3>
          <input type="file" accept="application/pdf" onChange={(e) => setFileProgram(e.target.files[0])} />
        </div>
      </div>

      {/* Company Selection (Dropdowns) */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{textAlign: 'center'}}>
          <label style={{ marginRight: '15px', fontWeight: 'bold', fontSize: '1.2em' }}>
            Original Doc Template:
          </label>
          <select 
            value={selectedCompanyOriginal} 
            onChange={(e) => setSelectedCompanyOriginal(e.target.value)}
            style={dropdownStyle}
          >
            <option value="" disabled>Select Template</option>
            {templates.map(name => <option key={name} value={name}>{name.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div style={{textAlign: 'center'}}>
          <label style={{ marginRight: '15px', fontWeight: 'bold', fontSize: '1.2em' }}>
            Program Doc Template:
          </label>
          <select 
            value={selectedCompanyProgram} 
            onChange={(e) => setSelectedCompanyProgram(e.target.value)}
            style={dropdownStyle}
          >
            <option value="" disabled>Select Template</option>
            {templates.map(name => <option key={name} value={name}>{name.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button 
          onClick={handleProcessFiles} 
          disabled={loading}
          style={{ padding: '12px 30px', fontSize: '1.1em', backgroundColor: loading ? '#999' : '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Comparing documents...' : 'Compare Data'}
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
              title="Original Document (Left)" 
              fileData={results.original} 
              discrepancies={results.discrepancies}
              selectedField={selectedField}
              setSelectedField={setSelectedField}
              hoveredField={hoveredField}
              setHoveredField={setHoveredField}
            />
            <DocumentPane 
              title="Program Document (Right)" 
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
              ⚠️ Error List: Found {results.discrepancies.length} discrepancies
            </h2>

            {results.discrepancies.length === 0 ? (
              <p style={{ color: '#389e0d', fontWeight: 'bold', fontSize: '1.2em' }}>✅ Excellent! All data points match.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', backgroundColor: '#fff' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ffccc7', padding: '10px', backgroundColor: '#ffa39e', textAlign: 'left' }}>Field Name</th>
                    <th style={{ border: '1px solid #ffccc7', padding: '10px', backgroundColor: '#ffa39e', textAlign: 'left' }}>Original Data (Left)</th>
                    <th style={{ border: '1px solid #ffccc7', padding: '10px', backgroundColor: '#ffa39e', textAlign: 'left' }}>Program Data (Right)</th>
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
                        <td style={{ border: '1px solid #ffccc7', padding: '10px', color: '#d9363e' }}>{parseFieldData(diff.original_value).text || '(empty)'}</td>
                        <td style={{ border: '1px solid #ffccc7', padding: '10px', color: '#d9363e' }}>{parseFieldData(diff.program_value).text || '(empty)'}</td>
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
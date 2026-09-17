import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';

const HSCodeSearch = () => {
  const [masterData, setMasterData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const fileInputRef = useRef(null);

  // 1. Handle File Upload and Parsing (Client-Side)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Assume data is in the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert sheet to JSON array
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      
      setMasterData(jsonData);
      setIsLoaded(true);
    };
    reader.readAsArrayBuffer(file);
  };

  // 2. High-Performance Search using useMemo
  const filteredData = useMemo(() => {
    if (!searchTerm) return masterData;
    
    const lowercasedTerm = searchTerm.toLowerCase();
    
    return masterData.filter((row) => {
      // Search across all values in the row dynamically
      return Object.values(row).some((value) => 
        String(value).toLowerCase().includes(lowercasedTerm)
      );
    });
  }, [masterData, searchTerm]);

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const styles = {
    container: { padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' },
    header: { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' },
    uploadSection: { 
      padding: '40px', 
      border: '2px dashed #cbd5e1', 
      borderRadius: '8px', 
      textAlign: 'center',
      marginBottom: '24px',
      backgroundColor: '#f8fafc'
    },
    button: { padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' },
    searchInput: { width: '100%', padding: '14px 18px', fontSize: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '24px', outline: 'none', boxSizing: 'border-box' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { backgroundColor: '#f8fafc', padding: '16px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600' },
    td: { padding: '16px', borderBottom: '1px solid #e2e8f0', color: '#334155' }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>HS Code Master Data</h2>

      {/* Hidden File Input */}
      <input 
        type="file" 
        accept=".xlsx, .xls, .csv" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        style={{ display: 'none' }} 
      />

      {/* Upload State */}
      {!isLoaded ? (
        <div style={styles.uploadSection}>
          <h3 style={{ marginBottom: '16px', color: '#475569' }}>Upload Master Excel File</h3>
          <button style={styles.button} onClick={triggerFileInput}>
            Select Excel File
          </button>
        </div>
      ) : (
        /* Loaded State - Search & Table */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Data Loaded ({masterData.length} records)</span>
            <button style={{...styles.button, backgroundColor: '#64748b', fontSize: '14px'}} onClick={triggerFileInput}>
              Upload New File
            </button>
          </div>

          <input
            type="text"
            placeholder="Search any keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />

          <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {masterData.length > 0 && Object.keys(masterData[0]).map((key, index) => (
                    <th key={index} style={styles.th}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 100).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((val, colIndex) => (
                      <td key={colIndex} style={styles.td}>{val}</td>
                    ))}
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={masterData.length > 0 ? Object.keys(masterData[0]).length : 1} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filteredData.length > 100 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '14px', backgroundColor: '#f8fafc' }}>
                Showing first 100 results for performance. Please refine your search.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HSCodeSearch;
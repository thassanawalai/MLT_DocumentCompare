import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';

const HSCodeSearch = () => {
  const [masterData, setMasterData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Auto-fetch data from the public folder when component mounts
  useEffect(() => {
    const fetchDatabase = async () => {
      try {
        const response = await fetch('/HS_Master.csv');
        
        if (!response.ok) {
          throw new Error('Database file not found in public folder.');
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Read as an array of arrays (ignores header names completely)
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Find the actual starting row dynamically (search for 'Customer Name' or 'HS Code')
        let dataStartIndex = 0;
        for (let i = 0; i < Math.min(15, rawData.length); i++) {
          const rowValues = rawData[i].map(val => String(val).toLowerCase());
          if (rowValues.includes('customer name') || rowValues.includes('hs code')) {
            dataStartIndex = i + 1; // Start extracting from the row below the headers
            break;
          }
        }
        
        // Extract data and format it into clean objects
        const cleanData = [];
        for (let i = dataStartIndex; i < rawData.length; i++) {
          const rowArray = rawData[i];
          
          // Skip completely empty rows
          if (!rowArray || rowArray.length === 0 || rowArray.every(val => !val)) continue;
          
          cleanData.push({
            sale: rowArray[0] || '-',
            customer: rowArray[1] || '-',
            commodity: rowArray[2] || '-',
            hsCode: rowArray[3] || '-'
          });
        }
        
        setMasterData(cleanData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading database:', error);
        setErrorMsg('Could not load the database. Please check the file format.');
        setIsLoading(false);
      }
    };

    fetchDatabase();
  }, []);

  // 2. High-Performance Global Search (Updated to match new keys)
  const filteredData = useMemo(() => {
    if (!searchTerm) return masterData;
    
    const lowercasedTerm = searchTerm.toLowerCase();
    
    return masterData.filter((row) => {
      return Object.values(row).some((value) => 
        String(value).toLowerCase().includes(lowercasedTerm)
      );
    });
  }, [masterData, searchTerm]);

  const styles = {
    container: { padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' },
    header: { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' },
    searchInput: { width: '100%', padding: '14px 18px', fontSize: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '24px', outline: 'none', boxSizing: 'border-box' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' },
    th: { backgroundColor: '#f8fafc', padding: '16px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600' },
    td: { padding: '16px', borderBottom: '1px solid #e2e8f0', color: '#334155' },
    statusBox: { padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '2px dashed #cbd5e1', color: '#64748b' }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>HS Code Directory</h2>

      {isLoading ? (
        <div style={styles.statusBox}>
          <h3>Loading Database...</h3>
        </div>
      ) : errorMsg ? (
        <div style={{...styles.statusBox, borderColor: '#fca5a5', color: '#ef4444'}}>
          <h3>{errorMsg}</h3>
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search Sale, Customer Name, Commodity, or HS Code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />

          <div style={{ overflowX: 'auto', borderRadius: '8px' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Sale</th>
                  <th style={styles.th}>Customer Name</th>
                  <th style={styles.th}>Commodity</th>
                  <th style={styles.th}>HS Code</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 150).map((row, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{row.sale}</td>
                    <td style={styles.td}>{row.customer}</td>
                    <td style={styles.td}>{row.commodity}</td>
                    <td style={{...styles.td, fontWeight: 'bold', color: '#0f172a'}}>{row.hsCode}</td>
                  </tr>
                ))}
                
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {filteredData.length > 150 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '14px', backgroundColor: '#f8fafc' }}>
                Showing first 150 results for performance.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default HSCodeSearch;
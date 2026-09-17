import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';

const HSCodeSearch = () => {
  const [masterData, setMasterData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // States for Add/Edit/Delete functionality
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({ sale: '', customer: '', commodity: '', hsCode: '' });
  
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ sale: '', customer: '', commodity: '', hsCode: '' });

  // 1. Auto-fetch data
  useEffect(() => {
    const fetchDatabase = async () => {
      try {
        const response = await fetch('/HS_Master.csv');
        if (!response.ok) throw new Error('Database file not found in public folder.');

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        let dataStartIndex = 0;
        for (let i = 0; i < Math.min(15, rawData.length); i++) {
          const rowValues = rawData[i].map(val => String(val).toLowerCase());
          if (rowValues.includes('customer name') || rowValues.includes('hs code')) {
            dataStartIndex = i + 1; 
            break;
          }
        }
        
        const cleanData = [];
        for (let i = dataStartIndex; i < rawData.length; i++) {
          const rowArray = rawData[i];
          if (!rowArray || rowArray.length === 0 || rowArray.every(val => !val)) continue;
          
          cleanData.push({
            id: `id_${Date.now()}_${i}`, // Generate unique ID for CRUD operations
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

  // 2. High-Performance Global Search
  const filteredData = useMemo(() => {
    if (!searchTerm) return masterData;
    const lowercasedTerm = searchTerm.toLowerCase();
    
    return masterData.filter((row) => {
      // Exclude 'id' from search
      const { id, ...searchableFields } = row;
      return Object.values(searchableFields).some((value) => 
        String(value).toLowerCase().includes(lowercasedTerm)
      );
    });
  }, [masterData, searchTerm]);

  // --- CRUD Handlers ---
  const handleAddSubmit = (e) => {
    e.preventDefault();
    const newRecord = {
      ...addFormData,
      id: `id_${Date.now()}`
    };
    // Add new record to the top of the list
    setMasterData([newRecord, ...masterData]);
    setShowAddForm(false);
    setAddFormData({ sale: '', customer: '', commodity: '', hsCode: '' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setMasterData(masterData.filter(row => row.id !== id));
    }
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setEditFormData({ ...row });
  };

  const handleEditSave = () => {
    setMasterData(masterData.map(row => (row.id === editingId ? editFormData : row)));
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const styles = {
    container: { padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' },
    headerBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    header: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 },
    primaryBtn: { padding: '10px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
    actionBtn: { padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', backgroundColor: '#fff', margin: '0 4px' },
    saveBtn: { padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', backgroundColor: '#10b981', color: '#fff', margin: '0 4px' },
    deleteBtn: { padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', backgroundColor: '#ef4444', color: '#fff', margin: '0 4px' },
    searchInput: { width: '100%', padding: '14px 18px', fontSize: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '24px', outline: 'none', boxSizing: 'border-box' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' },
    th: { backgroundColor: '#f8fafc', padding: '16px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600' },
    td: { padding: '16px', borderBottom: '1px solid #e2e8f0', color: '#334155' },
    editInput: { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #94a3b8', fontSize: '14px', boxSizing: 'border-box' },
    addFormBox: { padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '24px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerBox}>
        <h2 style={styles.header}>HS Code Directory</h2>
        <button style={styles.primaryBtn} onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel Adding' : '+ Add New Record'}
        </button>
      </div>

      {showAddForm && (
        <form style={styles.addFormBox} onSubmit={handleAddSubmit}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>Add New Master Data</h3>
          <div style={styles.formGrid}>
            <input required placeholder="Sale (e.g. P'POK)" style={styles.editInput} value={addFormData.sale} onChange={e => setAddFormData({...addFormData, sale: e.target.value})} />
            <input required placeholder="Customer Name" style={styles.editInput} value={addFormData.customer} onChange={e => setAddFormData({...addFormData, customer: e.target.value})} />
            <input required placeholder="Commodity" style={styles.editInput} value={addFormData.commodity} onChange={e => setAddFormData({...addFormData, commodity: e.target.value})} />
            <input required placeholder="HS Code" style={styles.editInput} value={addFormData.hsCode} onChange={e => setAddFormData({...addFormData, hsCode: e.target.value})} />
          </div>
          <button type="submit" style={styles.primaryBtn}>Save Record</button>
        </form>
      )}

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading Database...</div>
      ) : errorMsg ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{errorMsg}</div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search Sale, Customer Name, Commodity, or HS Code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />

          <div style={{ overflowX: 'auto', borderRadius: '8px', paddingBottom: '20px' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Sale</th>
                  <th style={styles.th}>Customer Name</th>
                  <th style={styles.th}>Commodity</th>
                  <th style={styles.th}>HS Code</th>
                  <th style={{...styles.th, width: '140px', textAlign: 'center'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 150).map((row) => {
                  const isEditing = editingId === row.id;

                  return (
                    <tr key={row.id}>
                      {/* Sale */}
                      <td style={styles.td}>
                        {isEditing ? (
                          <input style={styles.editInput} value={editFormData.sale} onChange={(e) => setEditFormData({...editFormData, sale: e.target.value})} />
                        ) : (row.sale)}
                      </td>
                      
                      {/* Customer */}
                      <td style={styles.td}>
                        {isEditing ? (
                          <input style={styles.editInput} value={editFormData.customer} onChange={(e) => setEditFormData({...editFormData, customer: e.target.value})} />
                        ) : (row.customer)}
                      </td>
                      
                      {/* Commodity */}
                      <td style={styles.td}>
                        {isEditing ? (
                          <input style={styles.editInput} value={editFormData.commodity} onChange={(e) => setEditFormData({...editFormData, commodity: e.target.value})} />
                        ) : (row.commodity)}
                      </td>
                      
                      {/* HS Code */}
                      <td style={{...styles.td, fontWeight: isEditing ? 'normal' : 'bold', color: isEditing ? 'inherit' : '#0f172a'}}>
                        {isEditing ? (
                          <input style={styles.editInput} value={editFormData.hsCode} onChange={(e) => setEditFormData({...editFormData, hsCode: e.target.value})} />
                        ) : (row.hsCode)}
                      </td>

                      {/* Actions */}
                      <td style={{...styles.td, textAlign: 'center'}}>
                        {isEditing ? (
                          <>
                            <button style={styles.saveBtn} onClick={handleEditSave}>Save</button>
                            <button style={styles.actionBtn} onClick={handleEditCancel}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button style={styles.actionBtn} onClick={() => handleEditClick(row)}>Edit</button>
                            <button style={styles.deleteBtn} onClick={() => handleDelete(row.id)}>Del</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default HSCodeSearch;
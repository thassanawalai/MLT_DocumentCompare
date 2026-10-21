import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest, jsonRequest } from '../apiClient';

const HSCodeSearch = () => {
  const [masterData, setMasterData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [operationError, setOperationError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // States for Add/Edit/Delete functionality
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({ sale: '', customer: '', commodity: '', hsCode: '' });
  
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ sale: '', customer: '', commodity: '', hsCode: '' });

  useEffect(() => {
    const fetchDatabase = async () => {
      try {
        const records = await apiRequest('/api/v1/hs-codes');
        setMasterData(records.map((record) => ({
          id: record.id,
          sale: record.sale,
          customer: record.customer,
          commodity: record.commodity,
          hsCode: record.hs_code,
        })));
      } catch (error) {
        console.error('Error loading HS Code data:', error);
        setErrorMsg(`Could not load HS Code data. ${error.message}`);
      } finally {
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
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setOperationError('');
    try {
      const record = await apiRequest('/api/v1/hs-codes', jsonRequest('POST', {
        sale: addFormData.sale.trim(),
        customer: addFormData.customer.trim(),
        commodity: addFormData.commodity.trim(),
        hs_code: addFormData.hsCode.trim(),
      }));
      setMasterData((rows) => [{
        id: record.id,
        sale: record.sale,
        customer: record.customer,
        commodity: record.commodity,
        hsCode: record.hs_code,
      }, ...rows]);
      setShowAddForm(false);
      setAddFormData({ sale: '', customer: '', commodity: '', hsCode: '' });
    } catch (error) {
      setOperationError(`Could not add record. ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setIsSaving(true);
      setOperationError('');
      try {
        await apiRequest(`/api/v1/hs-codes/${id}`, { method: 'DELETE' });
        setMasterData((rows) => rows.filter((row) => row.id !== id));
      } catch (error) {
        setOperationError(`Could not delete record. ${error.message}`);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setEditFormData({ ...row });
  };

  const handleEditSave = async () => {
    setIsSaving(true);
    setOperationError('');
    try {
      const record = await apiRequest(`/api/v1/hs-codes/${editingId}`, jsonRequest('PATCH', {
        sale: editFormData.sale.trim(),
        customer: editFormData.customer.trim(),
        commodity: editFormData.commodity.trim(),
        hs_code: String(editFormData.hsCode).trim(),
      }));
      setMasterData((rows) => rows.map((row) => row.id === editingId ? {
        id: record.id,
        sale: record.sale,
        customer: record.customer,
        commodity: record.commodity,
        hsCode: record.hs_code,
      } : row));
      setEditingId(null);
    } catch (error) {
      setOperationError(`Could not update record. ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const styles = {
    container: { padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' },
    headerBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    header: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 },
    primaryBtn: { padding: '10px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
    actionStack: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', width: '98px', margin: '0 auto' },
    actionBtn: { width: '100%', padding: '7px 10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', lineHeight: 1, fontWeight: 'bold', backgroundColor: '#efb400', color: '#fff' },
    saveBtn: { width: '100%', padding: '7px 10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', lineHeight: 1, fontWeight: 'bold', backgroundColor: '#10b981', color: '#fff' },
    deleteBtn: { width: '100%', padding: '7px 10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', lineHeight: 1, fontWeight: 'bold', backgroundColor: '#ef4444', color: '#fff' },
    searchContainer: { position: 'relative', marginBottom: '24px' },
    searchInput: { width: '100%', padding: '14px 40px 14px 18px', fontSize: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' },
    clearSearchBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    secondaryBtn: { padding: '10px 16px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginLeft: '12px' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden', tableLayout: 'fixed' },
    th: { backgroundColor: '#f8fafc', padding: '16px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600' },
    td: { padding: '16px', borderBottom: '1px solid #e2e8f0', color: '#334155', wordWrap: 'break-word', overflowWrap: 'break-word' },
    editInput: { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #94a3b8', fontSize: '14px', boxSizing: 'border-box' },
    addFormBox: { padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '24px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerBox}>
        <h2 style={styles.header}>HS Code Directory</h2>
        <button style={styles.primaryBtn} onClick={() => setShowAddForm(!showAddForm)} disabled={isSaving}>
          {showAddForm ? 'Cancel Adding' : '+ Add New Record'}
        </button>
      </div>

      {/* --- Add Form Section --- */}
      {showAddForm && (
        <form style={styles.addFormBox} onSubmit={handleAddSubmit}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', color: '#1e293b' }}>Add New Master Data</h3>
          <div style={styles.formGrid}>
            <input required placeholder="Sale" style={styles.editInput} value={addFormData.sale} onChange={e => setAddFormData({...addFormData, sale: e.target.value})} />
            <input required placeholder="Customer Name" style={styles.editInput} value={addFormData.customer} onChange={e => setAddFormData({...addFormData, customer: e.target.value})} />
            <input required placeholder="Commodity" style={styles.editInput} value={addFormData.commodity} onChange={e => setAddFormData({...addFormData, commodity: e.target.value})} />
            <input required placeholder="HS Code" style={styles.editInput} value={addFormData.hsCode} onChange={e => setAddFormData({...addFormData, hsCode: e.target.value})} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button type="submit" style={styles.primaryBtn} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Record'}</button>
            <button 
              type="button" 
              style={styles.secondaryBtn} 
              onClick={() => setAddFormData({ sale: '', customer: '', commodity: '', hsCode: '' })}
            >
              Clear Form
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading Database...</div>
      ) : errorMsg ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{errorMsg}</div>
      ) : (
        <>
          {operationError && <div role="alert" style={{ marginBottom: '16px', padding: '12px', color: '#b91c1c', backgroundColor: '#fee2e2', borderRadius: '6px' }}>{operationError}</div>}
          {/* --- Search Section --- */}
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search Sale, Customer Name, Commodity, or HS Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={styles.clearSearchBtn}
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>

          {/* --- Table Section --- */}
          <div style={{ overflowX: 'auto', borderRadius: '8px', paddingBottom: '20px' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{...styles.th, width: '10%'}}>Sale</th>
                  <th style={{...styles.th, width: '30%'}}>Customer Name</th>
                  <th style={{...styles.th, width: '35%'}}>Commodity</th>
                  <th style={{...styles.th, width: '15%'}}>HS Code</th>
                  <th style={{...styles.th, width: '10%', textAlign: 'center'}}>Actions</th>
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
                        <div style={styles.actionStack}>
                          {isEditing ? (
                            <>
                            <button style={styles.saveBtn} onClick={handleEditSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
                            <button style={styles.actionBtn} onClick={handleEditCancel} disabled={isSaving}>Cancel</button>
                            </>
                          ) : (
                            <>
                            <button style={styles.actionBtn} onClick={() => handleEditClick(row)} disabled={isSaving}>Edit</button>
                            <button style={styles.deleteBtn} onClick={() => handleDelete(row.id)} disabled={isSaving}>Del</button>
                            </>
                          )}
                        </div>
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

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const Freetime = () => {
  const [activeTab, setActiveTab] = useState('ORIGIN'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [freetimeData, setFreetimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    Carrier: '', LAT_KRABANG: '', LAEM_CHABANG: '', PAT_BANGKOK: '', 
    SONGKLA: '', REEFER: '', REMARK: '', 
    DEM_20_40: '', DT_20_40: '', DEM_REEFER: '', DET_REEFER: ''
  });

  // States for Inline Editing
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    const fetchExcelData = async () => {
      try {
        const response = await fetch('/freetime_data.xlsx'); 
        if (!response.ok) throw new Error("Excel file not found");
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        let lastCarrier = "";
        const formattedData = jsonData.map((row, index) => {
          if (row.Carrier) lastCarrier = row.Carrier;
          else row.Carrier = lastCarrier; 
          
          return {
            id: index, 
            Carrier: row.Carrier,
            LAT_KRABANG: row["LAT KRABANG"] || row["LAT KRABANG "] || '',
            LAEM_CHABANG: row["LAEM CHABANG"] || row["LAEM CHABANG "] || '',
            PAT_BANGKOK: row["PAT (BANGKOK)"] || row["PAT (BANGKOK) "] || '',
            SONGKLA: row["SONGKLA"] || '',
            REEFER: row["REEFER"] || '',
            REMARK: row["REMARK"] || '',
            DEM_20_40: row["DEM  20'GP & 40'HC"] || '',
            DT_20_40: row["DT  20'GP & 40'HC"] || '',
            DEM_REEFER: row["DEM/REFFER"] || row["DEM/REFFER "] || '',
            DET_REEFER: row["DET/REFFEER"] || row["DET/REFFEER "] || ''
          };
        });

        setFreetimeData(formattedData);
      } catch (error) {
        console.error("Error loading Excel file:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExcelData();
  }, []);

  const saveDataToBackend = async (updatedData) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/v1/save-freetime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP Error ${response.status}`);
      }
      
      const result = await response.json();
      if (result.status === 'success') {
        alert("✅ Data successfully updated and saved to Excel!");
      } else {
        alert("❌ Error saving file.");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert(`❌ Cannot connect to the backend server.\nDetails: ${error.message}`);server.");
    }
  };

  const filteredData = freetimeData.filter(item => {
    const search = searchTerm.toLowerCase();
    return (
      (item.Carrier || '').toLowerCase().includes(search) ||
      (item.REMARK || '').toLowerCase().includes(search)
    );
  });

  const handleAddNewClick = () => {
    setNewRecord({ 
      Carrier: '', LAT_KRABANG: '', LAEM_CHABANG: '', PAT_BANGKOK: '', 
      SONGKLA: '', REEFER: '', REMARK: '', DEM_20_40: '', DT_20_40: '', DEM_REEFER: '', DET_REEFER: '' 
    });
    setShowAddModal(true);
  };

  const handleSaveNewRecord = (e) => {
    e.preventDefault();
    const newData = { ...newRecord, id: Date.now() };
    const updatedData = [newData, ...freetimeData];
    setFreetimeData(updatedData); 
    setShowAddModal(false);
    saveDataToBackend(updatedData);
  };

  const handleDelete = (idToDelete) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const updatedData = freetimeData.filter(item => item.id !== idToDelete);
      setFreetimeData(updatedData);
      saveDataToBackend(updatedData);
    }
  };

  // Inline Editing Handlers
  const handleEditClick = (record) => {
    setEditingId(record.id);
    setEditFormData({ ...record });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleEditChange = (e, field) => {
    setEditFormData({ ...editFormData, [field]: e.target.value });
  };

  const handleSaveInline = () => {
    const updatedData = freetimeData.map(item => 
      item.id === editingId ? { ...editFormData } : item
    );
    setFreetimeData(updatedData);
    setEditingId(null);
    saveDataToBackend(updatedData);
  };

  const inputStyle = {
    width: '100%', padding: '8px', border: '1px solid #cbd5e1', 
    borderRadius: '4px', boxSizing: 'border-box', fontSize: '0.9em',
    fontFamily: 'inherit'
  };

  return (
    <div style={{ padding: '32px', fontFamily: "'Sarabun', sans-serif", backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#1e293b', margin: 0, fontSize: '1.6em', fontWeight: 'bold' }}>
            Port Freetime Directory
          </h2>
          <button 
            onClick={handleAddNewClick}
            style={{
              padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', 
              border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
              fontSize: '0.95em', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            + Add New Record
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button 
            onClick={() => setActiveTab('ORIGIN')}
            style={{
              padding: '10px 24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1em',
              borderRadius: '8px 8px 0 0', border: 'none',
              backgroundColor: activeTab === 'ORIGIN' ? '#374151' : '#cbd5e1',
              color: activeTab === 'ORIGIN' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            FREE TIME AT ORIGIN
          </button>
          <button 
            onClick={() => setActiveTab('DEM')}
            style={{
              padding: '10px 24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1em',
              borderRadius: '8px 8px 0 0', border: 'none',
              backgroundColor: activeTab === 'DEM' ? '#374151' : '#cbd5e1',
              color: activeTab === 'DEM' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            DEM / DET
          </button>
        </div>

        <div style={{ 
          marginBottom: '20px', backgroundColor: '#374151', padding: '16px', 
          borderRadius: '0 8px 8px 8px', display: 'flex', gap: '12px' 
        }}>
          <input 
            type="text" 
            placeholder="Search Carrier Name or Remark..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: '6px', border: 'none',
              backgroundColor: '#4b5563', color: '#ffffff', fontSize: '1em', outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                padding: '0 20px', backgroundColor: '#64748b', color: '#ffffff',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                fontSize: '0.9em', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#94a3b8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#64748b'}
            >
              Clear
            </button>
          )}
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold' }}>Carrier</th>
                  {activeTab === 'ORIGIN' ? (
                    <>
                      <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold' }}>Lat Krabang</th>
                      <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold' }}>Laem Chabang</th>
                      <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold' }}>PAT (BKK)</th>
                      <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold' }}>Songkla</th>
                      <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold' }}>Reefer</th>
                      <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold' }}>Remark</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold' }}>DEM 20'GP & 40'HC</th>
                      <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold' }}>DT 20'GP & 40'HC</th>
                      <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold' }}>DEM/REEFER</th>
                      <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold' }}>DET/REEFER</th>
                    </>
                  )}
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold', textAlign: 'center', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={activeTab === 'ORIGIN' ? 8 : 6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      
                      {/* Carrier Column */}
                      <td style={{ padding: '12px 16px' }}>
                        {editingId === row.id ? (
                          <input style={inputStyle} value={editFormData.Carrier} onChange={(e) => handleEditChange(e, 'Carrier')} />
                        ) : (
                          <span style={{ color: '#334155', fontWeight: 'bold', fontSize: '0.85em' }}>{row.Carrier}</span>
                        )}
                      </td>

                      {/* Dynamic Columns based on Tab */}
                      {activeTab === 'ORIGIN' ? (
                        <>
                          <td style={{ padding: '12px 16px' }}>
                            {editingId === row.id ? <input style={inputStyle} value={editFormData.LAT_KRABANG} onChange={(e) => handleEditChange(e, 'LAT_KRABANG')} /> : <span style={{ color: '#334155', fontSize: '0.85em' }}>{row.LAT_KRABANG || '-'}</span>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {editingId === row.id ? <input style={inputStyle} value={editFormData.LAEM_CHABANG} onChange={(e) => handleEditChange(e, 'LAEM_CHABANG')} /> : <span style={{ color: '#334155', fontSize: '0.85em' }}>{row.LAEM_CHABANG || '-'}</span>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {editingId === row.id ? <input style={inputStyle} value={editFormData.PAT_BANGKOK} onChange={(e) => handleEditChange(e, 'PAT_BANGKOK')} /> : <span style={{ color: '#334155', fontSize: '0.85em' }}>{row.PAT_BANGKOK || '-'}</span>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {editingId === row.id ? <input style={inputStyle} value={editFormData.SONGKLA} onChange={(e) => handleEditChange(e, 'SONGKLA')} /> : <span style={{ color: '#334155', fontSize: '0.85em' }}>{row.SONGKLA || '-'}</span>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {editingId === row.id ? <input style={inputStyle} value={editFormData.REEFER} onChange={(e) => handleEditChange(e, 'REEFER')} /> : <span style={{ color: '#334155', fontSize: '0.85em' }}>{row.REEFER || '-'}</span>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {editingId === row.id ? <input style={inputStyle} value={editFormData.REMARK} onChange={(e) => handleEditChange(e, 'REMARK')} /> : <span style={{ color: '#334155', fontSize: '0.85em' }}>{row.REMARK || '-'}</span>}
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '12px 16px' }}>
                            {editingId === row.id ? <input style={inputStyle} value={editFormData.DEM_20_40} onChange={(e) => handleEditChange(e, 'DEM_20_40')} /> : <span style={{ color: '#334155', fontSize: '0.85em' }}>{row.DEM_20_40 || '-'}</span>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {editingId === row.id ? <input style={inputStyle} value={editFormData.DT_20_40} onChange={(e) => handleEditChange(e, 'DT_20_40')} /> : <span style={{ color: '#334155', fontSize: '0.85em' }}>{row.DT_20_40 || '-'}</span>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {editingId === row.id ? <input style={inputStyle} value={editFormData.DEM_REEFER} onChange={(e) => handleEditChange(e, 'DEM_REEFER')} /> : <span style={{ color: '#334155', fontSize: '0.85em' }}>{row.DEM_REEFER || '-'}</span>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {editingId === row.id ? <input style={inputStyle} value={editFormData.DET_REEFER} onChange={(e) => handleEditChange(e, 'DET_REEFER')} /> : <span style={{ color: '#334155', fontSize: '0.85em' }}>{row.DET_REEFER || '-'}</span>}
                          </td>
                        </>
                      )}

                      {/* Actions Column */}
                      <td style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        {editingId === row.id ? (
                          <>
                            <button 
                              onClick={handleSaveInline}
                              style={{ width: '100%', padding: '4px 8px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold' }}
                            >
                              Save
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              style={{ width: '100%', padding: '4px 8px', backgroundColor: '#94a3b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold' }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleEditClick(row)}
                              style={{ width: '100%', padding: '4px 8px', backgroundColor: '#eab308', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold' }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(row.id)}
                              style={{ width: '100%', padding: '4px 8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold' }}
                            >
                              Del
                            </button>
                          </>
                        )}
                      </td>
                      
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={activeTab === 'ORIGIN' ? 8 : 6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add New Record Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '1.25em' }}>Add New Record</h3>
            <form onSubmit={handleSaveNewRecord} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input required placeholder="Carrier Name" value={newRecord.Carrier} onChange={e => setNewRecord({...newRecord, Carrier: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              
              {activeTab === 'ORIGIN' ? (
                <>
                  <input placeholder="Lat Krabang" value={newRecord.LAT_KRABANG} onChange={e => setNewRecord({...newRecord, LAT_KRABANG: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input placeholder="Laem Chabang" value={newRecord.LAEM_CHABANG} onChange={e => setNewRecord({...newRecord, LAEM_CHABANG: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input placeholder="PAT (Bangkok)" value={newRecord.PAT_BANGKOK} onChange={e => setNewRecord({...newRecord, PAT_BANGKOK: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input placeholder="Songkla" value={newRecord.SONGKLA} onChange={e => setNewRecord({...newRecord, SONGKLA: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input placeholder="Reefer" value={newRecord.REEFER} onChange={e => setNewRecord({...newRecord, REEFER: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input placeholder="Remark" value={newRecord.REMARK} onChange={e => setNewRecord({...newRecord, REMARK: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </>
              ) : (
                <>
                  <input placeholder="DEM 20'GP & 40'HC" value={newRecord.DEM_20_40} onChange={e => setNewRecord({...newRecord, DEM_20_40: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input placeholder="DT 20'GP & 40'HC" value={newRecord.DT_20_40} onChange={e => setNewRecord({...newRecord, DT_20_40: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input placeholder="DEM/REEFER" value={newRecord.DEM_REEFER} onChange={e => setNewRecord({...newRecord, DEM_REEFER: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input placeholder="DET/REEFER" value={newRecord.DET_REEFER} onChange={e => setNewRecord({...newRecord, DET_REEFER: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Freetime;
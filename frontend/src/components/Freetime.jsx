// src/components/Freetime.jsx
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const Freetime = () => {
  const [activeTab, setActiveTab] = useState('ORIGIN'); // 'ORIGIN' หรือ 'DEM'
  const [searchTerm, setSearchTerm] = useState('');
  const [freetimeData, setFreetimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State สำหรับ Modal เพิ่ม/แก้ไขข้อมูล
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // เช็กว่าอยู่ในโหมดแก้ไขหรือไม่
  const [editId, setEditId] = useState(null); // เก็บ ID ของรายการที่กำลังแก้ไข
  
  const [newRecord, setNewRecord] = useState({
    Carrier: '', LAT_KRABANG: '', LAEM_CHABANG: '', PAT_BANGKOK: '', 
    SONGKLA: '', REEFER: '', REMARK: '', 
    DEM_20_40: '', DT_20_40: '', DEM_REEFER: '', DET_REEFER: ''
  });

  // 1. ดึงข้อมูลจากไฟล์ Excel
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
            id: index, // สร้าง ID จำลอง
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

  // 2. ค้นหาข้อมูล
  const filteredData = freetimeData.filter(item => {
    const search = searchTerm.toLowerCase();
    return (
      (item.Carrier || '').toLowerCase().includes(search) ||
      (item.REMARK || '').toLowerCase().includes(search)
    );
  });

  // 3. เปิด Modal สำหรับเพิ่มข้อมูลใหม่
  const handleAddNewClick = () => {
    setIsEditing(false);
    setEditId(null);
    setNewRecord({ 
      Carrier: '', LAT_KRABANG: '', LAEM_CHABANG: '', PAT_BANGKOK: '', 
      SONGKLA: '', REEFER: '', REMARK: '', DEM_20_40: '', DT_20_40: '', DEM_REEFER: '', DET_REEFER: '' 
    });
    setShowAddModal(true);
  };

  // 4. เปิด Modal สำหรับแก้ไขข้อมูล
  const handleEditClick = (record) => {
    setIsEditing(true);
    setEditId(record.id);
    setNewRecord({ ...record }); // นำข้อมูลเดิมไปใส่ในฟอร์ม
    setShowAddModal(true);
  };

  // 5. บันทึกข้อมูล (รองรับทั้ง Add และ Edit)
  const handleSaveRecord = (e) => {
    e.preventDefault();
    if (isEditing) {
      // โหมดแก้ไข: หา ID เดิมแล้วอัปเดตข้อมูล
      setFreetimeData(prev => prev.map(item => item.id === editId ? { ...newRecord, id: editId } : item));
    } else {
      // โหมดเพิ่ม: สร้าง ID ใหม่แล้วดันไปไว้บนสุด
      const newData = { ...newRecord, id: Date.now() };
      setFreetimeData([newData, ...freetimeData]); 
    }
    setShowAddModal(false);
  };

  // 6. ลบข้อมูล
  const handleDelete = (idToDelete) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      setFreetimeData(prev => prev.filter(item => item.id !== idToDelete));
    }
  };

  return (
    <div style={{ padding: '32px', fontFamily: "'Sarabun', sans-serif", backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* ======== HEADER & ADD BUTTON ======== */}
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

        {/* ======== TABS ======== */}
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

        {/* ======== SEARCH BAR ======== */}
        <div style={{ marginBottom: '20px', backgroundColor: '#374151', padding: '16px', borderRadius: '0 8px 8px 8px' }}>
          <input 
            type="text" 
            placeholder="Search Carrier Name or Remark..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '6px', border: 'none',
              backgroundColor: '#4b5563', color: '#ffffff', fontSize: '1em', outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* ======== DATA TABLE ======== */}
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
                  
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={activeTab === 'ORIGIN' ? 8 : 6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 24px', color: '#334155', fontWeight: 'bold' }}>{row.Carrier}</td>
                      
                      {activeTab === 'ORIGIN' ? (
                        <>
                          <td style={{ padding: '16px 24px', color: '#475569' }}>{row.LAT_KRABANG || '-'}</td>
                          <td style={{ padding: '16px 24px', color: '#475569' }}>{row.LAEM_CHABANG || '-'}</td>
                          <td style={{ padding: '16px 24px', color: '#475569' }}>{row.PAT_BANGKOK || '-'}</td>
                          <td style={{ padding: '16px 24px', color: '#475569' }}>{row.SONGKLA || '-'}</td>
                          <td style={{ padding: '16px 24px', color: '#0369a1', fontWeight: 'bold' }}>{row.REEFER || '-'}</td>
                          <td style={{ padding: '16px 24px', color: '#b91c1c' }}>{row.REMARK || '-'}</td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '16px 24px', color: '#475569' }}>{row.DEM_20_40 || '-'}</td>
                          <td style={{ padding: '16px 24px', color: '#475569' }}>{row.DT_20_40 || '-'}</td>
                          <td style={{ padding: '16px 24px', color: '#475569' }}>{row.DEM_REEFER || '-'}</td>
                          <td style={{ padding: '16px 24px', color: '#475569' }}>{row.DET_REEFER || '-'}</td>
                        </>
                      )}

                      <td style={{ padding: '16px 24px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleEditClick(row)}
                          style={{
                            padding: '6px 12px', backgroundColor: '#eab308', color: '#fff',
                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em', fontWeight: 'bold'
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(row.id)}
                          style={{
                            padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff',
                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em', fontWeight: 'bold'
                          }}
                        >
                          Del
                        </button>
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

      {/* ======== ADD / EDIT RECORD MODAL ======== */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '1.25em' }}>
              {isEditing ? 'Edit Record' : 'Add New Record'}
            </h3>
            <form onSubmit={handleSaveRecord} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {isEditing ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Freetime;
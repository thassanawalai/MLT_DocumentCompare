import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const Freetime = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [freetimeData, setFreetimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State สำหรับ Modal เพิ่มข้อมูล
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    Carrier: '',
    LAT_KRABANG: '',
    LAEM_CHABANG: '',
    PAT_BANGKOK: '',
    REEFER: '',
    REMARK: ''
  });

  // 1. ดึงข้อมูลจากไฟล์ Excel ตอนเปิดหน้า
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
          if (row.Carrier) {
            lastCarrier = row.Carrier;
          } else {
            row.Carrier = lastCarrier; 
          }
          return {
            id: index, // สร้าง ID จำลองสำหรับใช้อ้างอิงตอนลบ
            Carrier: row.Carrier,
            LAT_KRABANG: row["LAT KRABANG"] || row["LAT KRABANG "] || '',
            LAEM_CHABANG: row["LAEM CHABANG"] || row["LAEM CHABANG "] || '',
            PAT_BANGKOK: row["PAT (BANGKOK)"] || row["PAT (BANGKOK) "] || '',
            REEFER: row["REEFER"] || '',
            REMARK: row["REMARK"] || ''
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

  // 2. ฟังก์ชันค้นหาข้อมูล
  const filteredData = freetimeData.filter(item => {
    const search = searchTerm.toLowerCase();
    return (
      (item.Carrier || '').toLowerCase().includes(search) ||
      (item.REMARK || '').toLowerCase().includes(search)
    );
  });

  // 3. ฟังก์ชันลบข้อมูล
  const handleDelete = (idToDelete) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      setFreetimeData(prev => prev.filter(item => item.id !== idToDelete));
    }
  };

  // 4. ฟังก์ชันเพิ่มข้อมูลใหม่
  const handleAddRecord = (e) => {
    e.preventDefault();
    const newData = {
      ...newRecord,
      id: Date.now() // สร้าง ID ใหม่
    };
    setFreetimeData([newData, ...freetimeData]); // เพิ่มไว้บนสุด
    setShowAddModal(false);
    setNewRecord({ Carrier: '', LAT_KRABANG: '', LAEM_CHABANG: '', PAT_BANGKOK: '', REEFER: '', REMARK: '' }); // เคลียร์ฟอร์ม
  };

  return (
    <div style={{ padding: '32px', fontFamily: "'Sarabun', sans-serif", backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* ======== HEADER ======== */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#1e293b', margin: 0, fontSize: '1.6em', fontWeight: 'bold' }}>
            Port Freetime Directory
          </h2>
          <button 
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', 
              border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
              fontSize: '0.95em', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            + Add New Record
          </button>
        </div>

        {/* ======== SEARCH BAR ======== */}
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Search Carrier Name or Remark..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '16px 20px', borderRadius: '8px', border: 'none',
              backgroundColor: '#374151', color: '#ffffff', fontSize: '1em', outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* ======== DATA TABLE ======== */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold', fontSize: '1em' }}>Carrier</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold', fontSize: '1em' }}>Lat Krabang</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold', fontSize: '1em' }}>Laem Chabang</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold', fontSize: '1em' }}>PAT (BKK)</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold', fontSize: '1em' }}>Reefer</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold', fontSize: '1em' }}>Remark</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 'bold', fontSize: '1em', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 24px', color: '#334155' }}>{row.Carrier}</td>
                      <td style={{ padding: '16px 24px', color: '#475569' }}>{row.LAT_KRABANG}</td>
                      <td style={{ padding: '16px 24px', color: '#475569' }}>{row.LAEM_CHABANG}</td>
                      <td style={{ padding: '16px 24px', color: '#475569' }}>{row.PAT_BANGKOK}</td>
                      <td style={{ padding: '16px 24px', color: '#475569' }}>{row.REEFER}</td>
                      <td style={{ padding: '16px 24px', color: '#475569' }}>{row.REMARK}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDelete(row.id)}
                          style={{
                            padding: '6px 16px', backgroundColor: '#ef4444', color: '#fff',
                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em'
                          }}
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ======== ADD RECORD MODAL ======== */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '1.25em' }}>Add New Freetime Record</h3>
            <form onSubmit={handleAddRecord} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input required placeholder="Carrier Name" value={newRecord.Carrier} onChange={e => setNewRecord({...newRecord, Carrier: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
              <input placeholder="Lat Krabang Freetime" value={newRecord.LAT_KRABANG} onChange={e => setNewRecord({...newRecord, LAT_KRABANG: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
              <input placeholder="Laem Chabang Freetime" value={newRecord.LAEM_CHABANG} onChange={e => setNewRecord({...newRecord, LAEM_CHABANG: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
              <input placeholder="PAT (Bangkok) Freetime" value={newRecord.PAT_BANGKOK} onChange={e => setNewRecord({...newRecord, PAT_BANGKOK: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
              <input placeholder="Reefer Freetime" value={newRecord.REEFER} onChange={e => setNewRecord({...newRecord, REEFER: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
              <input placeholder="Remark" value={newRecord.REMARK} onChange={e => setNewRecord({...newRecord, REMARK: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
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
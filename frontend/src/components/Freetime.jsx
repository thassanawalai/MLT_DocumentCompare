// src/components/Freetime.jsx
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const Freetime = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [freetimeData, setFreetimeData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงไฟล์ Excel จากโฟลเดอร์ public มาอ่านตอนโหลดหน้าเว็บ
  useEffect(() => {
    const fetchExcelData = async () => {
      try {
        // อ้างอิงชื่อไฟล์ที่อยู่ในโฟลเดอร์ public
        const response = await fetch('/freetime_data.xlsx'); 
        const arrayBuffer = await response.arrayBuffer();
        
        // ใช้ไลบรารี xlsx อ่านข้อมูล
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // แปลงเป็น JSON Object
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // defval: "" ทำให้ช่องว่างไม่เป็น undefined
        
        // เติมค่า Carrier ที่โดน Merge เซลล์ (Forward fill)
        let lastCarrier = "";
        const formattedData = jsonData.map(row => {
          if (row.Carrier) {
            lastCarrier = row.Carrier;
          } else {
            row.Carrier = lastCarrier; // ถ้า Carrier ว่าง ให้ใช้ชื่อของบรรทัดก่อนหน้า
          }
          return row;
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

  // ฟิลเตอร์ข้อมูลตามที่ผู้ใช้พิมพ์ค้นหา (เทียบชื่อ Carrier หรือ Remark)
  const filteredData = freetimeData.filter(item => {
    const carrier = String(item.Carrier || '').toLowerCase();
    const remark = String(item.REMARK || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return carrier.includes(search) || remark.includes(search);
  });

  return (
    <div style={{ padding: '32px', fontFamily: "'Sarabun', sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: '#0f172a', margin: '0 0 8px 0', fontSize: '1.5em' }}>Port Freetime Directory</h2>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.95em' }}>Search Origin Freetime conditions by Shipping Line</p>
          </div>
          
          <div>
            <input 
              type="text" 
              placeholder="Search by Carrier name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '12px 20px', width: '300px', borderRadius: '8px', border: '1px solid #cbd5e1',
                outline: 'none', fontSize: '0.95em', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            />
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', color: '#475569', fontWeight: 600, fontSize: '0.85em', textTransform: 'uppercase' }}>Carrier</th>
                  <th style={{ padding: '16px', color: '#475569', fontWeight: 600, fontSize: '0.85em', textTransform: 'uppercase' }}>Lat Krabang</th>
                  <th style={{ padding: '16px', color: '#475569', fontWeight: 600, fontSize: '0.85em', textTransform: 'uppercase' }}>Laem Chabang</th>
                  <th style={{ padding: '16px', color: '#475569', fontWeight: 600, fontSize: '0.85em', textTransform: 'uppercase' }}>PAT (Bangkok)</th>
                  <th style={{ padding: '16px', color: '#475569', fontWeight: 600, fontSize: '0.85em', textTransform: 'uppercase' }}>Reefer</th>
                  <th style={{ padding: '16px', color: '#475569', fontWeight: 600, fontSize: '0.85em', textTransform: 'uppercase' }}>Remark</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>⏳ Loading data from Excel...</td></tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px', fontWeight: 700, color: '#1e293b' }}>{row.Carrier}</td>
                      <td style={{ padding: '16px', color: '#334155', fontSize: '0.9em' }}>{row["LAT KRABANG"] || row["LAT KRABANG "] || '-'}</td>
                      <td style={{ padding: '16px', color: '#334155', fontSize: '0.9em' }}>{row["LAEM CHABANG"] || row["LAEM CHABANG "] || '-'}</td>
                      <td style={{ padding: '16px', color: '#334155', fontSize: '0.9em' }}>{row["PAT (BANGKOK)"] || row["PAT (BANGKOK) "] || '-'}</td>
                      <td style={{ padding: '16px', color: '#0369a1', fontWeight: 600, fontSize: '0.9em' }}>{row["REEFER"] || '-'}</td>
                      <td style={{ padding: '16px', color: '#b91c1c', fontSize: '0.85em' }}>{row["REMARK"] || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No matching carriers found for "{searchTerm}"</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Freetime;
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

// ลิสต์ Template ของ SI (เอามาจากหน้า App เดิม)
const templateOptions = [
  { value: 'MCKEY', label: 'MCKEY' },
  { value: 'SUPER_SIERRA', label: 'B.FOODS/NO LOGO' },
  { value: 'BFOODS_1', label: 'B.FOODS/LOGO BETAGRO UPSTAIRS' },
  { value: 'BFOODS_3', label: 'B.FOODS/LOGO BETAGRO RIGHT SIDE' },
  { value: 'PPI', label: 'B.FOOD/ONE/PPI' },
  { value: 'AJIMOMOTO', label: 'AJINOMOTO' },
  { value: 'SIAMCHAI', label: 'SIAMCHAI' },
  { value: 'SURAPON', label: 'SURAPON' },
  { value: 'POLYPLEX', label: 'POLYPLEX' },
  { value: 'BETAGRO', label: 'BETAGRO' },
  { value: 'FORTUNE', label: 'FORTUNE'},
  { value: 'GC-M', label: 'GC-M' },
  { value: 'MITSUI', label: 'MITSUI'}
];

const SIDataEntry = () => {
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(templateOptions[0].value);
  
  // State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    shipper: "",
    booking_no: "",
    consignee: "",
    notify_party: "",
    feeder: "",
    place_of_receipt: "",
    vessel: "",
    port_of_loading: "",
    port_of_discharge: "",
    place_of_delivery: "",
    mark: "",
    quantity: "",
    description: "",
    gross_weight: "",
    measurement: ""
  });

  // ฟังก์ชันอัปโหลด PDF และเรียก API หลังบ้าน
  const handleUploadPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const apiData = new FormData();
    apiData.append('file_program', file);
    // 🟢 ส่งชื่อ Template ที่ User เลือกจาก Dropdown ไปให้หลังบ้าน 🟢
    apiData.append('company_program', selectedTemplate); 

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/v1/process-pdf`, { 
        method: 'POST', 
        body: apiData 
      });
      
      const result = await response.json();
      
      if (result.status === 'success' && result.program?.data) {
        const extracted = result.program.data;
        
        // เอาข้อมูลที่ API สกัดได้ มายัดลงฟอร์ม
        setFormData({
          shipper: extracted.shipper?.value || "",
          booking_no: extracted.booking_no?.value || "",
          consignee: extracted.consignee?.value || "",
          notify_party: extracted.notify_party?.value || "",
          feeder: extracted.feeder?.value || "",
          place_of_receipt: extracted.place_of_receipt?.value || "",
          vessel: extracted.vessel?.value || "",
          port_of_loading: extracted.port_of_loading?.value || "",
          port_of_discharge: extracted.port_of_discharge?.value || "",
          place_of_delivery: extracted.place_of_delivery?.value || "",
          mark: extracted.mark?.value || "",
          quantity: extracted.quantity?.value || "",
          description: extracted.description_of_good?.value || "",
          gross_weight: extracted.gross_weight?.value || "",
          measurement: extracted.measurement?.value || ""
        });
        alert("✅ ดึงข้อมูลจาก PDF สำเร็จ! ตรวจสอบความถูกต้องได้เลย");
      } else {
        alert("❌ อ่านข้อมูลไม่ได้ หรือไฟล์มีปัญหา");
      }
    } catch (error) {
      console.error("Error fetching API:", error);
      alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อหลังบ้าน");
    } finally {
      setLoading(false);
      // เคลียร์ค่า input file เผื่อกดอัปโหลดไฟล์เดิมซ้ำ
      e.target.value = null; 
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ฟังก์ชัน Export Excel
  const handleExportExcel = () => {
    const exportData = [{
      "เวลาบันทึก (Timestamp)": new Date().toLocaleString('th-TH'),
      "Template": selectedTemplate,
      "Booking No": formData.booking_no,
      "Shipper": formData.shipper,
      "Consignee": formData.consignee,
      "Notify Party": formData.notify_party,
      "Feeder": formData.feeder,
      "Vessel": formData.vessel,
      "Port of Loading": formData.port_of_loading,
      "Port of Discharge": formData.port_of_discharge,
      "Place of Receipt": formData.place_of_receipt,
      "Place of Delivery": formData.place_of_delivery,
      "Marks & Numbers": formData.mark,
      "Quantity": formData.quantity,
      "Description": formData.description,
      "Gross Weight": formData.gross_weight,
      "Measurement": formData.measurement
    }];

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SIData");
    XLSX.writeFile(workbook, formData.booking_no ? `SI_Data_${formData.booking_no}.xlsx` : `SI_Data_Export.xlsx`);
  };

  const styles = {
    paper: { maxWidth: '900px', margin: '20px auto', backgroundColor: '#fff', border: '2px solid #000', fontFamily: 'Arial, sans-serif', color: '#000' },
    row: { display: 'flex', borderBottom: '1px solid #000' },
    colLeft: { flex: 1, borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' },
    colRight: { flex: 1, display: 'flex', flexDirection: 'column' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr' },
    cell: { borderRight: '1px solid #000', borderBottom: '1px solid #000', display: 'flex', flexDirection: 'column' },
    label: { fontSize: '11px', fontWeight: 'bold', padding: '4px 6px', borderBottom: '1px solid #eee', backgroundColor: '#f9fafb' },
    input: { border: 'none', padding: '8px', fontSize: '13px', width: '100%', boxSizing: 'border-box', outline: 'none' },
    textarea: { border: 'none', padding: '8px', fontSize: '13px', width: '100%', boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: '80px' },
    tableHeader: { fontSize: '10px', fontWeight: 'bold', textAlign: 'center', padding: '6px', borderBottom: '1px solid #000', borderRight: '1px solid #000' }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <h2 style={{ textAlign: 'center', color: '#1e293b' }}>ฟอร์มตรวจสอบและสกัดข้อมูลเอกสาร SI</h2>
      
      {/* 🟢 ส่วนเลือก Template และอัปโหลดไฟล์ 🟢 */}
      <div style={{ maxWidth: '600px', margin: '0 auto 20px', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Step 1: Dropdown */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>
              1. เลือกรูปแบบเอกสาร (Template):
            </label>
            <select 
              value={selectedTemplate} 
              onChange={(e) => setSelectedTemplate(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            >
              {templateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Upload File */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>
              2. อัปโหลดไฟล์ SI (PDF):
            </label>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handleUploadPDF} 
              disabled={loading}
              style={{ width: '100%', padding: '10px', border: '2px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', cursor: loading ? 'not-allowed' : 'pointer' }}
            />
          </div>

          {loading && <div style={{ color: '#2563eb', fontWeight: 'bold', textAlign: 'center' }}>⏳ ระบบกำลังอ่านข้อมูลด้วย EasyOCR กรุณารอสักครู่...</div>}
        </div>
      </div>
      
      {/* โครงสร้างกระดาษ SI (ยังคงเหมือนเดิมเป๊ะ) */}
      <div style={styles.paper}>
        
        {/* แถวที่ 1 */}
        <div style={styles.row}>
          <div style={styles.colLeft}>
            <div style={styles.label}>1. Shipper/Exporter (complete name and address)</div>
            <textarea name="shipper" value={formData.shipper} onChange={handleChange} style={styles.textarea} />
          </div>
          <div style={styles.colRight}>
            <div style={styles.label}>2. BOOKING NUMBER</div>
            <input name="booking_no" value={formData.booking_no} onChange={handleChange} style={{...styles.input, fontSize: '16px', fontWeight: 'bold', textAlign: 'center', marginTop: '20px'}} />
          </div>
        </div>

        {/* แถวที่ 2 */}
        <div style={styles.row}>
          <div style={styles.colLeft}>
            <div style={styles.label}>3. Consignee (complete name and address)</div>
            <textarea name="consignee" value={formData.consignee} onChange={handleChange} style={styles.textarea} />
          </div>
          <div style={{...styles.colRight, justifyContent: 'center', alignItems: 'center'}}>
             <span style={{color: 'red', fontWeight: 'bold', fontSize: '24px'}}>SURRENDER B/L</span>
          </div>
        </div>

        {/* แถวที่ 3 */}
        <div style={styles.row}>
          <div style={styles.colLeft}>
            <div style={styles.label}>4. Notify Party (complete name and address)</div>
            <textarea name="notify_party" value={formData.notify_party} onChange={handleChange} style={styles.textarea} />
          </div>
          <div style={styles.colRight}></div>
        </div>

        {/* แถวที่ 4 */}
        <div style={styles.grid2}>
          <div style={styles.cell}>
            <div style={styles.label}>5. Feeder Voy No.</div>
            <input name="feeder" value={formData.feeder} onChange={handleChange} style={styles.input} />
          </div>
          <div style={{...styles.cell, borderRight: 'none'}}>
            <div style={styles.label}>6. Place of Receipt</div>
            <input name="place_of_receipt" value={formData.place_of_receipt} onChange={handleChange} style={styles.input} />
          </div>
          <div style={styles.cell}>
            <div style={styles.label}>7. Vessel Voy No.</div>
            <input name="vessel" value={formData.vessel} onChange={handleChange} style={styles.input} />
          </div>
          <div style={{...styles.cell, borderRight: 'none'}}>
            <div style={styles.label}>8. Port of Loading</div>
            <input name="port_of_loading" value={formData.port_of_loading} onChange={handleChange} style={styles.input} />
          </div>
          <div style={{...styles.cell, borderBottom: 'none'}}>
            <div style={styles.label}>9. Port of Discharge</div>
            <input name="port_of_discharge" value={formData.port_of_discharge} onChange={handleChange} style={styles.input} />
          </div>
          <div style={{...styles.cell, borderRight: 'none', borderBottom: 'none'}}>
            <div style={styles.label}>10. Place of Delivery</div>
            <input name="place_of_delivery" value={formData.place_of_delivery} onChange={handleChange} style={styles.input} />
          </div>
        </div>

        {/* แถวที่ 5: ตารางสินค้าด้านล่าง */}
        <div style={{ borderTop: '2px solid #000', display: 'grid', gridTemplateColumns: '1.5fr 1fr 3fr 1fr 1fr' }}>
          <div style={styles.tableHeader}>11. Marks and Numbers</div>
          <div style={styles.tableHeader}>12. No. of Containers</div>
          <div style={styles.tableHeader}>13. Kind of packages; description of goods</div>
          <div style={styles.tableHeader}>14. G WT. (KGS)</div>
          <div style={{...styles.tableHeader, borderRight: 'none'}}>15. M3</div>

          <textarea name="mark" value={formData.mark} onChange={handleChange} style={{...styles.textarea, minHeight: '300px', borderRight: '1px solid #000'}} />
          <textarea name="quantity" value={formData.quantity} onChange={handleChange} style={{...styles.textarea, minHeight: '300px', borderRight: '1px solid #000', textAlign: 'center'}} />
          <textarea name="description" value={formData.description} onChange={handleChange} style={{...styles.textarea, minHeight: '300px', borderRight: '1px solid #000'}} />
          <textarea name="gross_weight" value={formData.gross_weight} onChange={handleChange} style={{...styles.textarea, minHeight: '300px', borderRight: '1px solid #000', textAlign: 'center'}} />
          <textarea name="measurement" value={formData.measurement} onChange={handleChange} style={{...styles.textarea, minHeight: '300px', textAlign: 'center'}} />
        </div>

      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button onClick={handleExportExcel} style={{ padding: '12px 30px', backgroundColor: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(29, 78, 216, 0.3)' }}>
          💾 บันทึกข้อมูล & ส่งออก Excel
        </button>
      </div>

    </div>
  );
};

export default SIDataEntry;
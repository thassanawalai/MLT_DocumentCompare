import React, { useState } from 'react';
import * as XLSX from 'xlsx';

// ลิสต์ Template ของ SI
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

// 🟢 รับ prop `copy` เข้ามาเพื่อรองรับ 2 ภาษา 🟢
const SIDataEntry = ({ copy }) => {
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(templateOptions[0].value);
  
  // State สำหรับเก็บไฟล์และ URL ของ PDF เพื่อแสดงฝั่งซ้าย
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  
  // State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    shipper: "", booking_no: "", consignee: "", notify_party: "",
    feeder: "", place_of_receipt: "", vessel: "", port_of_loading: "",
    port_of_discharge: "", place_of_delivery: "", mark: "",
    quantity: "", description: "", gross_weight: "", measurement: ""
  });

  const handleUploadPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // สร้าง URL จำลองเพื่อโชว์ PDF ฝั่งซ้ายทันที!
    const fileUrl = URL.createObjectURL(file);
    setPdfFile(file);
    setPdfPreviewUrl(fileUrl);

    setLoading(true);
    const apiData = new FormData();
    apiData.append('file_program', file);
    apiData.append('company_program', selectedTemplate); 

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/v1/process-pdf`, { 
        method: 'POST', body: apiData 
      });
      
      const result = await response.json();
      
      if (result.status === 'success' && result.program?.data) {
        const extracted = result.program.data;
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
      } else {
        alert(copy?.dataFetchError || "❌ ไม่สามารถอ่านข้อมูลได้ หรือไฟล์มีปัญหา");
      }
    } catch (error) {
      console.error("Error fetching API:", error);
      alert(copy?.unknownError || "❌ เกิดข้อผิดพลาดในการเชื่อมต่อหลังบ้าน");
    } finally {
      setLoading(false);
      e.target.value = null; 
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExportExcel = () => {
    const exportData = [{
      "Timestamp": new Date().toLocaleString('en-GB'),
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

  // Styles สำหรับโครงสร้างฟอร์ม
  const styles = {
    paper: { minWidth: '700px', backgroundColor: '#fff', border: '1px solid #cbd5e1', fontFamily: "'Sarabun', Arial, sans-serif", color: '#000', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    row: { display: 'flex', borderBottom: '1px solid #000' },
    colLeft: { flex: 1, borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' },
    colRight: { flex: 1, display: 'flex', flexDirection: 'column' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr' },
    cell: { borderRight: '1px solid #000', borderBottom: '1px solid #000', display: 'flex', flexDirection: 'column' },
    label: { fontSize: '11px', fontWeight: 'bold', padding: '4px 6px', borderBottom: '1px solid #eee', backgroundColor: '#f8fafc', color: '#334155' },
    input: { border: 'none', padding: '8px', fontSize: '13px', width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
    textarea: { border: 'none', padding: '8px', fontSize: '13px', width: '100%', boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' },
    tableHeader: { fontSize: '10px', fontWeight: 'bold', textAlign: 'center', padding: '6px', borderBottom: '1px solid #000', borderRight: '1px solid #000' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', backgroundColor: '#f0f2f5' }}>
      
      {/* 🟢 ส่วน Header (อัปโหลดและเลือก Template) 🟢 */}
      <div style={{ padding: '16px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2em', color: '#0f172a' }}>{copy?.programDocument || "SI Data Extraction"}</h2>
          <span style={{ fontSize: '0.85em', color: '#64748b' }}>อัปโหลดเอกสาร SI เพื่อสกัดข้อมูลและส่งออกเป็น Excel</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          <select 
            value={selectedTemplate} 
            onChange={(e) => setSelectedTemplate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
          >
            {templateOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          <div style={{ position: 'relative' }}>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handleUploadPDF} 
              disabled={loading}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: loading ? 'not-allowed' : 'pointer' }}
            />
            <button style={{ padding: '8px 16px', backgroundColor: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading ? "⏳ Processing..." : "📁 Upload PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* 🟢 ส่วน Split View (ซ้าย: PDF, ขวา: Form) 🟢 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* ฝั่งซ้าย: PDF Viewer */}
        <div style={{ flex: 1, borderRight: '2px solid #cbd5e1', backgroundColor: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 16px', backgroundColor: '#334155', color: '#fff', fontSize: '0.85em', fontWeight: 'bold' }}>
            📄 Original Document (Copy text from here)
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {pdfPreviewUrl ? (
              <iframe 
                src={`${pdfPreviewUrl}#toolbar=0`} 
                title="PDF Preview" 
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <p>No document uploaded. Please upload a PDF.</p>
              </div>
            )}
          </div>
        </div>

        {/* ฝั่งขวา: Data Entry Form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f8fafc' }}>
          
          <div style={{ overflowX: 'auto', paddingBottom: '20px' }}>
            {/* โครงสร้างกระดาษ SI */}
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
          </div>

          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <button onClick={handleExportExcel} style={{ padding: '12px 30px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
              💾 Export to Database (Excel)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SIDataEntry;
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const fallbackTemplateOptions = [
  { value: 'MCKEY', label: 'MCKEY' },
  { value: 'SUPER_SIERRA', label: 'B.FOODS/NO LOGO' },
  { value: 'BFOODS_1', label: 'B.FOODS/LOGO BETAGRO UPSTAIRS ' },
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

const parseFieldValue = (fieldObj) => {
  if (!fieldObj) return "";
  if (typeof fieldObj === 'object' && fieldObj.value !== undefined && fieldObj.value !== null) {
    return String(fieldObj.value).trim();
  }
  if (typeof fieldObj === 'string') return fieldObj.trim();
  return "";
};

const SIDataEntry = ({ copy }) => {
  const [loading, setLoading] = useState(false);
  
  const [templateOptions, setTemplateOptions] = useState(fallbackTemplateOptions);
  const [selectedTemplate, setSelectedTemplate] = useState(fallbackTemplateOptions[0].value);
  
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  
  const [formData, setFormData] = useState({
    shipper: "", booking_no: "", consignee: "", notify_party: "",
    feeder: "", place_of_receipt: "", vessel: "", port_of_loading: "",
    port_of_discharge: "", place_of_delivery: "", mark: "",
    quantity: "", description: "", gross_weight: "", measurement: ""
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/v1/templates`);
        
        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.templates && data.templates.length > 0) {
            const options = data.templates.map(t => ({ value: t, label: t.replace(/_/g, ' ') }));
            setTemplateOptions(options);
            setSelectedTemplate(options[0].value);
            return;
          }
        }
        throw new Error("Invalid response format or empty data");
      } catch (error) {
        console.warn("Failed to fetch templates from API. Using fallback options.");
        setTemplateOptions(fallbackTemplateOptions);
        setSelectedTemplate(fallbackTemplateOptions[0].value);
      }
    };
    
    fetchTemplates();
  }, []);

  const handleUploadPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
        const d = result.program.data;
        console.log("Extracted data from API:", d); 
        
        setFormData({
          shipper: parseFieldValue(d.shipper),
          booking_no: parseFieldValue(d.booking_no),
          consignee: parseFieldValue(d.consignee),
          notify_party: parseFieldValue(d.notify_party),
          feeder: parseFieldValue(d.pre_carriage_by),
          place_of_receipt: parseFieldValue(d.place_of_receipt),
          vessel: parseFieldValue(d.vessel),
          port_of_loading: parseFieldValue(d.port_of_loading),
          port_of_discharge: parseFieldValue(d.port_of_discharge),
          place_of_delivery: parseFieldValue(d.place_of_delivery),
          mark: parseFieldValue(d.mark),
          quantity: parseFieldValue(d.quantity),
          description: parseFieldValue(d.description_of_good),
          gross_weight: parseFieldValue(d.gross_weight),
          measurement: parseFieldValue(d.measurement)
        });

      } else {
        alert(copy?.dataFetchError || "Unable to read data or invalid file format.");
      }
    } catch (error) {
      console.error("Error fetching API:", error);
      alert(copy?.unknownError || "Connection error occurred.");
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

  const theme = { border: '#cbd5e1', bg: '#f8fafc', headerText: '#334155', navy: '#0f172a', blue: '#1d4ed8' };
  
  const styles = {
    paper: { minWidth: '900px', width: '100%', backgroundColor: '#fff', border: `1px solid ${theme.border}`, borderRadius: '6px', fontFamily: "'Sarabun', Arial, sans-serif", color: '#1e293b', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', overflow: 'hidden' },
    row: { display: 'flex', borderBottom: `1px solid ${theme.border}`, minHeight: '85px' },
    colLeft: { flex: 1, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' },
    colRight: { flex: 1, display: 'flex', flexDirection: 'column' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr' },
    cell: { borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' },
    label: { fontSize: '11px', fontWeight: '800', padding: '6px 12px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.headerText, textTransform: 'uppercase' },
    input: { border: 'none', padding: '10px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', backgroundColor: 'transparent', flexGrow: 1 },
    textarea: { border: 'none', padding: '10px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit', backgroundColor: 'transparent', lineHeight: '1.5', flexGrow: 1 },
    tableHeader: { fontSize: '10px', fontWeight: '800', textAlign: 'center', padding: '10px 4px', borderBottom: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.headerText, textTransform: 'uppercase' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', backgroundColor: '#f0f2f5' }}>
      
      <div style={{ padding: '16px 24px', backgroundColor: '#fff', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25em', color: theme.navy, fontWeight: '800' }}>Shipping Instruction</h2>
          <span style={{ fontSize: '0.85em', color: '#64748b' }}>Upload SI document to extract data and export to Excel</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          <select 
            value={selectedTemplate} 
            onChange={(e) => setSelectedTemplate(e.target.value)}
            disabled={templateOptions.length === 0}
            style={{ padding: '8px 12px', borderRadius: '6px', border: `1px solid ${theme.border}`, fontSize: '13px', outline: 'none', cursor: 'pointer', backgroundColor: theme.bg, fontWeight: '600', color: theme.navy }}
          >
            {templateOptions.length === 0 ? (
              <option>Loading templates...</option>
            ) : (
              templateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))
            )}
          </select>
          
          <div style={{ position: 'relative' }}>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handleUploadPDF} 
              disabled={loading || templateOptions.length === 0}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: (loading || templateOptions.length === 0) ? 'not-allowed' : 'pointer' }}
            />
            <button style={{ padding: '8px 16px', backgroundColor: theme.blue, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading ? "Processing..." : "Upload PDF"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        <div style={{ flex: '1 1 45%', borderRight: `2px solid ${theme.border}`, backgroundColor: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 16px', backgroundColor: '#374151', color: '#f8fafc', fontSize: '0.85em', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            Original Document (Copy text from here)
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {pdfPreviewUrl ? (
              <iframe 
                src={`${pdfPreviewUrl}#toolbar=0&view=FitH`} 
                title="PDF Preview" 
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontWeight: '500' }}>No document uploaded. Please upload a PDF.</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: '1 1 55%', overflowY: 'auto', overflowX: 'auto', padding: '24px', backgroundColor: '#f8fafc' }}>
          
          <div style={{ paddingBottom: '20px' }}>
            <div style={styles.paper}>
              
              <div style={styles.row}>
                <div style={styles.colLeft}>
                  <div style={styles.label}>1. Shipper/Exporter (complete name and address)</div>
                  <textarea name="shipper" value={formData.shipper} onChange={handleChange} style={styles.textarea} />
                </div>
                <div style={styles.colRight}>
                  <div style={styles.label}>2. Booking Number</div>
                  <input name="booking_no" value={formData.booking_no} onChange={handleChange} style={{...styles.input, fontSize: '15px', fontWeight: 'bold', textAlign: 'center', color: theme.blue}} />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.colLeft}>
                  <div style={styles.label}>3. Consignee (complete name and address)</div>
                  <textarea name="consignee" value={formData.consignee} onChange={handleChange} style={styles.textarea} />
                </div>
                <div style={{...styles.colRight, justifyContent: 'center', alignItems: 'center'}}>
                   <span style={{color: '#dc2626', fontWeight: '800', fontSize: '20px', letterSpacing: '0.02em', opacity: 0.2}}>SURRENDER B/L</span>
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.colLeft}>
                  <div style={styles.label}>4. Notify Party (complete name and address)</div>
                  <textarea name="notify_party" value={formData.notify_party} onChange={handleChange} style={styles.textarea} />
                </div>
                <div style={styles.colRight}></div>
              </div>

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

              <div style={{ borderTop: `1px solid ${theme.border}`, display: 'grid', gridTemplateColumns: '1.5fr 1fr 3fr 1fr 1fr' }}>
                <div style={styles.tableHeader}>11. Marks & Nos</div>
                <div style={styles.tableHeader}>12. Containers</div>
                <div style={styles.tableHeader}>13. Description of Goods</div>
                <div style={styles.tableHeader}>14. G WT. (KGS)</div>
                <div style={{...styles.tableHeader, borderRight: 'none'}}>15. M3</div>

                <div style={{display: 'flex', borderRight: `1px solid ${theme.border}`}}>
                  <textarea name="mark" value={formData.mark} onChange={handleChange} style={{...styles.textarea, minHeight: '220px'}} />
                </div>
                <div style={{display: 'flex', borderRight: `1px solid ${theme.border}`}}>
                  <textarea name="quantity" value={formData.quantity} onChange={handleChange} style={{...styles.textarea, minHeight: '220px', textAlign: 'center'}} />
                </div>
                <div style={{display: 'flex', borderRight: `1px solid ${theme.border}`}}>
                  <textarea name="description" value={formData.description} onChange={handleChange} style={{...styles.textarea, minHeight: '220px'}} />
                </div>
                <div style={{display: 'flex', borderRight: `1px solid ${theme.border}`}}>
                  <textarea name="gross_weight" value={formData.gross_weight} onChange={handleChange} style={{...styles.textarea, minHeight: '220px', textAlign: 'center'}} />
                </div>
                <div style={{display: 'flex'}}>
                  <textarea name="measurement" value={formData.measurement} onChange={handleChange} style={{...styles.textarea, minHeight: '220px', textAlign: 'center'}} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button onClick={handleExportExcel} style={{ padding: '12px 24px', backgroundColor: theme.navy, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)' }}>
              Export to Database (Excel)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SIDataEntry;
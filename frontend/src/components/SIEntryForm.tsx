import React, { useState } from 'react';
import { PenTool, Download, Plus, Trash2, CheckCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SIEntryFormProps {
  language: 'th' | 'en';
}

export const SIEntryForm: React.FC<SIEntryFormProps> = ({ language }) => {
  const isTh = language === 'th';
  const [formData, setFormData] = useState({
    bookingNo: 'BKK9028194',
    shipperName: 'SIAM EXPORT TRADING CO., LTD.',
    shipperTaxId: '0105525022493',
    shipperAddress: '123/45 SATHORN ROAD, YAN NAWA, BANGKOK 10120 THAILAND',
    consigneeName: 'GLOBAL IMPORTERS LTD.',
    consigneeTaxId: '913101150820306590',
    consigneeAddress: 'BUILDING 4, PU DONG NEW AREA, SHANGHAI 200120 CHINA',
    notifyParty: 'SAME AS CONSIGNEE',
    pol: 'LAEM CHABANG, THAILAND',
    pod: 'SHANGHAI, CHINA',
    vessel: 'EVER GIVEN V.0382E',
    commodity: 'INDUSTRIAL CERAMIC TILES',
    hsCode: '6907.21.00',
    containerCount: '3X40HQ',
    grossWeight: '62,400.00 KGS',
    measurement: '215.541 CBM',
    freightTerm: 'FREIGHT PREPAID',
    marks: 'EMCU9201821 / SEAL: EM88192\nEMCU9201832 / SEAL: EM88193\nEMCU9201843 / SEAL: EM88194',
  });

  const handleChange = (field: string, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleExportExcel = () => {
    const data = [
      { Field: 'Booking No.', Value: formData.bookingNo },
      { Field: 'Shipper Name & Tax ID', Value: `${formData.shipperName} (TAX: ${formData.shipperTaxId})` },
      { Field: 'Shipper Address', Value: formData.shipperAddress },
      { Field: 'Consignee Name & Tax ID', Value: `${formData.consigneeName} (TAX: ${formData.consigneeTaxId})` },
      { Field: 'Consignee Address', Value: formData.consigneeAddress },
      { Field: 'Notify Party', Value: formData.notifyParty },
      { Field: 'Port of Loading (POL)', Value: formData.pol },
      { Field: 'Port of Discharge (POD)', Value: formData.pod },
      { Field: 'Ocean Vessel & Voyage', Value: formData.vessel },
      { Field: 'Commodity Description', Value: formData.commodity },
      { Field: 'HS Code', Value: formData.hsCode },
      { Field: 'Quantity / Packages', Value: formData.containerCount },
      { Field: 'Gross Weight', Value: formData.grossWeight },
      { Field: 'Measurement / CBM', Value: formData.measurement },
      { Field: 'Freight Term', Value: formData.freightTerm },
      { Field: 'Container & Seal Marks', Value: formData.marks },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Shipping_Instruction');
    XLSX.writeFile(wb, `Shipping_Instruction_${formData.bookingNo}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30">
              {isTh ? 'การกรอกและออกเอกสารส่งออก' : 'SI Data Generator'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isTh ? 'สร้างแบบฟอร์ม Shipping Instruction (SI)' : 'Generate Shipping Instruction (SI)'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isTh
              ? 'กรอกข้อมูลการจัดส่งสินค้าเพื่อจัดทำเป็นเอกสารต้นฉบับและส่งออกไฟล์ Excel'
              : 'Complete and export standardized SI forms ready for carrier submission'}
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{isTh ? 'ส่งออกเป็น Excel' : 'Export Excel'}</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Booking No.
            </label>
            <input
              type="text"
              value={formData.bookingNo}
              onChange={(e) => handleChange('bookingNo', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isTh ? 'เงื่อนไขค่าระวาง (Freight Term)' : 'Freight Term'}
            </label>
            <select
              value={formData.freightTerm}
              onChange={(e) => handleChange('freightTerm', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="FREIGHT PREPAID">FREIGHT PREPAID (ชำระต้นทาง)</option>
              <option value="FREIGHT COLLECT">FREIGHT COLLECT (ชำระปลายทาง)</option>
            </select>
          </div>
        </div>

        {/* Shipper */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
            1. Shipper / Exporter Details
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Company Name</label>
              <input
                type="text"
                value={formData.shipperName}
                onChange={(e) => handleChange('shipperName', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tax ID (เลขผู้เสียภาษี)</label>
              <input
                type="text"
                value={formData.shipperTaxId}
                onChange={(e) => handleChange('shipperTaxId', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Registered Address</label>
            <input
              type="text"
              value={formData.shipperAddress}
              onChange={(e) => handleChange('shipperAddress', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>

        {/* Consignee */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
            2. Consignee Details
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Company Name</label>
              <input
                type="text"
                value={formData.consigneeName}
                onChange={(e) => handleChange('consigneeName', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tax ID (เลขผู้เสียภาษี)</label>
              <input
                type="text"
                value={formData.consigneeTaxId}
                onChange={(e) => handleChange('consigneeTaxId', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Registered Address</label>
            <input
              type="text"
              value={formData.consigneeAddress}
              onChange={(e) => handleChange('consigneeAddress', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>

        {/* Routing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Port of Loading (POL)</label>
            <input
              type="text"
              value={formData.pol}
              onChange={(e) => handleChange('pol', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Port of Discharge (POD)</label>
            <input
              type="text"
              value={formData.pod}
              onChange={(e) => handleChange('pod', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Ocean Vessel & Voyage</label>
            <input
              type="text"
              value={formData.vessel}
              onChange={(e) => handleChange('vessel', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        {/* Cargo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Quantity / Containers</label>
            <input
              type="text"
              value={formData.containerCount}
              onChange={(e) => handleChange('containerCount', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Gross Weight (KGS)</label>
            <input
              type="text"
              value={formData.grossWeight}
              onChange={(e) => handleChange('grossWeight', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Measurement (CBM)</label>
            <input
              type="text"
              value={formData.measurement}
              onChange={(e) => handleChange('measurement', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        {/* Marks */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Container Numbers & Seal Numbers (เครื่องหมายและเลขตู้)
          </label>
          <textarea
            rows={3}
            value={formData.marks}
            onChange={(e) => handleChange('marks', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono"
          />
        </div>
      </div>
    </div>
  );
};

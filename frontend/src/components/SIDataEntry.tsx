import React, { useState } from 'react';
import { PenTool, Download, Copy, Check, FileSpreadsheet, Sparkles, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SHIPPING_FIELDS } from '../services/templateRegistry';

interface SIDataEntryProps {
  language: 'th' | 'en';
  onUseForCompare?: (data: Record<string, string>) => void;
}

export const SIDataEntry: React.FC<SIDataEntryProps> = ({ language, onUseForCompare }) => {
  const isTh = language === 'th';
  const [formData, setFormData] = useState<Record<string, string>>({
    booking_no: 'BKK98472910',
    shipper: 'POLYPLEX (THAILAND) PUBLIC COMPANY LIMITED\n75/26 OCEAN TOWER II 18TH FL. SOI SUKHUMVIT 19\nBANGKOK 10110 THAILAND',
    consignee: 'PACKAGING ADVANCED SOLUTIONS SDN. BHD.\nLOT 4521 JALAN PERSIARAN INDUSTRI\n42000 PORT KLANG SELANGOR MALAYSIA',
    notify_party: 'SAME AS CONSIGNEE',
    pre_carriage_by: 'WAN HAI 271 V.024E',
    vessel: 'OOCL ROTTERDAM V.128W',
    port_of_loading: 'LAEM CHABANG, THAILAND',
    port_of_discharge: 'PORT KLANG, MALAYSIA',
    place_of_delivery: 'PORT KLANG, MALAYSIA',
    place_of_receipt: 'LAEM CHABANG PORT',
    mark: 'OOLU8492015 / SEAL: OOC883921\nOOLU9104822 / SEAL: OOC883922',
    description: '2X40HQ CONTAINER SAID TO CONTAIN:\nBIAXIALLY ORIENTED POLYESTER FILM (BOPET)\nHS CODE: 3920.62.10\nFREIGHT PREPAID AS ARRANGED',
    quantity: '36 PALLETS (1,440 ROLLS)',
    gross_weight: '21,450.00 KGS',
    measurement: '58.420 CBM',
    freight_term: 'FREIGHT PREPAID',
  });

  const [copied, setCopied] = useState(false);

  const handleChange = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleExportExcel = () => {
    const rowData = [
      {
        'BOOKING NO.': formData.booking_no,
        SHIPPER: formData.shipper,
        CONSIGNEE: formData.consignee,
        'NOTIFY PARTY': formData.notify_party,
        FEEDER: formData.pre_carriage_by,
        VESSEL: formData.vessel,
        'PORT OF LOADING': formData.port_of_loading,
        'PORT OF DISCHARGE': formData.port_of_discharge,
        'PORT OR DELIVERY': formData.place_of_delivery,
        MARKS: formData.mark,
        DESCRIPTION: formData.description,
        ' QTY ': formData.quantity,
        ' G.W. ': formData.gross_weight,
        ' CBM ': formData.measurement,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rowData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SI_MASTER');
    XLSX.writeFile(wb, `SI_${formData.booking_no || 'Document'}.xlsx`);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <PenTool className="w-3.5 h-3.5" />
            <span>Shipping Instruction Generator</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {isTh ? 'ระบบสร้างและบันทึกข้อมูล SI (SI Data Entry)' : 'SI Form Data Entry & Generator'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTh
              ? 'กรอกข้อมูลฟิลด์การส่งออกตามโครงสร้างมาตรฐานสายเรือ และส่งออกเป็น Excel (.xlsx) ที่เข้ากันได้กับระบบตรวจเทียบ'
              : 'Construct structured Shipping Instructions and export to standard liner spreadsheet format.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isTh ? 'คัดลอกแล้ว' : 'Copied') : (isTh ? 'คัดลอก JSON' : 'Copy JSON')}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isTh ? 'บันทึกเป็น Excel (.xlsx)' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* Form Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'เลขที่บุ๊กกิ้ง (Booking No.) *' : 'Booking No. *'}
            </label>
            <input
              type="text"
              value={formData.booking_no || ''}
              onChange={(e) => handleChange('booking_no', e.target.value)}
              className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'เงื่อนไขค่าระวาง (Freight Term)' : 'Freight Term'}
            </label>
            <select
              value={formData.freight_term || 'FREIGHT PREPAID'}
              onChange={(e) => handleChange('freight_term', e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="FREIGHT PREPAID">FREIGHT PREPAID (ต้นทางจ่าย)</option>
              <option value="FREIGHT COLLECT">FREIGHT COLLECT (ปลายทางจ่าย)</option>
            </select>
          </div>
        </div>

        {/* Shipper & Consignee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'ผู้ส่งออก (Shipper / Exporter) *' : 'Shipper / Exporter *'}
            </label>
            <textarea
              rows={3}
              value={formData.shipper || ''}
              onChange={(e) => handleChange('shipper', e.target.value)}
              className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'ผู้รับสินค้าปลายทาง (Consignee) *' : 'Consignee *'}
            </label>
            <textarea
              rows={3}
              value={formData.consignee || ''}
              onChange={(e) => handleChange('consignee', e.target.value)}
              className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Notify Party */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {isTh ? 'ผู้รับแจ้ง (Notify Party)' : 'Notify Party'}
          </label>
          <input
            type="text"
            value={formData.notify_party || ''}
            onChange={(e) => handleChange('notify_party', e.target.value)}
            className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Vessels & Ports */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pre-Carriage / Feeder
            </label>
            <input
              type="text"
              value={formData.pre_carriage_by || ''}
              onChange={(e) => handleChange('pre_carriage_by', e.target.value)}
              className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ocean Vessel & Voyage *
            </label>
            <input
              type="text"
              value={formData.vessel || ''}
              onChange={(e) => handleChange('vessel', e.target.value)}
              className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Port of Loading (POL) *
            </label>
            <input
              type="text"
              value={formData.port_of_loading || ''}
              onChange={(e) => handleChange('port_of_loading', e.target.value)}
              className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Port of Discharge (POD) *
            </label>
            <input
              type="text"
              value={formData.port_of_discharge || ''}
              onChange={(e) => handleChange('port_of_discharge', e.target.value)}
              className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Cargo, Container & Weight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Marks & Numbers / Container No. & Seal
            </label>
            <textarea
              rows={3}
              value={formData.mark || ''}
              onChange={(e) => handleChange('mark', e.target.value)}
              className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description of Goods & HS Code
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quantity & Packages
            </label>
            <input
              type="text"
              value={formData.quantity || ''}
              onChange={(e) => handleChange('quantity', e.target.value)}
              className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Gross Weight (KGS) *
            </label>
            <input
              type="text"
              value={formData.gross_weight || ''}
              onChange={(e) => handleChange('gross_weight', e.target.value)}
              className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Measurement (CBM)
            </label>
            <input
              type="text"
              value={formData.measurement || ''}
              onChange={(e) => handleChange('measurement', e.target.value)}
              className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

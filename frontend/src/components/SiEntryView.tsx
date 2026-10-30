import React, { useState } from 'react';
import { PenTool, Download, Send, CheckCircle2, RefreshCw, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SiEntryViewProps {
  language: 'th' | 'en';
  onLoadIntoCompare?: (siData: Record<string, string>) => void;
}

export const SiEntryView: React.FC<SiEntryViewProps> = ({ language, onLoadIntoCompare }) => {
  const isTh = language === 'th';

  const [formData, setFormData] = useState({
    booking_no: '2648719001',
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

  const [isExported, setIsExported] = useState(false);

  const handleChange = (field: string, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleExportExcel = () => {
    const wsData = [
      ['MARITIME ALLIANCE - SHIPPING INSTRUCTION (SI) DATA SHEET'],
      ['Exported on:', new Date().toISOString()],
      [],
      ['Field Name', 'Field Key', 'Value'],
      ['Booking Number', 'booking_no', formData.booking_no],
      ['Shipper / Exporter', 'shipper', formData.shipper],
      ['Consignee', 'consignee', formData.consignee],
      ['Notify Party', 'notify_party', formData.notify_party],
      ['Pre-Carriage Feeder', 'pre_carriage_by', formData.pre_carriage_by],
      ['Ocean Mother Vessel', 'vessel', formData.vessel],
      ['Place of Receipt', 'place_of_receipt', formData.place_of_receipt],
      ['Port of Loading (POL)', 'port_of_loading', formData.port_of_loading],
      ['Port of Discharge (POD)', 'port_of_discharge', formData.port_of_discharge],
      ['Place of Delivery', 'place_of_delivery', formData.place_of_delivery],
      ['Marks & Container/Seal', 'mark', formData.mark],
      ['Description of Goods', 'description', formData.description],
      ['Number of Packages', 'quantity', formData.quantity],
      ['Gross Weight', 'gross_weight', formData.gross_weight],
      ['Measurement (CBM)', 'measurement', formData.measurement],
      ['Freight Payment Term', 'freight_term', formData.freight_term],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 60 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Shipping Instruction');

    XLSX.writeFile(wb, `SI_${formData.booking_no || 'DRAFT'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setIsExported(true);
    setTimeout(() => setIsExported(false), 2500);
  };

  const handleReset = () => {
    setFormData({
      booking_no: '',
      shipper: '',
      consignee: '',
      notify_party: 'SAME AS CONSIGNEE',
      pre_carriage_by: '',
      vessel: '',
      port_of_loading: 'LAEM CHABANG, THAILAND',
      port_of_discharge: '',
      place_of_delivery: '',
      place_of_receipt: 'LAEM CHABANG CFS',
      mark: '',
      description: '',
      quantity: '',
      gross_weight: '',
      measurement: '',
      freight_term: 'FREIGHT PREPAID',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <PenTool className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              {isTh ? 'สร้างและบันทึกข้อมูลแบบฟอร์ม SI (SI Data Entry & Excel Export)' : 'SI Data Entry & Excel Export'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isTh
              ? 'กรอกข้อมูล Shipping Instruction ตามมาตรฐานสายเรือ และส่งออกเป็นไฟล์ Excel (.xlsx) ทันที'
              : 'Complete standard Shipping Instruction fields and export directly to a structured Excel spreadsheet.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isTh ? 'ล้างฟอร์ม' : 'Clear Form'}</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExported ? (isTh ? 'ดาวน์โหลดสำเร็จ!' : 'Downloaded!') : isTh ? 'ส่งออกเป็น Excel (.xlsx)' : 'Export Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        {/* Booking Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'เลขที่การจองระวาง (Booking No.) *' : 'Booking Number *'}
            </label>
            <input
              type="text"
              value={formData.booking_no}
              onChange={(e) => handleChange('booking_no', e.target.value)}
              placeholder="e.g. 2648719001"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'เงื่อนไขค่าระวาง (Freight Term)' : 'Freight Term'}
            </label>
            <select
              value={formData.freight_term}
              onChange={(e) => handleChange('freight_term', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="FREIGHT PREPAID">FREIGHT PREPAID (ต้นทางชำระ)</option>
              <option value="FREIGHT COLLECT">FREIGHT COLLECT (ปลายทางชำระ)</option>
              <option value="FREIGHT PAYABLE AT DESTINATION">FREIGHT PAYABLE AT DESTINATION</option>
            </select>
          </div>
        </div>

        {/* Parties Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? '1. ผู้ส่งออก (Shipper / Exporter) *' : '1. Shipper / Exporter *'}
            </label>
            <textarea
              rows={4}
              value={formData.shipper}
              onChange={(e) => handleChange('shipper', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? '2. ผู้รับสินค้า (Consignee) *' : '2. Consignee *'}
            </label>
            <textarea
              rows={4}
              value={formData.consignee}
              onChange={(e) => handleChange('consignee', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? '3. ผู้รับแจ้ง (Notify Party)' : '3. Notify Party'}
            </label>
            <textarea
              rows={4}
              value={formData.notify_party}
              onChange={(e) => handleChange('notify_party', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Vessel & Ports */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'เรือฟีดเดอร์ (Pre-Carriage)' : 'Pre-Carriage Vessel'}
            </label>
            <input
              type="text"
              value={formData.pre_carriage_by}
              onChange={(e) => handleChange('pre_carriage_by', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'เรือใหญ่ & เที่ยว (Ocean Vessel) *' : 'Ocean Vessel & Voyage *'}
            </label>
            <input
              type="text"
              value={formData.vessel}
              onChange={(e) => handleChange('vessel', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'ท่าเรือต้นทาง (POL) *' : 'Port of Loading (POL) *'}
            </label>
            <input
              type="text"
              value={formData.port_of_loading}
              onChange={(e) => handleChange('port_of_loading', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'ท่าเรือปลายทาง (POD) *' : 'Port of Discharge (POD) *'}
            </label>
            <input
              type="text"
              value={formData.port_of_discharge}
              onChange={(e) => handleChange('port_of_discharge', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Cargo, Containers, Weights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'เลขตู้และเบอร์ซีล (Marks & Seal Nos.) *' : 'Marks & Seal Numbers *'}
            </label>
            <textarea
              rows={3}
              value={formData.mark}
              onChange={(e) => handleChange('mark', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'รายละเอียดสินค้า (Description of Goods) *' : 'Description of Goods *'}
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'จำนวนหีบห่อ (Packages)' : 'Packages'}
            </label>
            <input
              type="text"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'น้ำหนักรวม (Gross Weight) *' : 'Gross Weight *'}
            </label>
            <input
              type="text"
              value={formData.gross_weight}
              onChange={(e) => handleChange('gross_weight', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'ปริมาตร (Measurement CBM)' : 'Measurement (CBM)'}
            </label>
            <input
              type="text"
              value={formData.measurement}
              onChange={(e) => handleChange('measurement', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

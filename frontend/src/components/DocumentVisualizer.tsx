import React, { useState } from 'react';
import {
  FileText,
  Ship,
  Stamp,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { FieldItem, DiscrepancyItem } from '../types/shipping';

interface DocumentVisualizerProps {
  title: string;
  docType: 'SI' | 'BL';
  carrierOrShipperName: string;
  fields: Record<string, FieldItem>;
  discrepancies: DiscrepancyItem[];
  selectedField: string | null;
  onSelectField: (fieldKey: string) => void;
  language: 'th' | 'en';
}

export const DocumentVisualizer: React.FC<DocumentVisualizerProps> = ({
  title,
  docType,
  carrierOrShipperName,
  fields,
  discrepancies,
  selectedField,
  onSelectField,
  language,
}) => {
  const isTh = language === 'th';
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [stampType, setStampType] = useState<'NONE' | 'APPROVED' | 'AMEND'>('NONE');

  const discrepancyMap = React.useMemo(() => {
    const map = new Map<string, DiscrepancyItem>();
    discrepancies.forEach((d) => map.set(d.field, d));
    return map;
  }, [discrepancies]);

  const renderFieldBlock = (
    fieldKey: string,
    label: string,
    minHeight = 'min-h-[52px]'
  ) => {
    const item = fields[fieldKey];
    const disc = discrepancyMap.get(fieldKey);
    const isSelected = selectedField === fieldKey;
    const hasDiscrepancy = disc && !disc.isMatch;
    const isCritical = disc && !disc.isMatch && disc.severity === 'critical';

    return (
      <div
        onClick={() => onSelectField(fieldKey)}
        className={`p-2 transition-all cursor-pointer rounded border relative group ${minHeight} ${
          isSelected
            ? 'bg-blue-100/90 border-blue-500 ring-2 ring-blue-400 z-10 shadow-sm'
            : hasDiscrepancy
            ? isCritical
              ? 'bg-rose-50/80 border-rose-400 hover:bg-rose-100/90'
              : 'bg-amber-50/80 border-amber-300 hover:bg-amber-100/90'
            : 'bg-white hover:bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            {label}
          </span>
          {hasDiscrepancy && (
            <span
              className={`w-2 h-2 rounded-full ${
                isCritical ? 'bg-rose-500 animate-ping' : 'bg-amber-500'
              }`}
              title={isTh ? 'พบจุดต่างกับเอกสารคู่เทียบ' : 'Discrepancy detected'}
            />
          )}
        </div>
        <div className="font-mono text-xs text-slate-900 whitespace-pre-wrap leading-tight break-words">
          {item?.value ? (
            item.value
          ) : (
            <span className="text-slate-300 italic text-[11px] font-sans">
              {isTh ? '-ไม่ได้ระบุ-' : '-Not Specified-'}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Pane Toolbar */}
      <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
              docType === 'SI'
                ? 'bg-blue-600 text-white'
                : 'bg-indigo-700 text-white'
            }`}
          >
            {docType}
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 leading-tight">
              {title}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">
              {carrierOrShipperName}
            </span>
          </div>
        </div>

        {/* Zoom & Stamp Controls */}
        <div className="flex items-center gap-1.5">
          {/* Stamp Action */}
          <div className="hidden sm:flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
            <button
              onClick={() =>
                setStampType(stampType === 'APPROVED' ? 'NONE' : 'APPROVED')
              }
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                stampType === 'APPROVED'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              STAMP OK
            </button>
            <button
              onClick={() =>
                setStampType(stampType === 'AMEND' ? 'NONE' : 'AMEND')
              }
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                stampType === 'AMEND'
                  ? 'bg-rose-600 text-white border-rose-700'
                  : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
              }`}
            >
              AMEND REQ
            </button>
          </div>

          <button
            onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono font-medium text-slate-500 w-8 text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sheet Canvas / Paper Container */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-slate-200/70">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="w-full max-w-xl bg-white shadow-md border border-slate-300 rounded p-5 relative transition-transform duration-150"
        >
          {/* Stamp Watermark Overlay */}
          {stampType === 'APPROVED' && (
            <div className="absolute top-12 right-12 z-20 pointer-events-none transform rotate-12 border-4 border-emerald-600/70 text-emerald-600/80 font-black text-2xl tracking-widest px-4 py-1.5 rounded uppercase">
              VERIFIED / OK
            </div>
          )}
          {stampType === 'AMEND' && (
            <div className="absolute top-12 right-12 z-20 pointer-events-none transform -rotate-12 border-4 border-rose-600/70 text-rose-600/80 font-black text-2xl tracking-widest px-4 py-1.5 rounded uppercase">
              AMENDMENT REQ
            </div>
          )}

          {/* Document Header Section */}
          <div className="border-b-2 border-slate-900 pb-3 mb-3 flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider">
                {docType === 'SI' ? 'EXPORTER SHIPPING INSTRUCTION' : 'COMBINED TRANSPORT BILL OF LADING DRAFT'}
              </div>
              <h2 className="text-base font-extrabold text-slate-900">
                {carrierOrShipperName}
              </h2>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                {isTh ? 'เลขที่เอกสาร / บุ๊กกิ้ง' : 'Booking / Reference'}
              </div>
              <div className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {fields['booking_no']?.value || 'N/A'}
              </div>
            </div>
          </div>

          {/* Grid Layout mimicking Maritime Standard Layout */}
          <div className="space-y-2">
            {/* Parties: Shipper */}
            {renderFieldBlock('shipper', isTh ? '1. ผู้ส่งออก (Shipper / Exporter)' : '1. Shipper / Exporter', 'min-h-[70px]')}

            {/* Consignee */}
            {renderFieldBlock('consignee', isTh ? '2. ผู้รับสินค้า (Consignee)' : '2. Consignee', 'min-h-[70px]')}

            {/* Notify Party */}
            {renderFieldBlock('notify_party', isTh ? '3. ผู้รับแจ้ง (Notify Party)' : '3. Notify Party', 'min-h-[50px]')}

            {/* Routing Grid: Pre-carriage, Ocean Vessel, POL, POD */}
            <div className="grid grid-cols-2 gap-2">
              {renderFieldBlock('pre_carriage_by', isTh ? 'เรือฟีดเดอร์ (Pre-Carriage)' : 'Pre-Carriage Vessel')}
              {renderFieldBlock('vessel', isTh ? 'เรือใหญ่ & เที่ยว (Ocean Vessel & Voyage)' : 'Ocean Vessel & Voyage')}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {renderFieldBlock('place_of_receipt', isTh ? 'สถานที่รับมอบ (Place of Receipt)' : 'Place of Receipt')}
              {renderFieldBlock('port_of_loading', isTh ? 'ท่าเรือต้นทาง (Port of Loading)' : 'Port of Loading')}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {renderFieldBlock('port_of_discharge', isTh ? 'ท่าเรือปลายทาง (Port of Discharge)' : 'Port of Discharge')}
              {renderFieldBlock('place_of_delivery', isTh ? 'สถานที่ส่งมอบ (Place of Delivery)' : 'Place of Delivery')}
            </div>

            {/* Cargo Details: Marks, Goods Description, Packages */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                {renderFieldBlock('mark', isTh ? 'ตู้ / เบอร์ซีล (Marks & Seal)' : 'Marks & Seal No.', 'min-h-[100px]')}
              </div>
              <div className="col-span-2">
                {renderFieldBlock('description', isTh ? 'รายละเอียดสินค้า (Description of Goods)' : 'Description of Goods', 'min-h-[100px]')}
              </div>
            </div>

            {/* Weights, Quantity, Measurements, Freight Terms */}
            <div className="grid grid-cols-4 gap-2">
              {renderFieldBlock('quantity', isTh ? 'จำนวนหีบห่อ' : 'Packages')}
              {renderFieldBlock('gross_weight', isTh ? 'น้ำหนักรวม (Gross Wt)' : 'Gross Weight')}
              {renderFieldBlock('measurement', isTh ? 'ปริมาตร (CBM)' : 'Measurement')}
              {renderFieldBlock('freight_term', isTh ? 'ค่าระวาง (Freight)' : 'Freight Term')}
            </div>
          </div>

          {/* Footer Terms Disclaimer */}
          <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-mono">
            <span>MLT Maritime Verification System v2.4</span>
            <span>Subject to standard carrier terms & conditions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

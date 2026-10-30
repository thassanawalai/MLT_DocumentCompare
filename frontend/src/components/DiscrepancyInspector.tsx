import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Check,
  FileEdit,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { DiscrepancyItem, DiffChunk } from '../types/shipping';

interface DiscrepancyInspectorProps {
  discrepancies: DiscrepancyItem[];
  selectedField: string | null;
  onSelectField: (fieldKey: string) => void;
  reviewedFields: Set<string>;
  onToggleReviewed: (fieldKey: string) => void;
  customNotes: Record<string, string>;
  onUpdateNote: (fieldKey: string, note: string) => void;
  filterSeverity: 'all' | 'critical' | 'warning' | 'info' | 'mismatch_only';
  setFilterSeverity: (sev: 'all' | 'critical' | 'warning' | 'info' | 'mismatch_only') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  language: 'th' | 'en';
}

export const DiscrepancyInspector: React.FC<DiscrepancyInspectorProps> = ({
  discrepancies,
  selectedField,
  onSelectField,
  reviewedFields,
  onToggleReviewed,
  customNotes,
  onUpdateNote,
  filterSeverity,
  setFilterSeverity,
  searchQuery,
  setSearchQuery,
  language,
}) => {
  const isTh = language === 'th';

  const filtered = discrepancies.filter((item) => {
    // Filter by mismatch/severity
    if (filterSeverity === 'mismatch_only' && item.isMatch) return false;
    if (filterSeverity === 'critical' && (item.isMatch || item.severity !== 'critical')) return false;
    if (filterSeverity === 'warning' && (item.isMatch || item.severity !== 'warning')) return false;
    if (filterSeverity === 'info' && (item.isMatch || item.severity !== 'info')) return false;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName =
        item.fieldNameTh.toLowerCase().includes(q) ||
        item.fieldNameEn.toLowerCase().includes(q) ||
        item.field.toLowerCase().includes(q) ||
        item.original_value.value.toLowerCase().includes(q) ||
        item.program_value.value.toLowerCase().includes(q);
      if (!matchName) return false;
    }

    return true;
  });

  const renderDiffText = (diffChunks: DiffChunk[], isOriginal: boolean) => {
    if (!diffChunks || diffChunks.length === 0) return <span className="text-slate-400 italic">-(Empty)-</span>;

    return (
      <span className="font-mono text-xs whitespace-pre-wrap leading-relaxed break-words">
        {diffChunks.map((chunk, idx) => {
          if (chunk.tag === 'equal') {
            return <span key={idx} className="text-slate-700">{chunk.value}</span>;
          }
          if (chunk.tag === 'delete') {
            return (
              <span
                key={idx}
                className="bg-rose-100 text-rose-800 font-semibold px-0.5 rounded border border-rose-300"
                title={isOriginal ? 'มีใน SI แต่ B/L ตัดออก' : 'ข้อความแตกต่าง'}
              >
                {chunk.value}
              </span>
            );
          }
          if (chunk.tag === 'insert') {
            return (
              <span
                key={idx}
                className="bg-emerald-100 text-emerald-800 font-semibold px-0.5 rounded border border-emerald-300"
                title="B/L เพิ่มขึ้นมาหรือพิมพ์ต่างออกไป"
              >
                {chunk.value}
              </span>
            );
          }
          return null;
        })}
      </span>
    );
  };

  const getSeverityBadge = (item: DiscrepancyItem) => {
    if (item.isMatch) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {isTh ? 'ตรงกัน 100%' : 'Exact Match'}
        </span>
      );
    }
    if (item.severity === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-300 animate-pulse">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          {isTh ? 'วิกฤต (Critical)' : 'Critical Discrepancy'}
        </span>
      );
    }
    if (item.severity === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          {isTh ? 'เตือน (Warning)' : 'Warning'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
        <Info className="w-3 h-3 text-blue-600" />
        {isTh ? 'ข้อมูลทั่วไป' : 'Notice'}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const cats: Record<string, { labelTh: string; labelEn: string; color: string }> = {
      party: { labelTh: 'คู่สัญญา (Party)', labelEn: 'Party', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      routing: { labelTh: 'การเดินเรือ (Routing)', labelEn: 'Routing', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
      cargo: { labelTh: 'ตู้ & สินค้า (Cargo)', labelEn: 'Cargo', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      booking: { labelTh: 'การจอง (Booking)', labelEn: 'Booking', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      customs: { labelTh: 'ศุลกากร (Customs)', labelEn: 'Customs', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    };
    const c = cats[category] || { labelTh: category, labelEn: category, color: 'bg-slate-50 text-slate-700 border-slate-200' };
    return (
      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${c.color}`}>
        {isTh ? c.labelTh : c.labelEn}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Table Header & Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            {isTh ? 'ตารางตรวจสอบความถูกต้องของฟิลด์ข้อมูล (Field-by-Field Verification)' : 'Field Discrepancy Verification Table'}
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
              {filtered.length} {isTh ? 'รายการ' : 'fields'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTh
              ? 'คลิกที่แถวเพื่อไฮไลต์ตำแหน่งในเอกสาร SI และ B/L โดยอัตโนมัติ'
              : 'Click any row to auto-focus and highlight the field on both SI and B/L sheets.'}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] mr-1">
            <Filter className="w-3 h-3" />
            {isTh ? 'กรอง:' : 'Filter:'}
          </span>
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filterSeverity === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isTh ? 'ทั้งหมด' : 'All'}
          </button>
          <button
            onClick={() => setFilterSeverity('mismatch_only')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              filterSeverity === 'mismatch_only'
                ? 'bg-rose-600 text-white'
                : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
            }`}
          >
            {isTh ? 'เฉพาะจุดต่าง (Diffs Only)' : 'Discrepancies Only'}
          </button>
          <button
            onClick={() => setFilterSeverity('critical')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              filterSeverity === 'critical'
                ? 'bg-rose-700 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isTh ? 'วิกฤต' : 'Critical'}
          </button>
          <button
            onClick={() => setFilterSeverity('warning')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              filterSeverity === 'warning'
                ? 'bg-amber-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isTh ? 'เตือน' : 'Warnings'}
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto flex-1 divide-y divide-slate-100">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
              <th className="py-2.5 px-3 w-40">{isTh ? 'ชื่อฟิลด์ / หมวดหมู่' : 'Field & Category'}</th>
              <th className="py-2.5 px-3 w-28">{isTh ? 'สถานะ' : 'Status'}</th>
              <th className="py-2.5 px-4 w-1/3 bg-blue-50/40 border-r border-slate-200">
                <span className="font-bold text-blue-900">{isTh ? 'เอกสารตั้งต้น (SI Value)' : 'SI Value (Original)'}</span>
              </th>
              <th className="py-2.5 px-4 w-1/3 bg-slate-50/60">
                <span className="font-bold text-slate-800">{isTh ? 'เอกสารปลายทาง (B/L Draft Value)' : 'B/L Value (Draft)'}</span>
              </th>
              <th className="py-2.5 px-3 w-28 text-center">{isTh ? 'การตรวจสอบ' : 'Review'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-medium text-slate-600">{isTh ? 'ไม่พบรายการที่ตรงกับเงื่อนไขการกรอง' : 'No fields match the current filters'}</p>
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedField === item.field;
                const isReviewed = reviewedFields.has(item.field);
                const note = customNotes[item.field] || '';

                return (
                  <tr
                    key={item.field}
                    onClick={() => onSelectField(item.field)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 ring-2 ring-blue-500 ring-inset'
                        : item.isMatch
                        ? 'hover:bg-slate-50'
                        : 'bg-rose-50/20 hover:bg-rose-50/40'
                    }`}
                  >
                    {/* Field & Category */}
                    <td className="py-3 px-3 align-top">
                      <div className="font-bold text-slate-900 leading-tight">
                        {isTh ? item.fieldNameTh : item.fieldNameEn}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.field}</div>
                      <div className="mt-1.5">{getCategoryBadge(item.category)}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 align-top">
                      <div>{getSeverityBadge(item)}</div>
                      {item.isMatch && (
                        <div className="text-[10px] text-slate-400 mt-1">Normalized Match</div>
                      )}
                    </td>

                    {/* SI Value */}
                    <td className="py-3 px-4 align-top bg-blue-50/20 border-r border-slate-200">
                      <div className="p-2 rounded bg-white border border-slate-200/80 shadow-xs">
                        {renderDiffText(item.original_value.diff, true)}
                      </div>
                    </td>

                    {/* B/L Draft Value */}
                    <td className="py-3 px-4 align-top">
                      <div className="p-2 rounded bg-white border border-slate-200/80 shadow-xs">
                        {renderDiffText(item.program_value.diff, false)}
                      </div>
                      {/* Optional Note row if note exists */}
                      {note && (
                        <div className="mt-1.5 p-1.5 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900">
                          <span className="font-bold">{isTh ? 'บันทึกแก้ไข:' : 'Note:'}</span> {note}
                        </div>
                      )}
                    </td>

                    {/* Review Action */}
                    <td
                      className="py-3 px-3 align-top text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onToggleReviewed(item.field)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                          isReviewed
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                        title={isReviewed ? 'คลิกเพื่อยกเลิกการยืนยัน' : 'คลิกเพื่อยืนยันว่าตรวจสอบแล้ว'}
                      >
                        {isReviewed ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            {isTh ? 'ตรวจแล้ว' : 'Reviewed'}
                          </>
                        ) : (
                          <>
                            <FileEdit className="w-3.5 h-3.5" />
                            {isTh ? 'รอตรวจ' : 'Pending'}
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

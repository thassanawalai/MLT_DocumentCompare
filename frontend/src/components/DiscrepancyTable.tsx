import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  Mail,
  Eye,
  Filter,
} from 'lucide-react';
import { DiscrepancyItem, DiffChunk } from '../types/shipping';
import * as XLSX from 'xlsx';

interface DiscrepancyTableProps {
  discrepancies: DiscrepancyItem[];
  selectedField: string | null;
  onSelectField: (field: string) => void;
  bookingNo: string;
  carrierName: string;
  shipperName: string;
  language: 'th' | 'en';
}

export const DiscrepancyTable: React.FC<DiscrepancyTableProps> = ({
  discrepancies,
  selectedField,
  onSelectField,
  bookingNo,
  carrierName,
  shipperName,
  language,
}) => {
  const isTh = language === 'th';
  const [filter, setFilter] = useState<'all' | 'mismatch' | 'match' | 'critical'>('mismatch');
  const [showAmendmentModal, setShowAmendmentModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const total = discrepancies.length;
  const matches = discrepancies.filter((d) => d.isMatch);
  const mismatches = discrepancies.filter((d) => !d.isMatch);
  const criticalMismatches = mismatches.filter((d) => d.severity === 'critical');
  const warningMismatches = mismatches.filter((d) => d.severity === 'warning');

  const filteredItems = discrepancies.filter((d) => {
    if (filter === 'mismatch') return !d.isMatch;
    if (filter === 'match') return d.isMatch;
    if (filter === 'critical') return !d.isMatch && d.severity === 'critical';
    return true;
  });

  const renderDiffChunks = (chunks: DiffChunk[]) => {
    if (!chunks || chunks.length === 0) return <span className="text-slate-400 italic">EMPTY</span>;

    return (
      <span className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
        {chunks.map((chunk, idx) => {
          if (chunk.tag === 'equal') {
            return (
              <span key={idx} className="text-slate-700">
                {chunk.value}
              </span>
            );
          } else if (chunk.tag === 'delete') {
            return (
              <span
                key={idx}
                className="bg-rose-100 text-rose-800 line-through decoration-rose-500 font-bold px-1 py-0.5 rounded mx-0.5"
                title="Removed from SI"
              >
                {chunk.value}
              </span>
            );
          } else if (chunk.tag === 'insert') {
            return (
              <span
                key={idx}
                className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1 py-0.5 rounded mx-0.5"
                title="Added in B/L Draft"
              >
                {chunk.value}
              </span>
            );
          }
          return chunk.value;
        })}
      </span>
    );
  };

  const exportToExcel = () => {
    const reportData = discrepancies.map((d) => ({
      'Field Code': d.field,
      'Field Name (EN)': d.fieldNameEn,
      'Field Name (TH)': d.fieldNameTh,
      Category: d.category.toUpperCase(),
      Severity: d.severity.toUpperCase(),
      Status: d.isMatch ? 'MATCH' : 'DISCREPANCY',
      'SI Value (Program)': d.program_value.clean_value,
      'BL Draft Value (Carrier)': d.original_value.clean_value,
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Discrepancy_Audit');
    XLSX.writeFile(workbook, `MLT_Compare_${bookingNo || 'Report'}_${Date.now()}.xlsx`);
  };

  const generateAmendmentEmailText = () => {
    const criticalList = mismatches.map((d, i) => {
      return `${i + 1}. [FIELD: ${d.fieldNameEn}]\n   - CURRENT ON B/L DRAFT: "${
        d.original_value.clean_value || 'BLANK'
      }"\n   - CORRECT PER SI:       "${
        d.program_value.clean_value
      }"\n   - ACTION REQUIRED:      Please amend according to SI instruction.\n`;
    });

    return `TO: ${carrierName} Documentation / Liner Operations Team
FROM: Maritime Alliance / Export Documentation Team
DATE: ${new Date().toLocaleDateString('en-GB')}
SUBJECT: URGENT: B/L DRAFT AMENDMENT REQUEST // BOOKING NO: ${bookingNo} // SHIPPER: ${shipperName}

Dear ${carrierName} Documentation Team,

Please be advised that we have reviewed the Draft Bill of Lading for the subject shipment and identified ${
      mismatches.length
    } discrepancy(ies) against our approved Shipping Instruction (S.I.).

Please urgently amend the B/L Draft as per the details below before the documentation cut-off:

----------------------------------------------------------------------
SHIPMENT DETAILS:
- Booking Reference: ${bookingNo}
- Shipper: ${shipperName}
- Carrier: ${carrierName}
----------------------------------------------------------------------

AMENDMENT PARTICULARS:
${criticalList.join('\n')}
----------------------------------------------------------------------

Please issue and upload the revised B/L draft at your earliest convenience to avoid customs manifest penalties and clearance delays.

Thank you for your prompt assistance.

Best regards,
Maritime Documentation & Verification Center
MLT Document Compare System`;
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generateAmendmentEmailText());
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-5">
      {/* KPI & Summary Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isTh ? 'จำนวนฟิลด์ที่ตรวจ' : 'Total Checked'}
          </div>
          <div className="text-xl font-black text-slate-800 mt-1">{total}</div>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isTh ? 'ข้อมูลตรงกัน 100%' : 'Exact Matches'}
          </div>
          <div className="text-xl font-black text-emerald-800 mt-1">{matches.length}</div>
        </div>

        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {isTh ? 'จุดต่างระดับวิกฤต' : 'Critical Mismatches'}
          </div>
          <div className="text-xl font-black text-rose-800 mt-1">{criticalMismatches.length}</div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {isTh ? 'จุดต่างระดับเตือน' : 'Warnings'}
          </div>
          <div className="text-xl font-black text-amber-800 mt-1">{warningMismatches.length}</div>
        </div>
      </div>

      {/* Action Bar & Filter Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setFilter('mismatch')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'mismatch'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isTh ? 'เฉพาะจุดต่าง' : 'Discrepancies'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-700/80 text-white">
              {mismatches.length}
            </span>
          </button>

          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'critical'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{isTh ? 'วิกฤต (Critical)' : 'Critical Only'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-800 text-white">
              {criticalMismatches.length}
            </span>
          </button>

          <button
            onClick={() => setFilter('match')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'match'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isTh ? 'เฉพาะที่ตรงกัน' : 'Matches'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700/80 text-white">
              {matches.length}
            </span>
          </button>

          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isTh ? 'ทั้งหมด' : 'All Fields'} ({total})
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {mismatches.length > 0 && (
            <button
              onClick={() => setShowAmendmentModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isTh ? 'ร่างอีเมลแก้ B/L สายเรือ' : 'Draft B/L Amendment'}</span>
            </button>
          )}

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isTh ? 'ส่งออก Excel / CSV' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* Discrepancy Matrix Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-800 text-white text-[11px] font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3 w-48">{isTh ? 'ฟิลด์ข้อมูล' : 'Field'}</th>
              <th className="py-2.5 px-3 w-28 text-center">{isTh ? 'สถานะ' : 'Status'}</th>
              <th className="py-2.5 px-3 w-[36%] bg-sky-950/60 text-sky-200">
                {isTh ? 'เอกสาร SI (Shipping Instruction)' : 'Program Document (SI)'}
              </th>
              <th className="py-2.5 px-3 w-[36%] bg-emerald-950/60 text-emerald-200">
                {isTh ? 'เอกสาร B/L Draft (จากสายเรือ)' : 'Original Document (B/L Draft)'}
              </th>
              <th className="py-2.5 px-3 w-16 text-center">{isTh ? 'พรีวิว' : 'View'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                  {isTh ? 'ไม่พบรายการตามตัวกรองนี้' : 'No records match this filter.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = selectedField === item.field;
                return (
                  <tr
                    key={item.field}
                    onClick={() => onSelectField(item.field)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 ring-1 ring-blue-400'
                        : !item.isMatch
                        ? 'hover:bg-rose-50/40'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">
                      {index + 1}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">
                        {isTh ? item.fieldNameTh : item.fieldNameEn}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">{item.field}</div>
                      <span
                        className={`inline-block text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold mt-0.5 ${
                          item.severity === 'critical'
                            ? 'bg-rose-100 text-rose-700'
                            : item.severity === 'warning'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {item.isMatch ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          {isTh ? 'ตรงกัน' : 'MATCH'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          {isTh ? 'ต่างกัน' : 'MISMATCH'}
                        </span>
                      )}
                    </td>

                    {/* SI Value */}
                    <td className="py-2.5 px-3 bg-sky-50/20">
                      {renderDiffChunks(item.program_value.diff)}
                    </td>

                    {/* BL Draft Value */}
                    <td className="py-2.5 px-3 bg-emerald-50/20">
                      {renderDiffChunks(item.original_value.diff)}
                    </td>

                    {/* Action View */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectField(item.field);
                        }}
                        title={isTh ? 'ชี้เป้าบนเอกสาร' : 'Spotlight on Document'}
                        className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Official Amendment Email */}
      {showAmendmentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {isTh ? 'ร่างอีเมลแจ้งแก้ไข B/L Draft ให้กับสายเรือ' : 'Draft B/L Amendment Telex'}
                </h3>
              </div>
              <button
                onClick={() => setShowAmendmentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 my-2">
              {isTh
                ? 'ระบบประมวลผลจุดต่างที่ตรวจพบ แล้วสร้างร่างคำขอแก้ไข B/L ตามมาตรฐานเอกสารพาณิชย์นาวี คุณสามารถคัดลอกส่งทาง Email / Telex ให้สายเรือได้ทันที'
                : 'Generated maritime amendment notice citing all discrepant fields. Ready to copy & paste to carrier ops.'}
            </p>

            <textarea
              readOnly
              value={generateAmendmentEmailText()}
              rows={14}
              className="w-full text-xs font-mono p-3 bg-slate-900 text-emerald-400 rounded-lg border border-slate-800 leading-relaxed overflow-y-auto"
            />

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-3">
              <span className="text-xs text-slate-500">
                {isTh ? `พบจุดต่างทั้งหมด ${mismatches.length} จุด` : `${mismatches.length} fields flagged`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAmendmentModal(false)}
                  className="px-3 py-1.5 text-xs rounded text-slate-600 hover:bg-slate-100 font-medium"
                >
                  {isTh ? 'ปิด' : 'Close'}
                </button>
                <button
                  onClick={handleCopyEmail}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition-colors"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? (isTh ? 'คัดลอกเรียบร้อย!' : 'Copied!') : (isTh ? 'คัดลอกข้อความทั้งหมด' : 'Copy Full Draft')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

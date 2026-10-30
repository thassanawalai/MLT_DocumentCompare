import React, { useState, useEffect, useMemo } from 'react';
import { Search, Hash, FileSpreadsheet, Download, Filter, PackageCheck } from 'lucide-react';
import { loadHSCodes } from '../services/masterData';
import { HSCodeRecord } from '../types/shipping';
import * as XLSX from 'xlsx';

interface HSCodeDirectoryProps {
  language: 'th' | 'en';
}

export const HSCodeDirectory: React.FC<HSCodeDirectoryProps> = ({ language }) => {
  const isTh = language === 'th';
  const [records, setRecords] = useState<HSCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSales, setSelectedSales] = useState('ALL');

  useEffect(() => {
    loadHSCodes().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  const salesOptions = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.sales && r.sales !== '-') set.add(r.sales);
    });
    return Array.from(set);
  }, [records]);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return records.filter((r) => {
      const matchSales = selectedSales === 'ALL' || r.sales === selectedSales;
      const matchText =
        !term ||
        r.customerName.toLowerCase().includes(term) ||
        r.commodity.toLowerCase().includes(term) ||
        r.hsCode.toLowerCase().includes(term) ||
        r.sales.toLowerCase().includes(term);
      return matchSales && matchText;
    });
  }, [records, searchTerm, selectedSales]);

  const exportFiltered = () => {
    const exportData = filteredRecords.map((r) => ({
      Sales: r.sales,
      'Customer Name': r.customerName,
      Commodity: r.commodity,
      'HS Code': r.hsCode,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HS_Codes');
    XLSX.writeFile(wb, `HS_Codes_Master_${Date.now()}.xlsx`);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Hash className="w-3.5 h-3.5" />
            <span>Master Data</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {isTh ? 'สมุดทะเบียนพิกัดศุลกากร (HS Code Directory)' : 'HS Code Master Database'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTh
              ? 'ค้นหาพิกัดรหัสศุลกากรของสินค้าแต่ละลูกค้าและประเภทสินค้า เพื่อใช้ตรวจสอบกับเอกสาร SI และ B/L'
              : 'Official Harmonized System tariff codes mapped by commodity and client accounts.'}
          </p>
        </div>

        <button
          onClick={exportFiltered}
          disabled={loading || filteredRecords.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>{isTh ? 'ส่งออก Excel' : 'Export Excel'}</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isTh
                ? 'ค้นหาด้วยชื่อลูกค้า, สินค้า, หรือรหัส HS Code...'
                : 'Search by Customer, Commodity, or HS Code...'
            }
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedSales}
            onChange={(e) => setSelectedSales(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">{isTh ? 'ทุกฝ่ายขาย (All Sales)' : 'All Sales'}</option>
            {salesOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>
            {isTh
              ? `พบทั้งหมด ${filteredRecords.length.toLocaleString()} รายการ (จาก ${records.length.toLocaleString()} รายการ)`
              : `Showing ${filteredRecords.length.toLocaleString()} of ${records.length.toLocaleString()} entries`}
          </span>
          {loading && <span className="text-blue-600 animate-pulse">กำลังโหลดฐานข้อมูล...</span>}
        </div>

        <div className="overflow-x-auto max-h-[600px]">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-800 text-white text-[11px] font-semibold uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3 w-28">Sales / Owner</th>
                <th className="py-2.5 px-4 w-72">{isTh ? 'ชื่อลูกค้า (Customer)' : 'Customer Name'}</th>
                <th className="py-2.5 px-4">{isTh ? 'รายการสินค้า (Commodity)' : 'Commodity'}</th>
                <th className="py-2.5 px-4 w-36 font-mono text-center">HS Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                    {isTh ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'No records found.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.slice(0, 200).map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {i + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                        {r.sales}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{r.customerName}</td>
                    <td className="py-2.5 px-4 text-slate-700">{r.commodity}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 text-xs">
                        {r.hsCode}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

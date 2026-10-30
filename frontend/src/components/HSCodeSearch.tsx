import React, { useState, useEffect, useMemo } from 'react';
import { Search, Hash, Building2, Package, Download, Filter, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { loadHSCodes } from '../services/masterData';
import { HSCodeRecord } from '../types/shipping';

interface HSCodeSearchProps {
  language: 'th' | 'en';
}

export const HSCodeSearch: React.FC<HSCodeSearchProps> = ({ language }) => {
  const isTh = language === 'th';
  const [records, setRecords] = useState<HSCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedSales, setSelectedSales] = useState<string>('all');

  useEffect(() => {
    loadHSCodes().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  const salesTeamList = useMemo(() => {
    const list = Array.from(new Set(records.map((r) => r.sales).filter(Boolean)));
    return list.sort();
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (selectedSales !== 'all' && r.sales !== selectedSales) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        r.hsCode.toLowerCase().includes(q) ||
        r.commodity.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.sales.toLowerCase().includes(q)
      );
    });
  }, [records, query, selectedSales]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((r) => ({
        'No.': r.id,
        'Sales In Charge': r.sales,
        'Customer Name': r.customerName,
        'Commodity / Goods Description': r.commodity,
        'Harmonized Code (HS Code)': r.hsCode,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HS_Code_Master');
    XLSX.writeFile(wb, 'HS_Code_Master_Export.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                {isTh ? 'ฐานข้อมูลหลักศุลกากร' : 'Customs Tariff Master'}
              </span>
              <span className="text-xs text-slate-400">
                {records.length} {isTh ? 'พิกัดในระบบ' : 'Total Items'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isTh ? 'ค้นหาพิกัดศุลกากร HS Code' : 'Harmonized System (HS) Code Master'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isTh
                ? 'ค้นหาพิกัดตามชื่อสินค้า, รหัส 8-10 หลัก, ชื่อลูกค้า หรือทีม Sales ผู้ดูแล'
                : 'Search tariff classifications, descriptions, and linked customer products'}
            </p>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl border border-emerald-600 transition-colors shadow"
          >
            <Download className="w-4 h-4" />
            <span>{isTh ? 'ส่งออกเป็น Excel' : 'Export Excel'}</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={isTh ? 'พิมพ์รหัส เช่น 3920, หรือพิมพ์ชื่อสินค้า เช่น film, rubber, rice...' : 'Search HS Code, commodity or customer...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedSales}
              onChange={(e) => setSelectedSales(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">{isTh ? 'ทีม Sales: ทั้งหมด' : 'Sales Team: All'}</option>
              {salesTeamList.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-3 px-4 w-14">#</th>
                <th className="py-3 px-4 w-40">{isTh ? 'พิกัด HS Code' : 'HS Code'}</th>
                <th className="py-3 px-4 flex-1">{isTh ? 'รายละเอียดสินค้า (Commodity)' : 'Commodity'}</th>
                <th className="py-3 px-4 w-60">{isTh ? 'ลูกค้าที่ใช้' : 'Customer Name'}</th>
                <th className="py-3 px-4 w-28">{isTh ? 'ผู้ดูแล' : 'Sales Team'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
                    กำลังโหลดฐานข้อมูล...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    ไม่พบข้อมูลที่ตรงกับคำค้นหา
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 100).map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 font-sans">{i + 1}</td>
                    <td className="py-2.5 px-4 font-bold text-sky-400">
                      <span className="bg-sky-950/60 border border-sky-800/80 px-2 py-0.5 rounded text-xs">
                        {r.hsCode}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-200 font-sans">{r.commodity}</td>
                    <td className="py-2.5 px-4 text-slate-300 font-sans font-medium">{r.customerName}</td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px]">
                        {r.sales}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div className="p-3 bg-slate-950 text-center text-xs text-slate-400 border-t border-slate-800">
            {isTh
              ? `แสดงผล 100 รายการแรกจากทั้งหมด ${filtered.length} รายการ (พิมพ์คำค้นเพื่อเจาะจงผลลัพธ์)`
              : `Showing first 100 of ${filtered.length} items`}
          </div>
        )}
      </div>
    </div>
  );
};

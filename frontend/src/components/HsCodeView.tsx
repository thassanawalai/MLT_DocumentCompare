import React, { useState, useEffect } from 'react';
import { Search, Copy, Check, Filter, BookOpen, Layers, Download } from 'lucide-react';
import { HSCodeRecord } from '../types/shipping';
import { loadHSCodes } from '../services/masterData';

interface HsCodeViewProps {
  language: 'th' | 'en';
}

export const HsCodeView: React.FC<HsCodeViewProps> = ({ language }) => {
  const isTh = language === 'th';
  const [records, setRecords] = useState<HSCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSales, setSelectedSales] = useState('ALL');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const pageSize = 20;

  useEffect(() => {
    let mounted = true;
    loadHSCodes().then((data) => {
      if (mounted) {
        setRecords(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const salesList = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.sales && r.sales !== '-') set.add(r.sales);
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [records]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return records.filter((r) => {
      if (selectedSales !== 'ALL' && r.sales !== selectedSales) return false;
      if (!q) return true;
      return (
        r.commodity.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.hsCode.toLowerCase().includes(q) ||
        r.sales.toLowerCase().includes(q)
      );
    });
  }, [records, search, selectedSales]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleCopy = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = 'Sales,Customer Name,Commodity,HS Code\n';
    const rows = filtered
      .map(
        (r) =>
          `"${r.sales.replace(/"/g, '""')}","${r.customerName.replace(/"/g, '""')}","${r.commodity.replace(
            /"/g,
            '""'
          )}","${r.hsCode.replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HS_Codes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Search className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              {isTh ? 'ฐานข้อมูลพิกัดศุลกากร HS Code Master' : 'HS Code Master Directory'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isTh
              ? 'รวบรวมรหัสพิกัดศุลกากรสินค้าส่งออก 1,100+ รายการ แยกตามประเภทสินค้าและลูกค้า สำหรับใส่ใน SI และ B/L'
              : 'Search across 1,100+ export commodity HS Codes to ensure exact customs alignment.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isTh ? 'ส่งออก CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={
              isTh
                ? 'ค้นหาชื่อสินค้า (เช่น Polyethylene, Frozen Chicken), ลูกค้า, หรือ HS Code...'
                : 'Search commodity, client name, or HS Code...'
            }
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sales Rep Filter */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <span className="text-xs text-slate-500 whitespace-nowrap">{isTh ? 'ฝ่ายขาย:' : 'Sales:'}</span>
          <select
            value={selectedSales}
            onChange={(e) => {
              setSelectedSales(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {salesList.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? (isTh ? 'ทั้งหมด (All Sales)' : 'All Sales') : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-44">{isTh ? 'รหัส HS Code' : 'HS Code'}</th>
                <th className="py-3 px-4">{isTh ? 'ชื่อสินค้า (Commodity)' : 'Commodity Description'}</th>
                <th className="py-3 px-4 w-60">{isTh ? 'ลูกค้า (Customer / Shipper)' : 'Customer / Shipper'}</th>
                <th className="py-3 px-4 w-28 text-center">{isTh ? 'ฝ่ายขาย' : 'Sales'}</th>
                <th className="py-3 px-4 w-24 text-center">{isTh ? 'การทำงาน' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    {isTh ? 'กำลังโหลดฐานข้อมูล 1,100+ รายการ...' : 'Loading master HS code records...'}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {isTh ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'No matching records found'}
                  </td>
                </tr>
              ) : (
                paginated.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80 text-xs">
                        {r.hsCode}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{r.commodity}</td>
                    <td className="py-2.5 px-4 text-slate-600">{r.customerName}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {r.sales}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleCopy(r.id, r.hsCode)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                      >
                        {copiedId === r.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">{isTh ? 'คัดลอก' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>{isTh ? 'คัดลอก' : 'Copy'}</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            {isTh ? 'แสดง' : 'Showing'}{' '}
            <strong>
              {filtered.length > 0 ? (page - 1) * pageSize + 1 : 0} -{' '}
              {Math.min(page * pageSize, filtered.length)}
            </strong>{' '}
            {isTh ? 'จากทั้งหมด' : 'of'} <strong>{filtered.length}</strong> {isTh ? 'รายการ' : 'records'}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs disabled:opacity-40 hover:bg-slate-100"
            >
              {isTh ? 'ก่อนหน้า' : 'Prev'}
            </button>
            <span className="px-2 font-mono text-xs">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs disabled:opacity-40 hover:bg-slate-100"
            >
              {isTh ? 'ถัดไป' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

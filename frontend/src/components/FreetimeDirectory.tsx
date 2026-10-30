import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Search, Calculator, Calendar, ShieldCheck, AlertCircle, Ship } from 'lucide-react';
import { loadFreetimeData } from '../services/masterData';
import { FreetimeRecord } from '../types/shipping';

interface FreetimeDirectoryProps {
  language: 'th' | 'en';
}

export const FreetimeDirectory: React.FC<FreetimeDirectoryProps> = ({ language }) => {
  const isTh = language === 'th';
  const [records, setRecords] = useState<FreetimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculator states
  const [calcCarrier, setCalcCarrier] = useState('ONE');
  const [calcPort, setCalcPort] = useState<'latKrabang' | 'laemChabang' | 'patBangkok'>('laemChabang');
  const [calcType, setCalcType] = useState<'dry' | 'reefer'>('dry');
  const [arrivalDate, setArrivalDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    loadFreetimeData().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return records;
    return records.filter(
      (r) =>
        r.carrier.toLowerCase().includes(term) ||
        r.latKrabang.toLowerCase().includes(term) ||
        r.laemChabang.toLowerCase().includes(term) ||
        r.remark.toLowerCase().includes(term)
    );
  }, [records, searchTerm]);

  // Unique carrier list for calculator
  const carriers = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.carrier && r.carrier !== '-') set.add(r.carrier);
    });
    return Array.from(set);
  }, [records]);

  // Calculate free days
  const calculationResult = useMemo(() => {
    const matched = records.find(
      (r) => r.carrier.toUpperCase() === calcCarrier.toUpperCase()
    );

    let freeDays = 7; // Default safe standard
    if (matched) {
      const portVal = matched[calcPort];
      const matchDays = portVal.match(/(\d+)\s*DAYS/i);
      if (matchDays) {
        freeDays = parseInt(matchDays[1], 10);
      } else if (calcType === 'reefer') {
        const reeferDays = matched.reefer.match(/(\d+)\s*DAYS/i);
        if (reeferDays) freeDays = parseInt(reeferDays[1], 10);
        else freeDays = 4;
      }
    }

    if (!arrivalDate) return null;

    const arr = new Date(arrivalDate);
    const lastFreeDate = new Date(arr);
    lastFreeDate.setDate(arr.getDate() + freeDays);

    const today = new Date();
    const diffTime = lastFreeDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      carrier: calcCarrier,
      freeDays,
      lastFreeDate: lastFreeDate.toLocaleDateString(isTh ? 'th-TH' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      daysRemaining: diffDays,
      isExpired: diffDays < 0,
    };
  }, [calcCarrier, calcPort, calcType, arrivalDate, records, isTh]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Carrier Tariffs & Demurrage</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {isTh ? 'ตาราง Freetime และเครื่องคำนวณวันปลอดค่าลานตู้' : 'Port Freetime & Demurrage Directory'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTh
              ? 'เช็กจำนวนวันฟรีตู้ (Free Time) ของแต่ละสายเรือแยกตามท่าเรือ เพื่อป้องกันค่าปรับ Demurrage & Detention'
              : 'Carrier free time allowances across Lat Krabang, Laem Chabang, Bangkok PAT, and Reefer plugs.'}
          </p>
        </div>
      </div>

      {/* Interactive Demurrage / Detention Calculator */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-xl p-5 text-white shadow-md border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-sky-400" />
          <h3 className="font-bold text-sm text-white">
            {isTh
              ? 'เครื่องคำนวณวันหมดอายุวันปลอดค่าใช้จ่าย (Last Free Day Calculator)'
              : 'Interactive Last Free Day (LFD) Calculator'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              {isTh ? 'สายเรือ (Carrier)' : 'Carrier'}
            </label>
            <select
              value={calcCarrier}
              onChange={(e) => setCalcCarrier(e.target.value)}
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              {carriers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              {isTh ? 'ท่าเรือ (Port)' : 'Port'}
            </label>
            <select
              value={calcPort}
              onChange={(e) => setCalcPort(e.target.value as any)}
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="laemChabang">Laem Chabang (แหลมฉบัง)</option>
              <option value="latKrabang">Lat Krabang (ลาดกระบัง ICD)</option>
              <option value="patBangkok">Bangkok PAT (คลองเตย)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              {isTh ? 'ประเภทตู้ (Container Type)' : 'Container Type'}
            </label>
            <select
              value={calcType}
              onChange={(e) => setCalcType(e.target.value as any)}
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="dry">Dry 20'GP & 40'HC</option>
              <option value="reefer">Reefer Container (ตู้เย็น RF)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              {isTh ? 'วันเรือเทียบ / วันคืนตู้ (ETD / Arrival)' : 'Discharge / ETD Date'}
            </label>
            <input
              type="date"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {calculationResult && (
          <div className="bg-slate-800/90 border border-slate-700 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">{isTh ? 'สิทธิวันฟรี:' : 'Free Time Allowed:'}</span>
              <span className="px-2.5 py-0.5 rounded bg-blue-500 text-white font-black">
                {calculationResult.freeDays} {isTh ? 'วัน' : 'Days'}
              </span>
              <span className="text-slate-400">{isTh ? 'วันหมดเขตปลอดค่าปรับ:' : 'Last Free Day:'}</span>
              <span className="font-mono font-bold text-sky-300 text-sm">
                {calculationResult.lastFreeDate}
              </span>
            </div>

            <div>
              {calculationResult.isExpired ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 text-white font-bold rounded-lg shadow animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {isTh
                    ? `เกินกำหนดแล้ว ${Math.abs(calculationResult.daysRemaining)} วัน (คิดค่าปรับ Demurrage แล้ว)`
                    : `EXPIRED: ${Math.abs(calculationResult.daysRemaining)} days overdue (Demurrage applying)`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg shadow">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isTh
                    ? `เหลือเวลาอีก ${calculationResult.daysRemaining} วัน`
                    : `${calculationResult.daysRemaining} days remaining`}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Master Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isTh ? 'ค้นหาสายเรือ หรือ ท่าเรือ...' : 'Filter carrier or port...'}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {records.length} {isTh ? 'สายเรือในฐานข้อมูล' : 'Carriers on record'}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-800 text-white text-[11px] font-semibold uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-4 w-36">Carrier</th>
                <th className="py-2.5 px-3">Lat Krabang</th>
                <th className="py-2.5 px-3">Laem Chabang</th>
                <th className="py-2.5 px-3">PAT (Bangkok)</th>
                <th className="py-2.5 px-3">Reefer (ตู้เย็น)</th>
                <th className="py-2.5 px-3">Dem 20/40</th>
                <th className="py-2.5 px-3">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredRecords.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-900">{r.carrier}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{r.latKrabang}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{r.laemChabang}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{r.patBangkok}</td>
                  <td className="py-2.5 px-3 font-mono text-blue-700">{r.reefer}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{r.dem2040}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">{r.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

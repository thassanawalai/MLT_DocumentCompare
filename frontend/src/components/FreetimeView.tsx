import React, { useState, useEffect } from 'react';
import { Clock, Calculator, ShieldAlert, CheckCircle, Search, HelpCircle } from 'lucide-react';
import { FreetimeRecord } from '../types/shipping';
import { loadFreetimeData } from '../services/masterData';

interface FreetimeViewProps {
  language: 'th' | 'en';
}

export const FreetimeView: React.FC<FreetimeViewProps> = ({ language }) => {
  const isTh = language === 'th';
  const [records, setRecords] = useState<FreetimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Interactive Calculator State
  const [calcCarrier, setCalcCarrier] = useState('ONE');
  const [calcPort, setCalcPort] = useState('LAEM_CHABANG');
  const [calcType, setCalcType] = useState<'DRY' | 'REEFER'>('DRY');
  const [calcQuantity, setCalcQuantity] = useState(2);
  const [dischargeDate, setDischargeDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 8);
    return d.toISOString().slice(0, 10);
  });
  const [returnDate, setReturnDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  useEffect(() => {
    let mounted = true;
    loadFreetimeData().then((data) => {
      if (mounted) {
        setRecords(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = records.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.carrier.toLowerCase().includes(q) ||
      r.remark.toLowerCase().includes(q) ||
      r.latKrabang.toLowerCase().includes(q) ||
      r.laemChabang.toLowerCase().includes(q)
    );
  });

  // Calculate Days & Penalty
  const calcResult = React.useMemo(() => {
    const start = new Date(dischargeDate).getTime();
    const end = new Date(returnDate).getTime();
    const diffTime = Math.max(0, end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive

    // Typical port free days by port/type
    const freeDays = calcType === 'REEFER' ? 3 : calcPort === 'LAT_KRABANG' ? 5 : 7;
    const overstayDays = Math.max(0, totalDays - freeDays);

    // Approximate tariff per container per day (THB)
    const dailyRate = calcType === 'REEFER' ? 2400 : 800;
    const totalCostTHB = overstayDays * dailyRate * calcQuantity;

    return {
      totalDays,
      freeDays,
      overstayDays,
      dailyRate,
      totalCostTHB,
    };
  }, [dischargeDate, returnDate, calcPort, calcType, calcQuantity]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              {isTh ? 'ตารางวันปลอดค่าเช่าตู้สินค้า (Port & Carrier Freetime)' : 'Port & Carrier Freetime Schedule'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isTh
              ? 'ตรวจสอบจำนวนวัน Freetime, เงื่อนไข Demurrage / Detention ของแต่ละสายเรือในท่าเรือลาดกระบัง แหลมฉบัง และคลองเตย'
              : 'Official free days and detention/demurrage rules across major Thai ports and shipping lines.'}
          </p>
        </div>
      </div>

      {/* Interactive Demurrage / Detention Calculator */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md border border-indigo-900/50">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-base">
            {isTh ? 'เครื่องคำนวณวันปลอดค่าปรับตู้สินค้า (Freetime & Overstay Calculator)' : 'Interactive Demurrage & Detention Calculator'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {isTh ? 'สายเรือ (Carrier):' : 'Shipping Carrier:'}
            </label>
            <select
              value={calcCarrier}
              onChange={(e) => setCalcCarrier(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ONE">ONE (Ocean Network Express)</option>
              <option value="OOCL">OOCL</option>
              <option value="WANHAI">Wan Hai Lines</option>
              <option value="HAPAG">Hapag-Lloyd</option>
              <option value="MAERSK">Maersk Line</option>
              <option value="EVERGREEN">Evergreen Marine</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {isTh ? 'ท่าเรือ / สถานีรับมอบ:' : 'Discharge Port:'}
            </label>
            <select
              value={calcPort}
              onChange={(e) => setCalcPort(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="LAEM_CHABANG">แหลมฉบัง (Laem Chabang)</option>
              <option value="LAT_KRABANG">ICD ลาดกระบัง (Lat Krabang)</option>
              <option value="PAT_BANGKOK">กรุงเทพ คลองเตย (PAT Bangkok)</option>
              <option value="SONGKHLA">สงขลา (Songkhla)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {isTh ? 'ประเภทตู้สินค้า:' : 'Container Type:'}
            </label>
            <select
              value={calcType}
              onChange={(e) => setCalcType(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="DRY">ตู้แห้งทั่วไป (Dry 20'/40' GP/HQ)</option>
              <option value="REEFER">ตู้แช่เย็น (Reefer RF 40')</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {isTh ? 'วันที่เรือเข้าเทียบ / ปลดตู้:' : 'Discharge Date:'}
            </label>
            <input
              type="date"
              value={dischargeDate}
              onChange={(e) => setDischargeDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {isTh ? 'วันที่คืนตู้เปล่าเข้าลาน:' : 'Return Empty Date:'}
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Calculation Result Strip */}
        <div className="mt-5 p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {isTh ? 'จำนวนวันทั้งหมด' : 'Total Days Used'}
            </span>
            <div className="text-xl font-black text-white">{calcResult.totalDays} {isTh ? 'วัน' : 'Days'}</div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {isTh ? 'วันปลอดค่าเช่า (Free Time)' : 'Free Days Allowed'}
            </span>
            <div className="text-xl font-black text-emerald-400">{calcResult.freeDays} {isTh ? 'วัน' : 'Days'}</div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {isTh ? 'จำนวนวันเกินกำหนด (Overstay)' : 'Overstay Days'}
            </span>
            <div
              className={`text-xl font-black ${
                calcResult.overstayDays > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {calcResult.overstayDays} {isTh ? 'วัน' : 'Days'}
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {isTh ? 'ประมาณการค่าปรับ (Est. Demurrage)' : 'Est. Demurrage Fee'}
            </span>
            <div className="text-xl font-black text-amber-400">
              {calcResult.totalCostTHB.toLocaleString()} THB
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isTh ? 'ค้นหาสายเรือ, หมายเหตุ, หรือเงื่อนไขท่าเรือ...' : 'Filter carriers or port remarks...'}
          className="flex-1 bg-transparent text-xs text-slate-900 focus:outline-none"
        />
      </div>

      {/* Master Freetime Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-40">{isTh ? 'สายเรือ (Carrier)' : 'Carrier'}</th>
                <th className="py-3 px-3 text-center w-28 bg-blue-50/50">ลาดกระบัง (ICD)</th>
                <th className="py-3 px-3 text-center w-28 bg-emerald-50/50">แหลมฉบัง (LCB)</th>
                <th className="py-3 px-3 text-center w-28 bg-purple-50/50">คลองเตย (PAT)</th>
                <th className="py-3 px-3 text-center w-28">ตู้เย็น (Reefer)</th>
                <th className="py-3 px-4">{isTh ? 'เงื่อนไขและหมายเหตุ (Remark)' : 'Rules & Remarks'}</th>
                <th className="py-3 px-3 text-right w-36">{isTh ? 'Demurrage 20/40' : 'Demurrage Tariff'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    {isTh ? 'กำลังโหลดข้อมูล Freetime...' : 'Loading freetime records...'}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {isTh ? 'ไม่พบข้อมูล' : 'No matching records found'}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        {r.carrier}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-blue-800 bg-blue-50/30">
                      {r.latKrabang}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-800 bg-emerald-50/30">
                      {r.laemChabang}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-purple-800 bg-purple-50/30">
                      {r.patBangkok}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700">
                      {r.reefer}
                    </td>
                    <td className="py-3 px-4 text-slate-600 leading-relaxed text-[11px]">
                      {r.remark}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 text-[11px]">
                      {r.dem2040 !== '-' ? r.dem2040 : r.dt2040}
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

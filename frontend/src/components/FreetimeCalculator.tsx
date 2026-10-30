import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Calculator, Ship, AlertCircle, Calendar, CheckCircle } from 'lucide-react';
import { loadFreetimeData } from '../services/masterData';
import { FreetimeRecord } from '../types/shipping';

interface FreetimeCalculatorProps {
  language: 'th' | 'en';
}

export const FreetimeCalculator: React.FC<FreetimeCalculatorProps> = ({ language }) => {
  const isTh = language === 'th';
  const [records, setRecords] = useState<FreetimeRecord[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('ALL');
  const [dischargeDate, setDischargeDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [returnDate, setReturnDate] = useState<string>(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );
  const [freeDaysAllowed, setFreeDaysAllowed] = useState<number>(7);
  const [ratePerDay, setRatePerDay] = useState<number>(1500);

  useEffect(() => {
    loadFreetimeData().then(setRecords);
  }, []);

  const carriers = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.carrier).filter(Boolean)));
  }, [records]);

  const filtered = useMemo(() => {
    if (selectedCarrier === 'ALL') return records;
    return records.filter((r) => r.carrier === selectedCarrier);
  }, [records, selectedCarrier]);

  // Calculation
  const totalDaysUsed = useMemo(() => {
    const d1 = new Date(dischargeDate).getTime();
    const d2 = new Date(returnDate).getTime();
    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [dischargeDate, returnDate]);

  const overstayDays = Math.max(0, totalDaysUsed - freeDaysAllowed);
  const estimatedDemurrage = overstayDays * ratePerDay;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30">
            {isTh ? 'การคำนวณและกฎสายเรือ' : 'Demurrage & Detention'}
          </span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          {isTh ? 'ตารางเวลาปลอดค่าระวางตู้ (Port Freetime) และเครื่องคิดค่าปรับ' : 'Port Freetime & Demurrage Calculator'}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          {isTh
            ? 'ตรวจสอบจำนวนวัน Freetime แต่ละท่าเรือ (แหลมฉบัง, ลาดกระบัง, ท่าเรือกรุงเทพ PAT, สงขลา) และคำนวณค่าธรรมเนียมตู้ค้างท่า/เกินกำหนด'
            : 'Look up carrier-specific free time rules across Thai ports and estimate demurrage charges'}
        </p>
      </div>

      {/* Calculator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>{isTh ? 'เครื่องมือจำลองคำนวณค่าปรับ' : 'Charge Estimator'}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isTh ? 'วันที่เรือเข้าเทียบ/ยกตู้ลง (Discharge Date)' : 'Discharge Date'}
            </label>
            <input
              type="date"
              value={dischargeDate}
              onChange={(e) => setDischargeDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isTh ? 'วันที่คืนตู้เปล่า/รับของ (Return Date)' : 'Empty Return Date'}
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isTh ? 'วันฟรี (วัน)' : 'Free Days'}
              </label>
              <input
                type="number"
                value={freeDaysAllowed}
                onChange={(e) => setFreeDaysAllowed(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isTh ? 'อัตรา/วัน (บาท)' : 'Rate / Day (THB)'}
              </label>
              <input
                type="number"
                value={ratePerDay}
                onChange={(e) => setRatePerDay(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 mt-4">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">{isTh ? 'ระยะเวลาใช้งานจริง:' : 'Actual Used:'}</span>
              <span className="font-bold text-white">{totalDaysUsed} {isTh ? 'วัน' : 'days'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">{isTh ? 'จำนวนวันที่เกินกำหนด:' : 'Overstay:'}</span>
              <span className={`font-bold ${overstayDays > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {overstayDays} {isTh ? 'วัน' : 'days'}
              </span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-300">
                {isTh ? 'ประมาณการค่าปรับ Demurrage:' : 'Est. Demurrage:'}
              </span>
              <span className="text-lg font-black text-amber-400 font-mono">
                ฿{estimatedDemurrage.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Rules Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white text-xs">
                {isTh ? 'ข้อกำหนด Freetime แยกตามสายเรือ' : 'Carrier Freetime Master Table'}
              </h3>
            </div>
            <select
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300"
            >
              <option value="ALL">{isTh ? 'ทุกสายเรือ (All Carriers)' : 'All Carriers'}</option>
              {carriers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-3">{isTh ? 'สายเรือ' : 'Carrier'}</th>
                  <th className="py-2.5 px-3">ลาดกระบัง (ICD)</th>
                  <th className="py-2.5 px-3">แหลมฉบัง</th>
                  <th className="py-2.5 px-3">PAT คลองเตย</th>
                  <th className="py-2.5 px-3">Reefer Plug</th>
                  <th className="py-2.5 px-3">{isTh ? 'หมายเหตุ' : 'Remark'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-white">{r.carrier}</td>
                    <td className="py-2.5 px-3">{r.latKrabang}</td>
                    <td className="py-2.5 px-3">{r.laemChabang}</td>
                    <td className="py-2.5 px-3">{r.patBangkok}</td>
                    <td className="py-2.5 px-3 text-amber-300">{r.freeTimePlug}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-xs">{r.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

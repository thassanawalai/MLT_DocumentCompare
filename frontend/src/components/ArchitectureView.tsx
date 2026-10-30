import React, { useState } from 'react';
import { BookOpen, Layers, CheckCircle2, ArrowRight, ShieldCheck, Terminal, Cpu, FileText } from 'lucide-react';
import { normalizeText } from '../services/normalizer';
import { generateStructuredDiff } from '../services/diffMatcher';

interface ArchitectureViewProps {
  language: 'th' | 'en';
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ language }) => {
  const isTh = language === 'th';

  // Interactive Normalization Playground
  const [testText1, setTestText1] = useState(
    'POLYPLEX (THAILAND) PUBLIC COMPANY LIMITED,\n75/26 OCEAN TOWER II, 18TH FL.------\nBANGKOK, 10110 THAILAND'
  );
  const [testText2, setTestText2] = useState(
    'POLYPLEX (THAILAND) PUBLIC CO., LTD.\n75/26 OCEAN TOWER II 18TH FL.\nBANGKOK 10110 THAILAND'
  );

  const clean1 = normalizeText(testText1, { commasAsWhitespace: true });
  const clean2 = normalizeText(testText2, { commasAsWhitespace: true });
  const [diff1, diff2] = generateStructuredDiff(clean1, clean2);

  const stages = [
    {
      num: 1,
      title: isTh ? 'การนำเข้าเอกสาร & สแกนผัง (Document Ingestion & OCR)' : 'Document Ingestion & OCR',
      desc: isTh
        ? 'รองรับไฟล์ PDF, ภาพสแกน, ข้อความ Telex ดึงข้อมูลพร้อมตำแหน่งพิกัด Bounding Box (x, y, w, h)'
        : 'Accepts PDF, scanned bills, and raw EDI text; extracts bounding box coordinates and pages.',
      icon: FileText,
      tag: 'OCR Engine',
    },
    {
      num: 2,
      title: isTh ? 'จับคู่แม่แบบสายเรือ (Template & Field Alignment)' : 'Template & Field Alignment',
      desc: isTh
        ? 'ค้นหา Anchor Text เช่น "Shipper", "Consignee", "Port of Loading" ตามแม่แบบเฉพาะของ OOCL, ONE, Wan Hai, Hapag'
        : 'Identifies anchor labels based on carrier-specific templates (OOCL, ONE, Wan Hai, Hapag-Lloyd).',
      icon: Layers,
      tag: 'Template Registry',
    },
    {
      num: 3,
      title: isTh ? 'ตัวปรับมาตรฐานข้อความทางเรือ (Maritime Normalizer)' : 'Maritime Logistics Normalizer',
      desc: isTh
        ? 'ลบเส้นแบ่งโทรพิมพ์ (------, ++++++), จัดการเครื่องหมายจุลภาคในที่อยู่, ตัดช่องว่างซ้ำ เพื่อไม่ให้เกิด False Positive'
        : 'Strips telex delimiters, standardizes address commas, collapses whitespaces to prevent false errors.',
      icon: Terminal,
      tag: 'Rule-based Filter',
    },
    {
      num: 4,
      title: isTh ? 'เปรียบเทียบความต่างระดับคำ (Sequence Diff Matcher)' : 'Sequence Diff Matcher',
      desc: isTh
        ? 'พอร์ตอัลกอริทึม difflib.SequenceMatcher ทำการเปรียบเทียบระดับตัวอักษรและคำ ชี้จุดผิดพลาดอย่างแม่นยำ'
        : 'Character and token level longest common subsequence calculation showing precise deletions & insertions.',
      icon: Cpu,
      tag: 'Diff Engine',
    },
    {
      num: 5,
      title: isTh ? 'จัดระดับความเสี่ยง & ร่างอีเมล (Risk Matrix & Memo)' : 'Risk Matrix & Amendment Memo',
      desc: isTh
        ? 'คัดแยกความรุนแรง Critical (เช่น เบอร์ซีล, ผู้รับ), Warning, Info และร่างจดหมายขอแก้ไขส่งสายเรือทันที'
        : 'Classifies discrepancies by customs impact (Critical / Warning) and generates instant amendment letters.',
      icon: ShieldCheck,
      tag: 'Advisory Dispatch',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              {isTh ? 'สถาปัตยกรรมการทำงานของระบบ (5-Stage Verification Pipeline)' : '5-Stage Verification Pipeline Architecture'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isTh
              ? 'ขั้นตอนการทำงานของเอ็นจิ้นตรวจสอบเอกสารทางเรือ MLT Document Compare ตั้งแต่การอ่านเอกสารจนถึงการแจ้งเตือนความเสี่ยง'
              : 'End-to-end pipeline architecture powering automated shipping instruction and bill of lading verification.'}
          </p>
        </div>
      </div>

      {/* 5 Stages Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {stages.map((st, i) => {
          const Icon = st.icon;
          return (
            <div
              key={st.num}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {st.num}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {st.tag}
                  </span>
                </div>
                <h3 className="font-bold text-xs text-slate-900 leading-snug mb-1">
                  {st.title}
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {st.desc}
                </p>
              </div>

              {i < 4 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Normalizer & Diff Playground */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              {isTh ? 'ทดลองระบบ Normalizer & Token Diff (Live Playground)' : 'Interactive Normalizer & Diff Playground'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTh
                ? 'ลองพิมพ์หรือวางข้อความ เพื่อดูการตัดเครื่องหมายและคำนวณ Diff แบบเรียลไทม์'
                : 'Test maritime normalization rules and sequence matching algorithms in real-time.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'ข้อความ SI (Input A):' : 'SI Text (Input A):'}
            </label>
            <textarea
              rows={4}
              value={testText1}
              onChange={(e) => setTestText1(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isTh ? 'ข้อความ B/L (Input B):' : 'B/L Text (Input B):'}
            </label>
            <textarea
              rows={4}
              value={testText2}
              onChange={(e) => setTestText2(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Diff Result */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200">
            <span className="text-[10px] uppercase font-bold text-blue-700 block mb-1">
              Cleaned & Highlighted Diff (SI):
            </span>
            <div className="font-mono text-xs whitespace-pre-wrap break-words leading-relaxed">
              {diff1.map((chunk, idx) => (
                <span
                  key={idx}
                  className={
                    chunk.tag === 'delete'
                      ? 'bg-rose-200 text-rose-900 px-0.5 rounded font-bold'
                      : 'text-slate-800'
                  }
                >
                  {chunk.value}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Cleaned & Highlighted Diff (B/L):
            </span>
            <div className="font-mono text-xs whitespace-pre-wrap break-words leading-relaxed">
              {diff2.map((chunk, idx) => (
                <span
                  key={idx}
                  className={
                    chunk.tag === 'insert'
                      ? 'bg-emerald-200 text-emerald-900 px-0.5 rounded font-bold'
                      : 'text-slate-800'
                  }
                >
                  {chunk.value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

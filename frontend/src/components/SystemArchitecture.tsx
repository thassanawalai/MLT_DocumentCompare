import React from 'react';
import { BookOpen, Cpu, ShieldAlert, GitCompare, CheckCircle2, FileText, Anchor } from 'lucide-react';

interface SystemArchitectureProps {
  language: 'th' | 'en';
}

export const SystemArchitecture: React.FC<SystemArchitectureProps> = ({ language }) => {
  const isTh = language === 'th';

  const stages = [
    {
      num: '1',
      title: isTh ? 'Stage 1: Document Ingestion & Field Anchor Extraction' : 'Stage 1: Ingestion & Anchor Extraction',
      desc: isTh
        ? 'รับไฟล์ PDF/ภาพ B/L และ SI โดยใช้พิกัด Bounding Box หรือ Template Anchor ของสายเรือ (ONE, OOCL, Wan Hai, Hapag, Evergreen) เพื่อดึงข้อความแต่ละฟิลด์อย่างแม่นยำ'
        : 'Extracts fields using coordinate bounding boxes and carrier template anchors.',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      num: '2',
      title: isTh ? 'Stage 2: Text Normalization (ระบบทำความสะอาดข้อความ)' : 'Stage 2: Text Normalization',
      desc: isTh
        ? 'ตัดอักขระพิเศษจากการพิมพ์โทรเลข (Telex ++++++), ลบเส้นประ (---), ทำความสะอาดเครื่องหมายจุลภาคในที่อยู่, รวมฟิลด์ Shipper 1 และ 2 เข้าด้วยกันเพื่อความสมบูรณ์'
        : 'Strips telex delimiters, clean address commas, collapses whitespaces, merges split shipper blocks.',
      color: 'from-indigo-600 to-violet-600',
    },
    {
      num: '3',
      title: isTh ? 'Stage 3: SequenceMatcher & Structured Diff Engine' : 'Stage 3: Sequence Matcher & Structured Diff',
      desc: isTh
        ? 'เปรียบเทียบความแตกต่างระดับตัวอักษรและคำ (Token & Char Diffing) พร้อมระบุประเภท Equal, Delete, Insert เพื่อระบุจุดที่ตกหล่นหรือพิมพ์เกิน'
        : 'Performs LCS opcode diffing identifying missing, extra, or modified characters.',
      color: 'from-violet-600 to-purple-600',
    },
    {
      num: '4',
      title: isTh ? 'Stage 4: Executive Discrepancy Classification (ตารางสรุปความต่าง)' : 'Stage 4: Discrepancy Classification',
      desc: isTh
        ? 'จัดหมวดหมู่ความรุนแรง เช่น "ผิดแน่นอนจากเอกสาร", "ตัวเลขไม่ครบ", "ข้อมูลไม่ครบ" (ดังตัวอย่าง CBM และ TAX ID) พร้อมระบุผลกระทบต่อพิธีการศุลกากร'
        : 'Classifies discrepancies into actionable severity badges (Definite Error, Incomplete Number, Missing Data).',
      color: 'from-purple-600 to-rose-600',
    },
    {
      num: '5',
      title: isTh ? 'Stage 5: Master Cross-Verification & Export' : 'Stage 5: Master Cross-Verification & Export',
      desc: isTh
        ? 'ตรวจสอบข้ามฐานข้อมูลกับ HS Code Master (1,100+ รายการ), Customer Directory (TAX ID นิติบุคคล), และกฎ Port Freetime ก่อนส่งออกเอกสารแก้ไข B/L'
        : 'Validates against corporate tax databases, HS tariff schedules, and port freetime rules.',
      color: 'from-rose-600 to-amber-600',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30">
            {isTh ? 'สถาปัตยกรรมระบบ' : 'System Architecture'}
          </span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          {isTh ? 'โครงสร้างการทำงานและขั้นตอนการตรวจสอบ 5 ขั้นตอน (5-Stage Pipeline)' : '5-Stage Verification Pipeline Architecture'}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          {isTh
            ? 'ทำความเข้าใจกลไกการเปรียบเทียบเอกสารการส่งออกทางเรือระหว่าง Shipping Instruction (SI) กับ Bill of Lading (B/L) ตามมาตรฐานสากล'
            : 'End-to-end explanation of document comparison, normalization algorithms, and discrepancy classification.'}
        </p>
      </div>

      {/* 5 Stages Flow */}
      <div className="space-y-4">
        {stages.map((stage) => (
          <div
            key={stage.num}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-start gap-4 hover:border-slate-700 transition-all"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center font-bold text-white text-base shadow flex-shrink-0`}
            >
              {stage.num}
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="font-bold text-white text-sm">{stage.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{stage.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Key Maritime Rules Callout */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
          <ShieldAlert className="w-4 h-4" />
          <span>{isTh ? '3 กฎเหล็กในการตรวจสอบเอกสาร B/L ที่ผิดพลาดบ่อยที่สุด' : 'Top 3 Critical Error Checks'}</span>
        </div>
        <ul className="space-y-2 text-xs text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-rose-400 font-bold">•</span>
            <span>
              <strong>ปริมาตรสินค้า (Measurement / CBM):</strong> การพิมพ์ผิดตัวเลข เช่น 215.541 CBM กับ 150.00 M³ จะทำให้ค่าระวางเรือ (Ocean Freight) ผิดพลาด และไม่ตรงกับใบกำกับภาษีศุลกากร
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-400 font-bold">•</span>
            <span>
              <strong>เลขประจำตัวผู้เสียภาษี (Tax ID / VAT):</strong> ขาดแม้แต่หลักเดียว (เช่น ขาดเลขท้าย 3) หรือมีเครื่องหมาย # นำหน้าโดยไม่มีตัวเลข จะทำให้ผู้นำเข้าปลายทางไม่สามารถผ่านพิธีการศุลกากรได้
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-400 font-bold">•</span>
            <span>
              <strong>ชื่อเรือและเที่ยวเรือ (Vessel / Voyage):</strong> รหัสเที่ยวเรือทิศทาง เช่น 024E กับ 024W ส่งผลต่อการติดตามสถานะตู้สินค้าที่ท่าเรือเปลี่ยนถ่าย (Transshipment Hub)
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

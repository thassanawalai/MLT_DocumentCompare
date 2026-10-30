import React, { useState } from 'react';
import {
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Layers,
  Cpu,
  Workflow,
  Search,
  FileCheck,
  CheckCircle2,
  DollarSign,
  Clock,
  Sparkles,
  Split,
  Database,
  Code2,
} from 'lucide-react';

interface SystemArchitectureGuideProps {
  language: 'th' | 'en';
}

export const SystemArchitectureGuide: React.FC<SystemArchitectureGuideProps> = ({ language }) => {
  const isTh = language === 'th';
  const [activeStep, setActiveStep] = useState<number>(1);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 text-slate-800">
      {/* Title & Introduction */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-10 -translate-y-10">
          <Workflow className="w-96 h-96 text-white" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <BookOpen className="w-3.5 h-3.5" />
            {isTh ? 'คู่มือทำความเข้าใจระบบ' : 'MLT Technical Whitepaper'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
            {isTh
              ? 'ระบบการทำงานและการตรวจสอบเปรียบเทียบระหว่าง SI กับ B/L'
              : 'End-to-End Maritime Document Comparison System (SI vs B/L)'}
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            {isTh
              ? 'เจาะลึกกระบวนการทำงานของระบบ MLT_DocumentCompare ตั้งแต่ที่มาของเอกสารในห่วงโซ่โลจิสติกส์การเดินเรือ กระบวนการสกัดข้อมูล 5 ขั้นตอน (5-Stage Pipeline) กฎการแปลงข้อมูล (Normalization) ไปจนถึงอัลกอริทึมตรวจจับความแตกต่าง (Diff Engine)'
              : 'Comprehensive architectural breakdown of the SI vs B/L verification engine, covering maritime supply chain workflows, the 5-stage extraction pipeline, text normalization, and SequenceMatcher diffing.'}
          </p>
        </div>
      </div>

      {/* SECTION 1: BUSINESS CONTEXT & DOMAIN */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {isTh
              ? 'ทำความเข้าใจเอกสาร SI และ B/L ในวงการพาณิชย์นาวี'
              : 'Maritime Shipping Domain: SI vs B/L Explained'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                DOCUMENT 1
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-200 text-sky-900">
                S.I.
              </span>
            </div>
            <h3 className="font-bold text-base text-sky-950 mb-1">
              Shipping Instruction (ใบสั่งปล่อยสินค้า)
            </h3>
            <p className="text-xs text-sky-900 leading-relaxed mb-3">
              {isTh
                ? 'เอกสารที่ผู้ส่งออก (Shipper) หรือตัวแทนจัดส่งสินค้า ออกให้กับสายเรือหรือ Freight Forwarder เพื่อแจ้งรายละเอียดที่ถูกต้องของสินค้า เช่น ชื่อผู้ส่ง-ผู้รับ ท่าเรือ เบอร์ตู้ น้ำหนัก เพื่อให้สายเรือนำไปพิมพ์ลงในใบตราส่ง B/L'
                : 'The blueprint document sent by the Shipper or Forwarder to the ocean carrier, directing exactly how the official Bill of Lading must be printed.'}
            </p>
            <div className="text-[11px] text-sky-800 font-mono bg-white/70 p-2 rounded border border-sky-200">
              {isTh
                ? '📌 สถานะ: เป็นเอกสาร Master ต้นฉบับที่อ้างอิงความถูกต้อง (Ground Truth)'
                : '📌 Role: Single Source of Truth for cargo and contractual details.'}
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                DOCUMENT 2
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-200 text-emerald-900">
                B/L Draft
              </span>
            </div>
            <h3 className="font-bold text-base text-emerald-950 mb-1">
              Bill of Lading Draft (ร่างใบตราส่งสินค้าทางเรือ)
            </h3>
            <p className="text-xs text-emerald-900 leading-relaxed mb-3">
              {isTh
                ? 'เอกสารที่สายเรือ (Carrier เช่น ONE, OOCL, Wan Hai) พิมพ์ขึ้นมาจากระบบของตนแล้วส่งกลับมาให้ตัวแทนหรือลูกค้าตรวจสอบ (Proofreading) ก่อนที่จะปล่อย B/L ฉบับจริง หรือ Seawaybill'
                : 'The draft document generated by shipping lines and sent back to operators for proofreading before official release.'}
            </p>
            <div className="text-[11px] text-emerald-800 font-mono bg-white/70 p-2 rounded border border-emerald-200">
              {isTh
                ? '⚠️ ข้อควรระวัง: บ่อยครั้งที่เจ้าหน้าที่สายเรือคีย์ผิด ตกหล่นรหัสไปรษณีย์ หรือสลับเบอร์ซีล'
                : '⚠️ Risk: High clerical error rate during manual data entry at carrier liner offices.'}
            </div>
          </div>
        </div>

        {/* Why compare? Financial & Legal Impact */}
        <div className="bg-slate-900 text-white rounded-xl p-5">
          <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4" />
            {isTh
              ? 'ทำไมต้องเปรียบเทียบทุกตัวอักษร? ผลกระทบและความเสียหายหากเอกสารผิด'
              : 'Why Exact Comparison is Mission-Critical (Financial & Customs Risks)'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <div className="text-amber-400 font-bold mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {isTh ? 'ค่าปรับแก้ B/L (Amendment Fee)' : 'B/L Amendment Fees'}
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {isTh
                  ? 'หากเลยกำหนด SI Closing แล้วต้องขอแก้ B/L สายเรือจะคิดค่าธรรมเนียมใบละ $50 - $200 USD (ราว 1,800 - 7,000 บาทต่อฉบับ)'
                  : 'Liner carriers penalize post-closing amendments with steep $50 - $200 USD fees per Bill of Lading.'}
              </p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <div className="text-rose-400 font-bold mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                {isTh ? 'ศุลกากรปลายทางปรับ (Customs Fines)' : 'Customs Manifest Fines'}
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {isTh
                  ? 'ศุลกากรสหรัฐฯ (US CBP / AMS), ญี่ปุ่น (AFR), หรือยุโรป (ENS) ปรับตั้งแต่ $1,000 - $5,000 USD หากข้อมูลไม่ตรงกับ Manifest'
                  : 'Customs authorities (US AMS, Japan AFR, EU ENS) levy harsh fines up to $5,000 USD for manifest discrepancies.'}
              </p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <div className="text-sky-400 font-bold mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {isTh ? 'ตู้ติดค้าง & ค่า Demurrage' : 'Port Demurrage & Cargo Hold'}
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {isTh
                  ? 'สินค้าไม่สามารถออกของได้จนกว่า B/L จะได้รับการแก้ไข ทำให้เกิดค่าเช่าลานตู้ (Demurrage & Detention) สะสมวันละนับพันบาท'
                  : 'Consignees cannot clear customs, resulting in crippling port storage, demurrage, and container detention fees.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: HBL vs MBL */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {isTh
              ? 'การตรวจ 2 ชุด: HBL (Set 1) กับ MBL (Set 2)'
              : 'Two-Tier Verification: HBL (Set 1) vs MBL (Set 2)'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-2">
              <Split className="w-4 h-4" />
              <span>HBL Verification (Set 1)</span>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              {isTh
                ? 'เปรียบเทียบระหว่าง [SI ของลูกค้าต้นทาง] กับ [House B/L (HBL) ที่ Freight Forwarder/Maritime ออกให้กับลูกค้า]'
                : 'Compares Shipper SI with the House B/L issued by the Freight Forwarder / NVOCC.'}
            </p>
            <ul className="text-xs space-y-1.5 text-slate-700">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Shipper:</strong> {isTh ? 'ชื่อผู้ส่งออกจริง (เช่น Polyplex, Betagro)' : 'Actual exporter company'}
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Consignee:</strong> {isTh ? 'ชื่อผู้ซื้อสินค้าตัวจริงที่ปลายทาง' : 'Actual buyer/importer'}
                </span>
              </li>
            </ul>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
              <Split className="w-4 h-4" />
              <span>MBL Verification (Set 2)</span>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              {isTh
                ? 'เปรียบเทียบระหว่าง [SI ที่ส่งให้สายเรือ] กับ [Master B/L (MBL) ที่สายเรือใหญ่ (เช่น ONE, OOCL, Wan Hai) ออกมาให้]'
                : 'Compares Maritime SI with the Master B/L issued by ocean carriers (ONE, OOCL, Wan Hai).'}
            </p>
            <ul className="text-xs space-y-1.5 text-slate-700">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Shipper:</strong> {isTh ? 'Maritime Alliance (หรือ Forwarder ต้นทาง)' : 'Maritime Alliance (Forwarder)'}
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Consignee:</strong> {isTh ? 'ตัวแทนปลายทางของ Maritime (Destination Agent)' : 'Destination handling agent'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION 3: THE 5-STAGE TECHNICAL EXTRACTION PIPELINE */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isTh
                ? 'สถาปัตยกรรม 5 ขั้นตอน (The 5-Stage Extraction Pipeline)'
                : 'The 5-Stage Backend Extraction Pipeline'}
            </h2>
            <p className="text-xs text-slate-500">
              {isTh
                ? 'กระบวนการดึงข้อมูลและพิกัด Bounding Box จาก PDF โดยระบบ backend ใน MLT_DocumentCompare'
                : 'Data pipeline implemented across backend/app/core in MLT_DocumentCompare repository'}
            </p>
          </div>
        </div>

        {/* Step buttons */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {[
            { num: 1, title: 'Stage 1', label: isTh ? 'Document Parser' : 'Parser' },
            { num: 2, title: 'Stage 2', label: isTh ? 'Anchor & Context' : 'Anchoring' },
            { num: 3, title: 'Stage 3', label: isTh ? 'AI / QA Engine' : 'QA Engine' },
            { num: 4, title: 'Stage 4', label: isTh ? 'Exact Re-stitching' : 'Re-stitching' },
            { num: 5, title: 'Stage 5', label: isTh ? 'Table Extraction' : 'Table Parser' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`p-2.5 rounded-lg text-center transition-all border ${
                activeStep === s.num
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                {s.title}
              </div>
              <div className="text-xs font-bold truncate mt-0.5">{s.label}</div>
            </button>
          ))}
        </div>

        {/* Dynamic step detail view */}
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
          {activeStep === 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <FileCheck className="w-4 h-4" />
                <span>Stage 1: Document Parser (PDF & Spreadsheet Tokenization)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {isTh
                  ? 'แปลงเอกสาร PDF ให้ออกมาเป็น List ของ Dictionary ที่เก็บทั้งข้อความ (Text) และพิกัดตำแหน่งในหน้ากระดาษ (Bounding Box: x0, top, x1, bottom) โดยใช้ PyMuPDF (fitz) หรือ pdfplumber'
                  : 'Extracts words and character bounding boxes (x, y, w, h) from PDF using PyMuPDF (fitz) or parses Excel sheets via pandas.'}
              </p>
              <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-lg">
                <code>
                  # PyMuPDF words extraction with coordinates
                  <br />
                  for word in page.get_text("words", sort=True):
                  <br />
                  &nbsp;&nbsp;x0, top, x1, bottom, text = word[0], word[1], word[2], word[3], word[4]
                </code>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <Search className="w-4 h-4" />
                <span>Stage 2: Anchoring & Context Window (ค้นหาจุดอ้างอิง)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {isTh
                  ? 'ค้นหา Anchor Text ตามคอนฟิกเทมเพลตของสายเรือ (เช่น "BOOKING NO.", "CONSIGNEE", "PORT OF LOADING") ด้วย Case-Sensitive Search และตัดพิกัดเฉพาะพื้นที่บริเวณ Anchor (Context Window) เพื่อจำกัดขอบเขตไม่ให้โมเดลมองเห็นข้อความฟิลด์อื่นปะปน'
                  : 'Locates predefined anchor texts according to carrier templates and creates a bounded Context Window, constraining the extraction region.'}
              </p>
              <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-lg">
                <code>
                  # Template anchor box calculation
                  <br />
                  check_rect = anchor_rect + fitz.Rect(offset_x, offset_y, width, height)
                  <br />
                  context_text = page.get_text("text", clip=check_rect)
                </code>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <Cpu className="w-4 h-4" />
                <span>Stage 3: QA Engine & Anti-Hallucination (สกัดข้อมูลตำแหน่ง)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {isTh
                  ? 'ส่งคำถามเฉพาะฟิลด์ไปยังโมเดล Extractive QA (เช่น xlm-roberta-base-squad2 หรือ LLM) โดยมีกฎเหล็กว่า AI จะต้องคืนค่ากลับมาเป็นเฉพาะ "start_index" และ "end_index" จาก Context Window เท่านั้น ไม่อนุญาตให้ AI สร้างคำใหม่ขึ้นมาเอง (Zero Hallucination)'
                  : 'Constrains QA models to return only character start_index and end_index from the source context, strictly preventing hallucinated output.'}
              </p>
              <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-lg">
                <code>
                  # Returns raw start & end offsets within original text
                  <br />
                  extracted_answer = context_text[start_index:end_index]
                </code>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <Code2 className="w-4 h-4" />
                <span>Stage 4: Exact Text Re-stitching (การประกอบข้อความข้ามบรรทัด)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {isTh
                  ? 'นำ index ที่ได้จาก AI ไป Slice ข้อความออกจาก String ต้นฉบับ และตรวจสอบว่าข้อความมีหลายบรรทัดหรือไม่ หากมี ระบบจะกวาดคำในบรรทัดถัดไปตามพิกัดแนวแกน Y มาต่อประกอบกันให้สมบูรณ์ (เช่น ที่อยู่ Shipper/Consignee 3-4 บรรทัด)'
                  : 'Slices the exact characters from the raw string and stitches multi-line text along the vertical Y-axis for multi-line company names and addresses.'}
              </p>
            </div>
          )}

          {activeStep === 5 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <Database className="w-4 h-4" />
                <span>Stage 5: Table Extraction (จัดการข้อมูลตารางตู้สินค้าและสินค้า)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {isTh
                  ? 'จัดการกับข้อมูลที่เป็นโครงสร้างตาราง (เช่น Container Marks & Numbers, Seal Numbers, Package Types, Gross Weights, CBM) โดยแยกออกจาก AI โดยใช้ฟังก์ชันวิเคราะห์คอลัมน์ตารางเพื่อความแม่นยำ 100%'
                  : 'Handles structured table columns (Container No, Seal No, Pkgs, Weights, CBM) through specialized geometric column analysis.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: NORMALIZATION & DIFF ALGORITHM */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            4
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {isTh
              ? 'ลอจิกการทำ Normalization และการ Diff ข้อความ'
              : 'Normalization Logic & Diff SequenceMatcher'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>กฎการทำ Text Normalization</span>
            </h4>
            <p className="text-slate-600 leading-relaxed">
              {isTh
                ? 'ในเอกสารเดินเรือ ฟอร์แมตช่องว่าง การตัดบรรทัด และเครื่องหมายมักไม่ตรงกัน หากเปรียบเทียบแบบ Raw String ทั่วไป จะเกิด False Alarm (เตือนผิดพลาด) นับร้อยจุด:'
                : 'Standard string equality produces false positives due to OCR whitespace and line breaks.'}
            </p>
            <ul className="space-y-2 pl-2">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>
                  <strong>Commas as Whitespace:</strong> ในฟิลด์ที่อยู่และท่าเรือ เช่น
                  "BANGKOK, THAILAND" vs "BANGKOK THAILAND" คอมมาจะถูกแปลงเป็นช่องว่าง
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>
                  <strong>Hyphen Removal:</strong> บรรทัดที่มีขีดคั่น 3 ขีดขึ้นไป (---)
                  ที่มักใช้กั้นตารางใน B/L จะถูกตัดทิ้ง
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>
                  <strong>Control Characters:</strong> ตัดอักขระพิเศษจากการแกะ PDF เช่น
                  \u200b (Zero-Width Space), \x03, \x04
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">4.</span>
                <span>
                  <strong>Double Shipper Combine:</strong> รวมฟิลด์ shipper_1 และ shipper_2
                  ที่แยกคอลัมน์กันในเทมเพลตสายเรือ ให้เป็นก้อนเดียวกันก่อนเปรียบเทียบ
                </span>
              </li>
            </ul>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-emerald-600" />
              <span>SequenceMatcher Diff Algorithm</span>
            </h4>
            <p className="text-slate-600 leading-relaxed">
              {isTh
                ? 'ระบบใช้อัลกอริทึม Longest Common Subsequence (SequenceMatcher) คล้ายกับคำสั่ง git diff เพื่อระบุความแตกต่างระดับตัวอักษรและคำ:'
                : 'Computes character-level differences using SequenceMatcher dynamic programming opcodes:'}
            </p>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded">
                <strong>tag: "equal"</strong> &rarr; ตัวอักษรตรงกัน แสดงสีข้อความปกติ
              </div>
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded">
                <strong>tag: "delete"</strong> &rarr; ข้อความที่มีใน SI แต่หายไปใน B/L (ขีดฆ่าสีแดง)
              </div>
              <div className="p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded">
                <strong>tag: "insert"</strong> &rarr; ข้อความที่เพิ่มขึ้นมาผิดใน B/L (ไฮไลต์แถบสีเหลือง)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

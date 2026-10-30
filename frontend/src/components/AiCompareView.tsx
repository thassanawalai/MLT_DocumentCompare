import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Mail,
  HelpCircle,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { COMPARISON_SCENARIOS } from '../services/sampleData';
import { runDocumentComparison } from '../services/comparator';

interface AiCompareViewProps {
  language: 'th' | 'en';
}

export const AiCompareView: React.FC<AiCompareViewProps> = ({ language }) => {
  const isTh = language === 'th';
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(COMPARISON_SCENARIOS[0].id);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [aiChatResponses, setAiChatResponses] = useState<
    { sender: 'user' | 'ai'; text: string; time: string }[]
  >([
    {
      sender: 'ai',
      text: isTh
        ? 'สวัสดีครับ ผมคือผู้ช่วยอัจฉริยะด้านการตรวจสอบเอกสารการส่งออกทางเรือ (Maritime Logistics AI Assistant) คุณสามารถสอบถามเกี่ยวกับการแก้ไข B/L, ความเสี่ยงทางศุลกากร, หรือให้ผมช่วยร่างอีเมลแจ้งสายเรือได้ทันทีครับ'
        : 'Hello! I am your Maritime Logistics Document AI Assistant. I can evaluate discrepancy risks, inspect Letter of Credit (L/C) compliance, and draft official carrier amendment memos.',
      time: 'Just now',
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const scenario =
    COMPARISON_SCENARIOS.find((s) => s.id === selectedScenarioId) || COMPARISON_SCENARIOS[0];

  const comparison = React.useMemo(() => {
    return runDocumentComparison(scenario.siData, scenario.blData);
  }, [scenario]);

  const diffs = comparison.discrepancies.filter((d) => !d.isMatch);

  // Generate carrier amendment memo text
  const carrierAmendmentMemo = React.useMemo(() => {
    const booking = scenario.siData.booking_no?.value || 'N/A';
    const carrier = scenario.carrierCompany;
    const shipper = scenario.shipperCompany;

    const diffBulletPoints = diffs
      .map((d, i) => {
        return `   ${i + 1}. [FIELD: ${d.fieldNameEn.toUpperCase()}]\n` +
          `      - Draft B/L Currently Shows: "${d.program_value.value.replace(/\n/g, ' ')}"\n` +
          `      - Correct SI Required Value: "${d.original_value.value.replace(/\n/g, ' ')}"\n` +
          `      - Reason / Correction Note : ${
            d.severity === 'critical'
              ? 'Critical customs clearance requirement. Must strictly match invoice and L/C.'
              : 'Standard document alignment per shipper instruction.'
          }`;
      })
      .join('\n\n');

    return `SUBJECT: URGENT: B/L Draft Amendment Request - Booking #${booking} (${shipper} / ${carrier})

Attn: Export Documentation Dept., ${carrier} Shipping Line
Cc: Documentation & Customer Service Team

Dear Customer Service / Documentation Team,

Regarding Booking No.: ${booking}
Shipper: ${shipper}
Carrier: ${carrier}
Vessel / Voyage: ${scenario.siData.vessel?.value || 'AS PER BOOKING'}
Port of Loading: ${scenario.siData.port_of_loading?.value || '-'}
Port of Discharge: ${scenario.siData.port_of_discharge?.value || '-'}

We have thoroughly verified your initial Bill of Lading (B/L) draft against our finalized Shipping Instruction (SI). We detected ${diffs.length} discrepancy(ies) that require your immediate correction prior to issuance of the Sea Waybill / Original B/L:

----------------------------------------------------------------------
LIST OF REQUIRED AMENDMENTS:
----------------------------------------------------------------------
${diffBulletPoints || '   No critical discrepancies identified.'}

----------------------------------------------------------------------
Please kindly revise the B/L draft and send the revised copy for our final re-confirmation before the documentation closing cutoff.

Thank you very much for your prompt assistance and support.

Best regards,
MLT Maritime Documentation & Export Operations
E-mail: export.docs@maritime-alliance.com`;
  }, [scenario, diffs]);

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(carrierAmendmentMemo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2500);
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;

    const q = userQuestion.trim();
    setUserQuestion('');
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setAiChatResponses((prev) => [...prev, { sender: 'user', text: q, time: timeNow }]);
    setIsGenerating(true);

    setTimeout(() => {
      let answer = '';
      const lower = q.toLowerCase();

      if (lower.includes('consignee') || lower.includes('ผู้รับ')) {
        answer = isTh
          ? `จากการวิเคราะห์ Consignee ในชุด ${scenario.shipperCompany}: พบว่ารหัสไปรษณีย์หรือชื่อปลายทางมีความต่าง หากปล่อยผ่านโดยไม่ออกใบแก้ไข (Amendment) ปลายทางจะไม่สามารถทำพิธีการศุลกากรปล่อยของได้ และอาจโดนค่า Demurrage รายวัน แนะนำให้กดคัดลอกร่างจดหมายแจ้งสายเรือด้านบนเพื่อส่งอีเมลทันทีครับ`
          : `Consignee analysis: Inaccurate Consignee postcodes or names will trigger immediate customs holds at the destination port. Recommend sending the generated amendment memo immediately before vessel manifest filing.`;
      } else if (lower.includes('seal') || lower.includes('ซีล') || lower.includes('เบอร์')) {
        answer = isTh
          ? `⚠️ ความเสี่ยงระดับสูงสุด (CRITICAL): เบอร์ซีล (Seal Number) ใน B/L ต้องตรงกับซีลจริงบนตู้และใน SI 100% หากเบอร์ซีลในเอกสารไม่ตรง เจ้าหน้าที่ศุลกากรท่าเรือปลายทางจะสั่งกักตู้เพื่อเปิดตรวจ (Physical Inspection) ซึ่งมีค่าใช้จ่ายเพิ่มเติมสูงมาก`
          : `⚠️ CRITICAL RISK: Seal number discrepancies result in automatic customs holds and mandatory physical cargo inspection at the destination port, incurring high detention penalties.`;
      } else if (lower.includes('hs code') || lower.includes('พิกัด')) {
        answer = isTh
          ? `สำหรับ HS Code: สายเรือบางสาย (เช่น OOCL, ONE) อาจย่อหรือละเว้นพิกัดศุลกากรใน B/L หากปลายทางไม่ได้ระบุเป็น L/C Requirement แต่หากลูกค้าต้องการให้โชว์ใน B/L ต้องแจ้งให้สายเรือระบุในช่อง Description of Goods ครับ`
          : `Regarding HS Code: Carriers frequently omit HS Codes from the B/L unless specifically instructed. If this shipment is under a Letter of Credit (L/C), request the carrier to explicitly re-insert it.`;
      } else {
        answer = isTh
          ? `การประเมินภาพรวมสำหรับชุด ${scenario.title}:\n- ตรวจพบจุดต่างทั้งหมด ${diffs.length} จุด\n- จุดที่ต้องระวังที่สุด: ${diffs[0]?.fieldNameTh || 'ข้อมูลทั่วไป'}\n- แนะนำ: ส่งแบบร่างอีเมลที่ระบบเจนไว้ให้สายเรือตรวจสอบและยืนยันก่อนเวลา SI Cut-off 2 ชั่วโมงครับ`
          : `Overall assessment for ${scenario.title}: Found ${diffs.length} discrepancies. Highest priority item is ${diffs[0]?.fieldNameEn || 'general fields'}. Recommend dispatching the draft amendment memo to the carrier at least 2 hours before shipping cutoff.`;
      }

      setAiChatResponses((prev) => [
        ...prev,
        { sender: 'ai', text: answer, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 rounded-2xl text-white shadow-lg border border-indigo-900/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">AI Deep Compare & Risk Advisory</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-semibold">
                  Gemini Maritime Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                {isTh
                  ? 'วิเคราะห์ความเสี่ยงเชิงลึกของจุดต่างระหว่าง SI กับ B/L, ประเมินผลกระทบทางศุลกากร และร่างแบบฟอร์มขอแก้ไขเอกสาร (B/L Amendment Letter) ส่งสายเรือโดยอัตโนมัติ'
                  : 'Automated semantic risk evaluation, Letter of Credit (L/C) compliance checks, and carrier amendment notice generator.'}
              </p>
            </div>
          </div>

          {/* Scenario Selector */}
          <div className="min-w-[240px]">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {isTh ? 'ชุดเอกสารที่วิเคราะห์:' : 'Document Set:'}
            </label>
            <select
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {COMPARISON_SCENARIOS.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {isTh ? sc.titleTh : sc.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Carrier Amendment Memo (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {isTh ? 'จดหมายแจ้งสายเรือขอแก้ไขแบบร่าง B/L (Draft Amendment Memo)' : 'Carrier B/L Amendment Request Memo'}
                </h3>
              </div>
              <button
                onClick={handleCopyMemo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                {copiedMemo ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isTh ? 'คัดลอกเรียบร้อย' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isTh ? 'คัดลอกอีเมล' : 'Copy Email Memo'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed overflow-auto max-h-[440px] whitespace-pre-wrap select-all border-b border-slate-800">
              {carrierAmendmentMemo}
            </div>

            <div className="p-3 bg-slate-50 text-slate-500 text-xs flex items-center justify-between">
              <span>{isTh ? 'รวมจุดที่ต้องแก้ไข:' : 'Total items requiring change:'} <strong className="text-rose-600">{diffs.length}</strong></span>
              <span className="text-[11px]">{isTh ? 'สามารถนำข้อความไปส่งอีเมลหรือระบบ E-SI ของสายเรือได้ทันที' : 'Ready to paste into carrier documentation portals'}</span>
            </div>
          </div>

          {/* AI Discrepancy Risk Cards */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {isTh ? 'การประเมินความเสี่ยงและผลกระทบ (Risk Matrix)' : 'Risk Matrix & Maritime Impact'}
            </h4>
            <div className="space-y-3">
              {diffs.map((d) => (
                <div
                  key={d.field}
                  className={`p-3 rounded-lg border text-xs ${
                    d.severity === 'critical'
                      ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                      : 'bg-amber-50/60 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">
                      {isTh ? d.fieldNameTh : d.fieldNameEn} ({d.field})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        d.severity === 'critical' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                      }`}
                    >
                      {d.severity}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700">
                    <p className="mt-0.5">
                      <strong>SI:</strong> {d.original_value.value.replace(/\n/g, ' ')}
                    </p>
                    <p className="mt-0.5">
                      <strong>B/L:</strong> {d.program_value.value.replace(/\n/g, ' ')}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      {d.severity === 'critical'
                        ? (isTh
                            ? 'ความเสี่ยงศุลกากรสูง: สินค้าอาจถูกกักตรวจหรือผู้รับปลายทางไม่สามารถออก D/O ได้'
                            : 'High Customs Risk: Release of cargo will be delayed, incurring port storage costs.')
                        : (isTh
                            ? 'ความเสี่ยงปานกลาง: ควรปรับให้ตรงเพื่อป้องกันข้อโต้แย้งทางธนาคาร (L/C Discrepancy)'
                            : 'Medium Risk: Formatting mismatch could trigger L/C discrepancies during banking negotiation.')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Maritime AI Chat / Advisor (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                {isTh ? 'ผู้ช่วยอัจฉริยะด้านการเดินเรือ (AI Maritime Chat)' : 'Interactive Maritime Chat'}
              </h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
              Online
            </span>
          </div>

          {/* Quick Prompts */}
          <div className="p-3 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap gap-1.5">
            <button
              onClick={() => setUserQuestion(isTh ? 'ตรวจสอบความถูกต้องของชื่อ Consignee' : 'Check Consignee accuracy')}
              className="px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-800 text-[11px] hover:bg-indigo-100 transition-colors"
            >
              🏢 Consignee
            </button>
            <button
              onClick={() => setUserQuestion(isTh ? 'เบอร์ซีล (Seal Number) ผิดมีผลอย่างไร?' : 'What happens if Seal No mismatches?')}
              className="px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-800 text-[11px] hover:bg-indigo-100 transition-colors"
            >
              🔒 Seal Discrepancy
            </button>
            <button
              onClick={() => setUserQuestion(isTh ? 'ทำไม HS Code ใน B/L ถึงหายไป?' : 'Why is HS Code missing on B/L?')}
              className="px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-800 text-[11px] hover:bg-indigo-100 transition-colors"
            >
              📦 HS Code Rules
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[460px] bg-slate-50/40">
            {aiChatResponses.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
            {isGenerating && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>{isTh ? 'กำลังวิเคราะห์ข้อกำหนด...' : 'Analyzing maritime documentation regulations...'}</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleAskQuestion} className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input
              type="text"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder={isTh ? 'พิมพ์คำถามด้านการส่งออก, B/L, หรือศุลกากร...' : 'Ask about shipping terms, B/L, or customs...'}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!userQuestion.trim() || isGenerating}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

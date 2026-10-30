import React, { useState } from 'react';
import {
  AlertOctagon,
  Copy,
  Check,
  Download,
  Plus,
  Trash2,
  Edit2,
  FileCheck,
  HelpCircle,
  Eye,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DiscrepancyCardItem, DiscrepancyBadgeType } from '../types/discrepancyCard';

interface DiscrepancySummaryCardsProps {
  cards: DiscrepancyCardItem[];
  onUpdateCards?: (cards: DiscrepancyCardItem[]) => void;
  language?: 'th' | 'en';
  scenarioTitle?: string;
  referenceImagePath?: string;
}

export const DiscrepancySummaryCards: React.FC<DiscrepancySummaryCardsProps> = ({
  cards,
  onUpdateCards,
  language = 'th',
  scenarioTitle = 'Shipping Instruction vs Draft B/L Verification',
  referenceImagePath = '/assets/aistudio/image_e141cb17.png',
}) => {
  const isTh = language === 'th';
  const [filter, setFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [showRefImage, setShowRefImage] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // New card form state
  const [newTitle, setNewTitle] = useState('');
  const [newBadge, setNewBadge] = useState('ผิดแน่นอนจากเอกสาร');
  const [newBadgeType, setNewBadgeType] = useState<DiscrepancyBadgeType>('critical');
  const [newLayout, setNewLayout] = useState<'table_metric' | 'bullet_list'>('bullet_list');
  const [newBullets, setNewBullets] = useState('');
  const [newExplanation, setNewExplanation] = useState('');

  // Filtering
  const filteredCards = cards.filter((card) => {
    if (filter === 'all') return true;
    if (filter === 'critical') return card.badgeType === 'critical';
    if (filter === 'incomplete_number') return card.badgeType === 'incomplete_number';
    if (filter === 'incomplete_data') return card.badgeType === 'incomplete_data';
    return true;
  });

  const handleCopySummary = () => {
    let text = `📋 [รายงานสรุปความแตกต่างเอกสาร SI vs Draft B/L]\n`;
    text += `เอกสาร: ${scenarioTitle}\n`;
    text += `จำนวนข้อผิดพลาดที่พบ: ${cards.length} รายการ\n`;
    text += `--------------------------------------------------\n\n`;

    cards.forEach((card, idx) => {
      text += `${card.title} [${card.badgeText}]\n`;
      if (card.layoutType === 'table_metric' && card.metrics) {
        card.metrics.forEach((m) => {
          text += `  • ${m.label}: ${m.value} (${m.subtext || ''})\n`;
        });
        if (card.diffHighlight) text += `  👉 ${card.diffHighlight}\n`;
        if (card.subnote) text += `  👉 ${card.subnote}\n`;
        if (card.bullets) {
          card.bullets.forEach((b) => (text += `     ${b}\n`));
        }
      } else {
        if (card.bullets) {
          card.bullets.forEach((b) => (text += `  • ${b}\n`));
        }
        if (card.explanation) {
          text += `  👉 ${card.explanation}\n`;
        }
      }
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newCardItem: DiscrepancyCardItem = {
      id: `custom-${Date.now()}`,
      order: cards.length + 1,
      title: `${cards.length + 1}. ${newTitle.trim()}`,
      badgeText: newBadge,
      badgeType: newBadgeType,
      layoutType: newLayout,
      bullets: newBullets
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean),
      explanation: newExplanation.trim() || undefined,
    };

    if (onUpdateCards) {
      onUpdateCards([...cards, newCardItem]);
    }
    setIsAdding(false);
    setNewTitle('');
    setNewBullets('');
    setNewExplanation('');
  };

  const handleDeleteCard = (id: string) => {
    if (onUpdateCards) {
      onUpdateCards(cards.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Control Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-base font-bold text-white tracking-wide">
              {isTh ? 'ตารางสรุปความแตกต่าง (Discrepancy Summary)' : 'Discrepancy Summary Cards'}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 text-[11px] font-semibold">
              {cards.length} {isTh ? 'จุดตรวจพบ' : 'Issues'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isTh
              ? 'จัดรูปแบบสรุปผลการตรวจสอบประเด็นความผิดพลาดตามแบบฟอร์มเอกสารทางเรือ'
              : 'Structured executive discrepancy cards matching verified maritime audit format'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Compare with sample image */}
          <button
            onClick={() => setShowRefImage(!showRefImage)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showRefImage
                ? 'bg-amber-600/30 text-amber-200 border-amber-500/50'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="เทียบกับรูปภาพตัวอย่างต้นฉบับ"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showRefImage ? (isTh ? 'ปิดรูปตัวอย่าง' : 'Hide Ref') : (isTh ? 'ดูรูปตัวอย่าง' : 'View Ref Image')}</span>
          </button>

          {/* Copy Report */}
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isTh ? 'คัดลอกเรียบร้อย!' : 'Copied!') : (isTh ? 'คัดลอกสรุป' : 'Copy Summary')}</span>
          </button>

          {/* Add custom issue */}
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isTh ? 'เพิ่มข้อต่าง' : 'Add Discrepancy'}</span>
          </button>
        </div>
      </div>

      {/* Reference Image Comparison Overlay */}
      {showRefImage && (
        <div className="p-4 bg-slate-900 border border-amber-600/40 rounded-xl shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>{isTh ? 'รูปภาพต้นแบบที่ระบุในคำขอ (Original Reference Image)' : 'Original Reference Image'}</span>
            </div>
            <button
              onClick={() => setShowRefImage(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              ✕ {isTh ? 'ปิด' : 'Close'}
            </button>
          </div>
          <div className="flex justify-center bg-black/60 p-2 rounded-lg border border-slate-800 max-h-[380px] overflow-auto">
            <img
              src={referenceImagePath}
              alt="Reference Discrepancy Cards"
              className="max-h-[360px] object-contain rounded shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Add New Discrepancy Form Modal / Collapse */}
      {isAdding && (
        <form
          onSubmit={handleAddCard}
          className="bg-slate-900/95 border border-blue-500/40 p-4 rounded-xl shadow-xl space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              {isTh ? 'เพิ่มรายการความแตกต่างใหม่ในตารางสรุป' : 'Add New Discrepancy Card'}
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isTh ? 'หัวข้อความแตกต่าง' : 'Discrepancy Title'}
              </label>
              <input
                type="text"
                placeholder={isTh ? 'เช่น พิกัดสินค้า HS Code / ชื่อท่าเรือ' : 'e.g. HS Code Mismatch'}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isTh ? 'ข้อความ Badge สถานะ' : 'Badge Status Label'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  placeholder="เช่น ผิดแน่นอนจากเอกสาร, ตัวเลขไม่ครบ"
                />
                <select
                  value={newBadgeType}
                  onChange={(e) => setNewBadgeType(e.target.value as DiscrepancyBadgeType)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="critical">Critical (ผิดแน่นอน)</option>
                  <option value="incomplete_number">ตัวเลขไม่ครบ</option>
                  <option value="incomplete_data">ข้อมูลไม่ครบ</option>
                  <option value="warning">Warning</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isTh ? 'รายละเอียดเปรียบเทียบ (บรรทัดละ 1 ข้อความ)' : 'Comparison Bullets (1 per line)'}
            </label>
            <textarea
              rows={3}
              placeholder={isTh ? "SI หน้า 1: 1,800 CARTONS\nDraft B/L หน้า 1: 1,600 CARTONS" : "SI Page 1: ...\nDraft B/L: ..."}
              value={newBullets}
              onChange={(e) => setNewBullets(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isTh ? 'ข้อความสรุปวิเคราะห์ด้านล่าง (ไม่บังคับ)' : 'Bottom Explanation (Optional)'}
            </label>
            <input
              type="text"
              placeholder={isTh ? 'เช่น Draft B/L ขาดจำนวน 200 ลังเมื่อเทียบกับ SI' : 'Summary conclusion'}
              value={newExplanation}
              onChange={(e) => setNewExplanation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              {isTh ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow"
            >
              {isTh ? 'บันทึกเข้าตาราง' : 'Save Discrepancy'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 text-xs">
        <span className="text-slate-400 font-medium mr-2 hidden sm:inline">{isTh ? 'ตัวกรอง:' : 'Filter:'}</span>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {isTh ? 'ทั้งหมด' : 'All'} ({cards.length})
        </button>
        <button
          onClick={() => setFilter('incomplete_number')}
          className={`px-3 py-1 rounded-full font-medium transition-colors ${
            filter === 'incomplete_number'
              ? 'bg-rose-900 text-rose-200 border border-rose-700'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {isTh ? 'ตัวเลขไม่ครบ' : 'Incomplete Numbers'}
        </button>
        <button
          onClick={() => setFilter('incomplete_data')}
          className={`px-3 py-1 rounded-full font-medium transition-colors ${
            filter === 'incomplete_data'
              ? 'bg-rose-900 text-rose-200 border border-rose-700'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {isTh ? 'ข้อมูลไม่ครบ' : 'Incomplete Data'}
        </button>
      </div>

      {/* Discrepancy Cards List (EXACTLY MATCHING USER'S SCREENSHOT) */}
      <div className="space-y-4">
        {filteredCards.map((card) => {
          return (
            <div
              key={card.id}
              className="relative bg-black rounded-xl p-5 border border-zinc-800/90 shadow-2xl text-white font-sans transition-all hover:border-zinc-700"
            >
              {/* Card Header: Numbered Title + Badge */}
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    {card.title}
                  </h3>
                  <span
                    className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      card.badgeType === 'critical'
                        ? 'bg-[#371118] text-[#fca5a5] border-[#881337]'
                        : card.badgeType === 'incomplete_number'
                        ? 'bg-[#371118] text-[#fca5a5] border-[#881337]'
                        : 'bg-[#371118] text-[#fca5a5] border-[#881337]'
                    }`}
                  >
                    {card.badgeText}
                  </span>
                </div>

                {/* Optional Delete for user-added */}
                {onUpdateCards && (
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="text-zinc-600 hover:text-rose-400 p-1 transition-colors"
                    title={isTh ? 'ลบรายการ' : 'Delete item'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Layout Type 1: Table Metric Layout (Measurement / CBM) */}
              {card.layoutType === 'table_metric' && (
                <div className="space-y-4">
                  {/* Two Main Key-Value Rows */}
                  <div className="divide-y divide-zinc-900">
                    {card.metrics?.map((metric, idx) => (
                      <div
                        key={idx}
                        className="flex items-baseline justify-between py-2.5 first:pt-0"
                      >
                        <span className="text-base text-zinc-300 font-normal">
                          {metric.label}
                        </span>
                        <div className="text-right">
                          <span className="text-lg font-bold tracking-wide text-white font-mono">
                            {metric.value}
                          </span>
                          {metric.subtext && (
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {metric.subtext}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Highlight Result Section */}
                  {(card.diffHighlight || card.subnote || card.bullets) && (
                    <div className="pt-2 border-t border-zinc-900 space-y-1.5">
                      {card.diffHighlight && (
                        <div className="text-base font-bold text-white tracking-wide">
                          {card.diffHighlight}
                        </div>
                      )}
                      {card.subnote && (
                        <div className="text-sm text-zinc-200">
                          {card.subnote}
                        </div>
                      )}
                      {card.bullets && card.bullets.length > 0 && (
                        <ul className="space-y-1 pt-1">
                          {card.bullets.map((b, bIdx) => (
                            <li
                              key={bIdx}
                              className="text-sm text-zinc-300 flex items-start gap-2"
                            >
                              <span className="text-zinc-400 select-none">•</span>
                              <span className="font-mono">{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Layout Type 2: Bullet List & Explanation Layout (Shipper / Consignee Tax ID) */}
              {card.layoutType === 'bullet_list' && (
                <div className="space-y-3">
                  {/* Bullets */}
                  {card.bullets && card.bullets.length > 0 && (
                    <ul className="space-y-2">
                      {card.bullets.map((b, bIdx) => {
                        // Highlighting logic for numbers or key parts
                        return (
                          <li
                            key={bIdx}
                            className="text-sm text-zinc-200 flex items-start gap-2 leading-relaxed"
                          >
                            <span className="text-zinc-400 select-none font-bold">•</span>
                            <div className="break-words font-sans">
                              {b.includes(':') ? (
                                <>
                                  <span className="font-medium text-zinc-300">
                                    {b.split(':')[0]}:
                                  </span>
                                  <span className="font-mono text-white ml-1.5 bg-zinc-900/60 px-1.5 py-0.5 rounded border border-zinc-800">
                                    {b.slice(b.indexOf(':') + 1).trim()}
                                  </span>
                                </>
                              ) : (
                                <span>{b}</span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Explanation note at the bottom */}
                  {card.explanation && (
                    <div className="pt-2 text-sm font-semibold text-zinc-100 tracking-wide">
                      {card.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredCards.length === 0 && (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
            <AlertOctagon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm">ไม่พบข้อความที่ตรงกับตัวกรองที่เลือก</p>
          </div>
        )}
      </div>

      {/* Footer Info Box */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-slate-300 font-medium">
            {isTh
              ? 'คำแนะนำในการแก้ไขเอกสารกับสายเรือ (Maritime Amendment Process)'
              : 'Recommendation for B/L Amendment with Carriers'}
          </p>
          <p>
            {isTh
              ? 'เมื่อตรวจพบจุดผิดพลาดข้างต้น ควรส่งหนังสือขอแก้ไขร่าง B/L (Draft B/L Amendment Form) แจ้งสายเรือทันที โดยแนบ Shipping Instruction (SI) ฉบับอนุมัติล่าสุดก่อนเรือตัดรอบเอกสาร (B/L Closing Time) เพื่อหลีกเลี่ยงค่าปรับ Amendment Fee และปัญหาการเดินพิธีการศุลกากรปล่อยของที่ท่าปลายทาง'
              : 'Send a formal B/L Amendment Request immediately with approved SI before documentation closing time to avoid shipping line amendment surcharges and customs clearance delays.'}
          </p>
        </div>
      </div>
    </div>
  );
};

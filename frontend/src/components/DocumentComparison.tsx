import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Filter,
  Layers,
  ArrowRightLeft,
  Search,
  ExternalLink,
  ChevronRight,
  Maximize2,
  FileCheck2,
  FileSpreadsheet,
  PenTool,
  Sparkles,
  Info,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { COMPARISON_SCENARIOS, DEFAULT_DISCREPANCY_CARDS } from '../services/sampleData';
import { runDocumentComparison } from '../services/comparator';
import { DiscrepancySummaryCards } from './DiscrepancySummaryCards';
import { DocumentPane, CommentItem } from './DocumentPane';
import { DiscrepancyCardItem } from '../types/discrepancyCard';
import { ComparisonScenario, DiscrepancyItem } from '../types/shipping';

interface DocumentComparisonProps {
  language: 'th' | 'en';
  defaultScenarioId?: string;
  onCountsUpdate?: (matches: number, mismatches: number) => void;
}

// DiffText component matching the original frontend/src/App.jsx
const DiffText: React.FC<{ diffData: { tag: 'equal' | 'delete' | 'insert'; value: string }[] }> = ({
  diffData,
}) => {
  if (!diffData || diffData.length === 0) return null;
  return (
    <>
      {diffData.map((part, index) => {
        let style: React.CSSProperties = {};
        if (part.tag === 'equal') {
          style = { color: '#22c55e', fontWeight: 500 };
        } else if (part.tag === 'delete' || part.tag === 'insert') {
          style = {
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            borderRadius: '2px',
            padding: '1px 3px',
            fontWeight: 700,
            borderBottom: '2px solid #ef4444',
          };
        }
        return (
          <span key={index} style={style}>
            {part.value}
          </span>
        );
      })}
    </>
  );
};

export const DocumentComparison: React.FC<DocumentComparisonProps> = ({
  language,
  defaultScenarioId = 'si_vs_draft_bl_audit',
  onCountsUpdate,
}) => {
  const isTh = language === 'th';

  // State
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(defaultScenarioId);
  const [viewMode, setViewMode] = useState<'summary_cards' | 'visual_docs' | 'diff_table'>(
    'summary_cards'
  );
  const [severityFilter, setSeverityFilter] = useState<'all' | 'warning' | 'mismatch'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDiffCardList, setActiveDiffCardList] = useState<DiscrepancyCardItem[]>(
    DEFAULT_DISCREPANCY_CARDS
  );

  // Spotlight and Annotation State (Matching thassanawalai/MLT_DocumentCompare)
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [isCommenting, setIsCommenting] = useState<boolean>(false);
  const [pdfComments, setPdfComments] = useState<CommentItem[]>([]);

  // Active scenario
  const currentScenario = useMemo(() => {
    return (
      COMPARISON_SCENARIOS.find((s) => s.id === selectedScenarioId) ||
      COMPARISON_SCENARIOS[0]
    );
  }, [selectedScenarioId]);

  // Titles for left and right panes
  const leftTitle = `${isTh ? 'Shipping Instruction (SI)' : 'Shipping Instruction (SI)'} - ${currentScenario.shipperCompany}`;
  const rightTitle = `${isTh ? 'Draft Bill of Lading (B/L)' : 'Draft Bill of Lading (B/L)'} - ${currentScenario.carrierCompany}`;

  // Run comparator
  const comparisonResult = useMemo(() => {
    return runDocumentComparison(currentScenario.siData, currentScenario.blData);
  }, [currentScenario]);

  // Synchronize count updates with parent component safely after render
  useEffect(() => {
    if (onCountsUpdate) {
      onCountsUpdate(comparisonResult.matchCount, comparisonResult.mismatchCount);
    }
  }, [comparisonResult.matchCount, comparisonResult.mismatchCount, onCountsUpdate]);

  // When scenario changes, update cards
  const handleScenarioChange = (id: string) => {
    setSelectedScenarioId(id);
    setSelectedField(null);
    setHoveredField(null);
    setPdfComments([]);

    if (id === 'si_vs_draft_bl_audit') {
      setActiveDiffCardList(DEFAULT_DISCREPANCY_CARDS);
    } else {
      // Auto-generate cards from scenario discrepancies
      const target = COMPARISON_SCENARIOS.find((s) => s.id === id);
      if (target) {
        const res = runDocumentComparison(target.siData, target.blData);
        const mismatches = res.discrepancies.filter((d) => !d.isMatch);
        const generatedCards: DiscrepancyCardItem[] = mismatches.map((item, idx) => {
          const isNumeric = /\d+/.test(item.original_value.value) && /\d+/.test(item.program_value.value);
          return {
            id: `gen-${item.field}-${idx}`,
            order: idx + 1,
            title: `${idx + 1}. ${isTh ? item.fieldNameTh : item.fieldNameEn}`,
            badgeText:
              item.severity === 'critical'
                ? isTh
                  ? 'ผิดแน่นอนจากเอกสาร'
                  : 'Critical Error'
                : isNumeric
                ? isTh
                  ? 'ตัวเลขไม่ครบ/ไม่ตรง'
                  : 'Value Mismatch'
                : isTh
                ? 'ข้อมูลไม่ครบ'
                : 'Warning',
            badgeType: item.severity === 'critical' ? 'critical' : 'incomplete_number',
            layoutType: item.field === 'measurement' || item.field === 'gross_weight' ? 'table_metric' : 'bullet_list',
            metrics:
              item.field === 'measurement' || item.field === 'gross_weight'
                ? [
                    { label: 'Shipping Instruction (SI)', value: item.original_value.value, subtext: 'หน้า 1' },
                    { label: 'Draft B/L', value: item.program_value.value, subtext: 'หน้า 1' },
                  ]
                : undefined,
            bullets: [
              `SI: ${item.original_value.value.replace(/\n/g, ' ')}`,
              `Draft B/L: ${item.program_value.value.replace(/\n/g, ' ')}`,
            ],
            explanation: isTh
              ? `พบความไม่สอดคล้องกันในส่วน ${item.fieldNameTh} ซึ่งอาจส่งผลต่อการตรวจปล่อยสินค้า`
              : `Discrepancy detected in ${item.fieldNameEn}`,
            fieldKey: item.field,
            category: item.category,
          };
        });
        setActiveDiffCardList(generatedCards.length > 0 ? generatedCards : DEFAULT_DISCREPANCY_CARDS);
      }
    }
  };

  // Filter diff items for table view
  const filteredDiscrepancies = useMemo(() => {
    return comparisonResult.discrepancies.filter((item) => {
      if (severityFilter === 'warning' && item.severity !== 'warning') return false;
      if (severityFilter === 'mismatch' && item.isMatch) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchField =
          item.field.toLowerCase().includes(q) ||
          item.fieldNameEn.toLowerCase().includes(q) ||
          item.fieldNameTh.toLowerCase().includes(q);
        const matchVal =
          item.original_value.value.toLowerCase().includes(q) ||
          item.program_value.value.toLowerCase().includes(q);
        if (!matchField && !matchVal) return false;
      }
      return true;
    });
  }, [comparisonResult.discrepancies, severityFilter, searchQuery]);

  // Export to Excel
  const handleExportExcel = () => {
    const dataRows = comparisonResult.discrepancies.map((d, i) => ({
      'No.': i + 1,
      'Field Code': d.field,
      'Field (TH)': d.fieldNameTh,
      'Field (EN)': d.fieldNameEn,
      'Status': d.isMatch ? 'MATCH' : 'MISMATCH',
      'Severity': d.severity.toUpperCase(),
      'Category': d.category.toUpperCase(),
      'Shipping Instruction (SI)': d.original_value.value,
      'Draft B/L': d.program_value.value,
      'Normalized SI': d.original_value.clean_value,
      'Normalized B/L': d.program_value.clean_value,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SI_vs_BL_Audit');
    XLSX.writeFile(workbook, `SI_vs_BL_Discrepancy_Report_${selectedScenarioId}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Scenario Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30">
                {isTh ? 'ชุดเอกสารตรวจสอบ' : 'Verification Set'}
              </span>
              <span className="text-xs text-slate-400">
                Mode: {currentScenario.mode}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {isTh ? currentScenario.titleTh : currentScenario.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {currentScenario.description}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <div className="text-center px-2">
              <span className="text-xs text-slate-400 block">{isTh ? 'ตรงกัน' : 'Matched'}</span>
              <span className="text-base font-bold text-emerald-400">
                {comparisonResult.matchCount}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center px-2">
              <span className="text-xs text-slate-400 block">{isTh ? 'ไม่ตรงกัน' : 'Mismatches'}</span>
              <span className="text-base font-bold text-rose-400">
                {comparisonResult.mismatchCount}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center px-2">
              <span className="text-xs text-slate-400 block">{isTh ? 'รวมฟิลด์' : 'Total'}</span>
              <span className="text-base font-bold text-slate-200">
                {comparisonResult.totalChecked}
              </span>
            </div>
          </div>
        </div>

        {/* Scenario Carousel / Quick Selectors */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <label className="block text-xs font-medium text-slate-400 mb-2">
            {isTh ? 'เลือกชุดเคสตัวอย่างเพื่อตรวจสอบ:' : 'Select Comparison Scenario:'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {COMPARISON_SCENARIOS.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              const isAuditCase = sc.id === 'si_vs_draft_bl_audit';
              return (
                <button
                  key={sc.id}
                  onClick={() => handleScenarioChange(sc.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all text-xs relative ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500 text-white shadow-md shadow-blue-500/10'
                      : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {isAuditCase && (
                    <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-rose-600 text-[9px] font-bold text-white rounded-full uppercase shadow">
                      {isTh ? 'ตามรูปภาพ' : 'Sample'}
                    </span>
                  )}
                  <p className="font-semibold truncate pr-2">
                    {sc.shipperCompany} vs {sc.carrierCompany}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {sc.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main View Mode Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setViewMode('summary_cards')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              viewMode === 'summary_cards'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isTh ? 'ตารางสรุปความแตกต่าง (ดังรูปตัวอย่าง)' : 'Discrepancy Cards (Reference)'}</span>
          </button>

          <button
            onClick={() => setViewMode('visual_docs')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              viewMode === 'visual_docs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isTh ? 'Document Preview & Bounding Box Spotlight (แบบโค้ดเดิม)' : 'Document Preview & Bounding Box Spotlight'}</span>
          </button>

          <button
            onClick={() => setViewMode('diff_table')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              viewMode === 'diff_table'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{isTh ? 'ตารางเปรียบเทียบทุกฟิลด์ (Diff Table)' : 'Full Comparison Table'}</span>
          </button>
        </div>

        {/* Auxiliary Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg border border-emerald-600 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isTh ? 'ส่งออก Excel' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: SUMMARY CARDS (EXACTLY MATCHING USER'S SCREENSHOT) */}
      {viewMode === 'summary_cards' && (
        <DiscrepancySummaryCards
          cards={activeDiffCardList}
          onUpdateCards={setActiveDiffCardList}
          language={language}
          scenarioTitle={currentScenario.titleTh}
          referenceImagePath="/assets/aistudio/image_e141cb17.png"
        />
      )}

      {/* VIEW MODE 2: DOCUMENT PREVIEW & BOUNDING BOX SPOTLIGHT (AUTHENTIC FROM thassanawalai/MLT_DocumentCompare) */}
      {viewMode === 'visual_docs' && (
        <div className="space-y-6">
          {/* Section Divider Bar (matching App.jsx in MLT_DocumentCompare) */}
          <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-bold uppercase tracking-wider text-white">
                Document Preview & Bounding Box Spotlight
              </span>
              <span className="text-slate-400 hidden sm:inline">
                ({isTh ? 'คลิกหรือวางเมาส์เพื่อไฮไลต์พิกัดและฟิลด์ที่ตรวจพบ' : 'Hover/click to spotlight bounding boxes'})
              </span>
            </div>

            {/* Commenting Tool Trigger */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCommenting(!isCommenting)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  isCommenting
                    ? 'bg-rose-950 text-rose-300 border-rose-700 shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  {isCommenting
                    ? isTh
                      ? '✏️ ปิดโหมดคอมเมนต์'
                      : 'Close Annotations'
                    : isTh
                    ? '✏️ ขีดฆ่า / เพิ่มคอมเมนต์บน B/L'
                    : 'Annotate / Strike B/L'}
                </span>
                {pdfComments.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px]">
                    {pdfComments.length}
                  </span>
                )}
              </button>

              {pdfComments.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPdfComments([])}
                  className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1"
                  title="ล้างคอมเมนต์ทั้งหมด"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>

          {/* Side-by-Side Document Panes (Grid 1fr 1fr with Headers) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: Shipping Instruction (SI) */}
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-900">
              <div className="bg-slate-950 px-4 py-2.5 flex items-center gap-2.5 border-b border-slate-800">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-200 text-xs font-bold truncate">
                  {leftTitle}
                </span>
              </div>
              <DocumentPane
                title={leftTitle}
                fileData={{ data: currentScenario.siData }}
                discrepancies={comparisonResult.discrepancies}
                selectedField={selectedField}
                setSelectedField={setSelectedField}
                hoveredField={hoveredField}
                setHoveredField={setHoveredField}
                drawHighlights={false}
                enableComments={false}
              />
            </div>

            {/* Right: Bill of Lading (B/L) */}
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-900">
              <div className="bg-slate-950 px-4 py-2.5 flex items-center gap-2.5 border-b border-slate-800">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-slate-200 text-xs font-bold truncate">
                  {rightTitle}
                </span>
              </div>
              <DocumentPane
                title={rightTitle}
                fileData={{ data: currentScenario.blData }}
                discrepancies={comparisonResult.discrepancies}
                selectedField={selectedField}
                setSelectedField={setSelectedField}
                hoveredField={hoveredField}
                setHoveredField={setHoveredField}
                drawHighlights={true}
                enableComments={isCommenting}
                comments={pdfComments}
                onAddComment={(cmt) => setPdfComments((prev) => [...prev, cmt])}
                onUpdateComment={(id, updated) =>
                  setPdfComments((prev) => prev.map((c) => (c.id === id ? updated : c)))
                }
                onDeleteComment={(id) => setPdfComments((prev) => prev.filter((c) => c.id !== id))}
                isBl={true}
              />
            </div>
          </div>

          {/* Discrepancies Table with Synchronized Spotlight (Directly from MLT_DocumentCompare App.jsx) */}
          <div
            className={`border rounded-xl shadow-2xl overflow-hidden bg-slate-950 ${
              comparisonResult.discrepancies.length > 0 ? 'border-rose-900/60' : 'border-emerald-900/60'
            }`}
          >
            {/* Table Header Banner */}
            <div
              className={`p-4 flex items-center justify-between border-b ${
                comparisonResult.discrepancies.length > 0
                  ? 'bg-rose-950/40 border-rose-900/50 text-rose-300'
                  : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {comparisonResult.discrepancies.some((d) => !d.isMatch) ? (
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
                <h3 className="font-bold text-sm tracking-wide">
                  {isTh
                    ? `รายการข้อผิดพลาด: ตรวจพบ ${comparisonResult.mismatchCount} จุดที่ต่างกัน (คลิกแถวเพื่อส่อง Spotlight ไปยังเอกสาร)`
                    : `Discrepancies List: ${comparisonResult.mismatchCount} found`}
                </h3>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {isTh ? 'ส่องแสงไปยัง Bounding Box อัตโนมัติ' : 'Auto Bounding Box Sync'}
              </span>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 border-b border-slate-800">
                    <th className="py-3 px-4 w-1/4 font-bold">{isTh ? 'ชื่อฟิลด์ (Field Name)' : 'Field Name'}</th>
                    <th className="py-3 px-4 w-3/8 font-bold text-emerald-400">{leftTitle}</th>
                    <th className="py-3 px-4 w-3/8 font-bold text-blue-400">{rightTitle}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {comparisonResult.discrepancies
                    .filter((d) => !d.isMatch)
                    .map((diff, idx) => {
                      const isSelectedRow = selectedField === diff.field;
                      const isHoveredRow = hoveredField === diff.field;

                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedField(diff.field)}
                          onMouseEnter={() => setHoveredField(diff.field)}
                          onMouseLeave={() => setHoveredField(null)}
                          className={`cursor-pointer transition-colors ${
                            isSelectedRow
                              ? 'bg-amber-950/40 border-l-4 border-amber-400 text-white'
                              : isHoveredRow
                              ? 'bg-blue-950/30'
                              : 'hover:bg-slate-900/40'
                          }`}
                        >
                          <td className="py-3 px-4 align-top font-sans">
                            <span className="font-bold text-slate-200 block">
                              {diff.fieldNameTh || diff.field.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {diff.field}
                            </span>
                          </td>

                          {/* SI Raw Text */}
                          <td className="py-3 px-4 align-top text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {diff.original_value.value || '(ว่าง)'}
                          </td>

                          {/* B/L Diff with Highlighting */}
                          <td className="py-3 px-4 align-top text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {diff.program_value.diff ? (
                              <DiffText diffData={diff.program_value.diff} />
                            ) : (
                              diff.program_value.value || '(ว่าง)'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: FULL DIFF TABLE WITH SEARCH */}
      {viewMode === 'diff_table' && (
        <div className="space-y-4">
          {/* Table Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={isTh ? 'ค้นหาชื่อฟิลด์หรือเนื้อหา...' : 'Search field or value...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              <span className="text-xs text-slate-400 mr-1">{isTh ? 'กรอง:' : 'Filter:'}</span>
              <button
                onClick={() => setSeverityFilter('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium ${
                  severityFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isTh ? 'ทั้งหมด' : 'All'} ({comparisonResult.totalChecked})
              </button>
              <button
                onClick={() => setSeverityFilter('mismatch')}
                className={`px-2.5 py-1 rounded text-xs font-medium ${
                  severityFilter === 'mismatch'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isTh ? 'เฉพาะที่ไม่ตรง' : 'Mismatches only'} ({comparisonResult.mismatchCount})
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-semibold">
                    <th className="py-3 px-4 w-48">{isTh ? 'รายการฟิลด์' : 'Field'}</th>
                    <th className="py-3 px-4 w-28 text-center">{isTh ? 'สถานะ' : 'Status'}</th>
                    <th className="py-3 px-4 flex-1">
                      {isTh ? 'Shipping Instruction (SI)' : 'Shipping Instruction (SI)'}
                    </th>
                    <th className="py-3 px-4 flex-1">
                      {isTh ? 'Draft B/L' : 'Draft B/L'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredDiscrepancies.map((item) => {
                    return (
                      <tr
                        key={item.field}
                        className={`transition-colors ${
                          item.isMatch
                            ? 'hover:bg-slate-900/40'
                            : item.severity === 'critical'
                            ? 'bg-rose-950/20 hover:bg-rose-950/30'
                            : 'bg-amber-950/15 hover:bg-amber-950/25'
                        }`}
                      >
                        <td className="py-3 px-4 align-top font-sans">
                          <p className="font-semibold text-slate-200">
                            {isTh ? item.fieldNameTh : item.fieldNameEn}
                          </p>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {item.field}
                          </span>
                        </td>

                        <td className="py-3 px-4 align-top text-center font-sans">
                          {item.isMatch ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              {isTh ? 'ตรงกัน' : 'Match'}
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                item.severity === 'critical'
                                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                                  : 'bg-amber-950 text-amber-300 border-amber-800'
                              }`}
                            >
                              <AlertCircle className="w-3 h-3" />
                              {item.severity === 'critical' ? (isTh ? 'วิกฤต' : 'Critical') : (isTh ? 'คลาดเคลื่อน' : 'Diff')}
                            </span>
                          )}
                        </td>

                        {/* SI Value */}
                        <td className="py-3 px-4 align-top text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {item.original_value.diff.map((chunk, cIdx) => (
                            <span
                              key={cIdx}
                              className={
                                chunk.tag === 'delete'
                                  ? 'bg-rose-600/30 text-rose-300 border-b-2 border-rose-500 font-bold px-0.5 rounded'
                                  : ''
                              }
                            >
                              {chunk.value}
                            </span>
                          ))}
                        </td>

                        {/* B/L Value */}
                        <td className="py-3 px-4 align-top text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {item.program_value.diff.map((chunk, cIdx) => (
                            <span
                              key={cIdx}
                              className={
                                chunk.tag === 'insert'
                                  ? 'bg-emerald-600/30 text-emerald-300 border-b-2 border-emerald-500 font-bold px-0.5 rounded'
                                  : ''
                              }
                            >
                              {chunk.value}
                            </span>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

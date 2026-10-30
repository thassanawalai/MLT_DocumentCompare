import React from 'react';
import {
  FileText,
  Ship,
  Anchor,
  Sparkles,
  BookOpen,
  Clock,
  Users,
  PenTool,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export type ActiveTab =
  | 'MAIN'
  | 'HBL'
  | 'MBL'
  | 'AI_COMPARE'
  | 'HS_CODE'
  | 'FREETIME'
  | 'CUSTOMERS'
  | 'SI_ENTRY'
  | 'ARCHITECTURE';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  language: 'th' | 'en';
  setLanguage: (lang: 'th' | 'en') => void;
  mismatchCount?: number;
  matchCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  mismatchCount = 0,
  matchCount = 0,
}) => {
  const isTh = language === 'th';

  const menuItems: { id: ActiveTab; label: string; desc: string; icon: any; badge?: number }[] = [
    {
      id: 'MAIN',
      label: isTh ? 'เปรียบเทียบ SI vs B/L' : 'SI vs B/L Compare',
      desc: isTh ? 'โหมดทั่วไป (General)' : 'Main Verification',
      icon: FileText,
      badge: mismatchCount > 0 ? mismatchCount : undefined,
    },
    {
      id: 'HBL',
      label: isTh ? 'HBL (Set 1)' : 'HBL Verification',
      desc: isTh ? 'SI Shipper vs HBL' : 'Shipper vs Forwarder HBL',
      icon: Ship,
    },
    {
      id: 'MBL',
      label: isTh ? 'MBL (Set 2)' : 'MBL Verification',
      desc: isTh ? 'SI Maritime vs MBL' : 'Maritime vs Carrier MBL',
      icon: Anchor,
    },
    {
      id: 'AI_COMPARE',
      label: isTh ? 'AI Deep Compare' : 'AI Deep Compare',
      desc: isTh ? 'วิเคราะห์เชิงลึกด้วย Gemini' : 'Powered by Gemini AI',
      icon: Sparkles,
    },
    {
      id: 'ARCHITECTURE',
      label: isTh ? 'ทำความเข้าใจระบบ' : 'System Architecture',
      desc: isTh ? 'คู่มือ & การทำงานเชิงลึก' : '5-Stage Pipeline Guide',
      icon: BookOpen,
    },
    {
      id: 'HS_CODE',
      label: isTh ? 'พิกัดศุลกากร HS Code' : 'HS Code Master',
      desc: isTh ? 'ค้นหาฐานข้อมูล Master' : '1,100+ HS Code Records',
      icon: Search,
    },
    {
      id: 'FREETIME',
      label: isTh ? 'ตาราง Freetime' : 'Port Freetime',
      desc: isTh ? 'คำนวณ Demurrage / Detention' : 'Port & Carrier Rules',
      icon: Clock,
    },
    {
      id: 'CUSTOMERS',
      label: isTh ? 'ข้อมูลลูกค้า (Directory)' : 'Customer Directory',
      desc: isTh ? 'ค้นหาข้อมูลบริษัทและที่อยู่' : 'Client Master Data',
      icon: Users,
    },
    {
      id: 'SI_ENTRY',
      label: isTh ? 'สร้างฟอร์ม SI Data' : 'SI Data Entry',
      desc: isTh ? 'กรอกและส่งออก Excel' : 'Export SI to Excel',
      icon: PenTool,
    },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 font-black text-xl text-white">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">
                MLT Document Compare
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/80 text-blue-300 font-medium border border-blue-700/60">
                Maritime Alliance
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {isTh
                ? 'ระบบเปรียบเทียบและตรวจสอบความถูกต้องของเอกสาร SI กับ B/L'
                : 'Shipping Instruction vs Bill of Lading Discrepancy Verification Engine'}
            </p>
          </div>
        </div>

        {/* Status / Quick Metric & Language */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400">{isTh ? 'สถานะล่าสุด:' : 'Status:'}</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {matchCount} {isTh ? 'ตรงกัน' : 'Matched'}
            </span>
            {mismatchCount > 0 && (
              <span className="inline-flex items-center gap-1 text-rose-400 font-semibold ml-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {mismatchCount} {isTh ? 'จุดต่าง' : 'Diff'}
              </span>
            )}
          </div>

          {/* Language Toggle */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setLanguage('th')}
              className={`px-2.5 py-1 rounded transition-colors ${
                language === 'th'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ไทย
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded transition-colors ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <nav className="bg-slate-950 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 py-1.5 min-w-max">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

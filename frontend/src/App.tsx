/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DocumentComparison } from './components/DocumentComparison';
import { HSCodeSearch } from './components/HSCodeSearch.tsx';
import { FreetimeCalculator } from './components/FreetimeCalculator';
import { CustomerDirectory } from './components/CustomerDirectory.tsx';
import { SIEntryForm } from './components/SIEntryForm';
import { SystemArchitecture } from './components/SystemArchitecture';
import { AIDeepCompare } from './components/AIDeepCompare';
import { Ship, Anchor, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('MAIN');
  const [language, setLanguage] = useState<'th' | 'en'>('th');
  const [matchCount, setMatchCount] = useState<number>(9);
  const [mismatchCount, setMismatchCount] = useState<number>(3);

  const isTh = language === 'th';

  const handleCountsUpdate = useCallback((matches: number, mismatches: number) => {
    setMatchCount((prev) => (prev !== matches ? matches : prev));
    setMismatchCount((prev) => (prev !== mismatches ? mismatches : prev));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        matchCount={matchCount}
        mismatchCount={mismatchCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'MAIN' && (
          <DocumentComparison
            language={language}
            defaultScenarioId="si_vs_draft_bl_audit"
            onCountsUpdate={handleCountsUpdate}
          />
        )}

        {activeTab === 'HBL' && (
          <DocumentComparison
            language={language}
            defaultScenarioId="polyplex_oocl"
            onCountsUpdate={handleCountsUpdate}
          />
        )}

        {activeTab === 'MBL' && (
          <DocumentComparison
            language={language}
            defaultScenarioId="betagro_one"
            onCountsUpdate={handleCountsUpdate}
          />
        )}

        {activeTab === 'AI_COMPARE' && <AIDeepCompare language={language} />}

        {activeTab === 'ARCHITECTURE' && <SystemArchitecture language={language} />}

        {activeTab === 'HS_CODE' && <HSCodeSearch language={language} />}

        {activeTab === 'FREETIME' && <FreetimeCalculator language={language} />}

        {activeTab === 'CUSTOMERS' && <CustomerDirectory language={language} />}

        {activeTab === 'SI_ENTRY' && <SIEntryForm language={language} />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800/80 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Anchor className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-white">MLT Maritime Document Compare</span>
            <span>•</span>
            <span>SI vs B/L Discrepancy Verification Engine</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {isTh ? 'ตรวจสอบตามมาตรฐานศุลกากรและสายเรือ' : 'Verified Maritime Customs Standard'}
            </span>
            <span>•</span>
            <button
              onClick={() => setActiveTab('ARCHITECTURE')}
              className="text-blue-400 hover:underline"
            >
              {isTh ? 'ดูขั้นตอน 5-Stage Pipeline' : '5-Stage Architecture'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

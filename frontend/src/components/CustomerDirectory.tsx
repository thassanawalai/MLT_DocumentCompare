import React, { useState } from 'react';
import { Users, Search, Building2, MapPin, Mail, Phone, CreditCard, ShieldCheck } from 'lucide-react';
import { DEFAULT_CUSTOMERS } from '../services/masterData';
import { CustomerRecord } from '../types/shipping';

interface CustomerDirectoryProps {
  language: 'th' | 'en';
}

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({ language }) => {
  const isTh = language === 'th';
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerRecord[]>(DEFAULT_CUSTOMERS);

  const filtered = customers.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const matchName = c.name.toLowerCase().includes(q);
    const matchCountry = c.country.toLowerCase().includes(q);
    const matchTax = c.identifiers.some((id) => id.value.toLowerCase().includes(q));
    const matchContact = c.contacts.some(
      (ct) => ct.name.toLowerCase().includes(q) || ct.email.toLowerCase().includes(q)
    );
    return matchName || matchCountry || matchTax || matchContact;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-semibold border border-indigo-500/30">
            {isTh ? 'สมุดรายชื่อคู่ค้าและการตรวจสอบ' : 'Customer Master Data'}
          </span>
          <span className="text-xs text-slate-400">{customers.length} Profiles</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          {isTh ? 'ไดเรกทอรีลูกค้าและการตรวจสอบเลขผู้เสียภาษี (Tax ID / VAT)' : 'Customer Directory & Entity Verification'}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          {isTh
            ? 'ใช้สำหรับตรวจสอบชื่อบริษัท ที่อยู่จดทะเบียน เลขประจำตัวผู้เสียภาษี (TAX ID) และข้อมูลสาขา เพื่อป้องกันการออก B/L ผิดพลาด'
            : 'Master records for verifying corporate names, registered addresses, tax IDs, and bank settlement details.'}
        </p>

        {/* Search */}
        <div className="mt-4 relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={isTh ? 'ค้นหาชื่อบริษัท, เลขผู้เสียภาษี, หรืออีเมล...' : 'Search company name, Tax ID, email...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-sm leading-snug">{c.name}</h3>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  {c.country}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                {c.status}
              </span>
            </div>

            {/* Identifiers (Tax ID, NTN, etc.) */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                {isTh ? 'เลขนิติบุคคล / ทะเบียนภาษี (Tax & Entity IDs)' : 'Tax & Entity Identifiers'}
              </span>
              <div className="flex flex-wrap gap-2">
                {c.identifiers.map((id, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-sky-300"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <strong>{id.type}:</strong> {id.value}
                  </span>
                ))}
              </div>
            </div>

            {/* Registered Addresses */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                {isTh ? 'ที่อยู่จดทะเบียน (Addresses)' : 'Addresses'}
              </span>
              {c.addresses.map((addr, idx) => (
                <div key={idx} className="bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
                  <span className="text-[10px] font-bold text-blue-400 block mb-0.5">
                    {addr.type} {addr.isPrimary && '(PRIMARY)'}
                  </span>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{addr.raw}</p>
                </div>
              ))}
            </div>

            {/* Contact Person */}
            {c.contacts.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-300 font-medium">{c.contacts[0].name} ({c.contacts[0].title})</span>
                <span className="text-blue-400 font-mono">{c.contacts[0].email}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

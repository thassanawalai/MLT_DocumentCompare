import React, { useState } from 'react';
import { Users, Search, Building2, MapPin, Phone, Mail, CreditCard, Copy, Check } from 'lucide-react';
import { CustomerRecord } from '../types/shipping';
import { DEFAULT_CUSTOMERS } from '../services/masterData';

interface CustomerDirectoryViewProps {
  language: 'th' | 'en';
}

export const CustomerDirectoryView: React.FC<CustomerDirectoryViewProps> = ({ language }) => {
  const isTh = language === 'th';
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = DEFAULT_CUSTOMERS.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.addresses.some((a) => a.raw.toLowerCase().includes(q) || a.city.toLowerCase().includes(q))
    );
  });

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              {isTh ? 'ไดเรกทอรีข้อมูลลูกค้า & ที่อยู่ทางการ (Customer Master Directory)' : 'Customer Master Directory'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isTh
              ? 'ตรวจสอบชื่อนิติบุคคล ที่อยู่จดทะเบียนสำนักงานใหญ่ โรงงาน และข้อมูลติดต่อที่ถูกต้องสำหรับออกเอกสาร SI / B/L'
              : 'Officially registered corporate entity names, headquarters, factory addresses, and banking credentials.'}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isTh ? 'ค้นหาชื่อบริษัทลูกค้า, จังหวัด, หรือที่อยู่...' : 'Search customer name, city, address...'}
          className="flex-1 bg-transparent text-xs text-slate-900 focus:outline-none"
        />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((customer) => (
          <div
            key={customer.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition-all"
          >
            {/* Card Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {customer.country}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {customer.status}
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm mt-2 leading-snug">
                {customer.name}
              </h3>
            </div>

            {/* Addresses */}
            <div className="p-4 flex-1 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {isTh ? 'ที่อยู่จดทะเบียน / โรงงาน' : 'Registered Addresses'}
                </span>
                <div className="mt-1 space-y-2">
                  {customer.addresses.map((addr, idx) => {
                    const copyKey = `${customer.id}-addr-${idx}`;
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 relative group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {addr.type}
                          </span>
                          <button
                            onClick={() => handleCopyText(copyKey, addr.raw)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-0.5"
                          >
                            {copiedId === copyKey ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">{isTh ? 'คัดลอกแล้ว' : 'Copied'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>{isTh ? 'คัดลอก' : 'Copy'}</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-800">{addr.raw}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contacts */}
              {customer.contacts.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {isTh ? 'ผู้ประสานงานหลัก' : 'Primary Contact'}
                  </span>
                  <div className="mt-1 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="font-bold text-slate-800">{customer.contacts[0].name}</div>
                    <div className="text-[11px] text-slate-500">{customer.contacts[0].title}</div>
                    <div className="mt-1 text-[11px] text-slate-600 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{customer.contacts[0].email}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Banking & SWIFT */}
              {customer.banks.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {isTh ? 'ข้อมูลธนาคาร & SWIFT' : 'Banking & SWIFT'}
                  </span>
                  <div className="mt-1 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-[11px] text-slate-700">
                    <div className="font-bold font-sans text-slate-900">{customer.banks[0].name}</div>
                    <div>Account: {customer.banks[0].accountNo}</div>
                    <div>SWIFT: {customer.banks[0].swift}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

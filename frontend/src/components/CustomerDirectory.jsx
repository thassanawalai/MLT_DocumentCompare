import { Fragment, useEffect, useState } from 'react';
import { apiRequest } from '../apiClient';

const styles = {
  page: { maxWidth: 1180, margin: '0 auto', padding: '32px 24px', color: '#0f172a' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, boxShadow: '0 4px 18px rgba(15,23,42,.05)' },
  muted: { color: '#64748b' },
  heading: { margin: 0, fontSize: 28, fontWeight: 750, letterSpacing: '-.02em' },
};

function DetailSection({ title, items, fields }) {
  return (
    <section>
      <h3 style={{ fontSize: 14, margin: '0 0 10px', color: '#334155' }}>{title}<span style={{ color: '#94a3b8', fontWeight: 500 }}> ({items?.length || 0})</span></h3>
      {!items?.length ? <p style={{ ...styles.muted, fontSize: 13, margin: 0 }}>No {title.toLowerCase()} on record.</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {items.map((item, index) => (
            <div key={`${title}-${index}`} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 9, background: '#fff' }}>
              {fields.map(([key, label]) => item[key] ? <div key={key} style={{ fontSize: 13, lineHeight: 1.7 }}><span style={{ color: '#64748b' }}>{label}: </span>{item[key]}</div> : null)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function CustomerDirectory() {
  const [keyword, setKeyword] = useState('');
  const [customers, setCustomers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const term = keyword.trim();
    if (!term) {
      setCustomers([]);
      setExpandedId(null);
      setError('');
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await apiRequest(`/api/v1/customers/search?keyword=${encodeURIComponent(term)}`);
        if (!cancelled) setCustomers(result);
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || 'Unable to search customers.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [keyword]);

  return (
    <main style={styles.page}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ color: '#2563eb', fontWeight: 700, fontSize: 12, letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 7 }}>Master Data</div>
        <h1 style={styles.heading}>Customer Directory</h1>
        <p style={{ ...styles.muted, margin: '7px 0 0', fontSize: 15 }}>Search companies by name, contact email, or GSTIN.</p>
      </header>

      <div style={{ ...styles.card, padding: 18, marginBottom: 16 }}>
        <label htmlFor="customer-search" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Global search</label>
        <div style={{ position: 'relative' }}>
          <span aria-hidden="true" style={{ position: 'absolute', left: 14, top: 11, color: '#64748b', fontSize: 19 }}>⌕</span>
          <input id="customer-search" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Company, email, or GSTIN" style={{ width: '100%', height: 44, border: '1px solid #cbd5e1', borderRadius: 9, padding: '0 42px', fontSize: 15, outlineColor: '#2563eb' }} />
          {keyword && <button type="button" onClick={() => setKeyword('')} aria-label="Clear search" style={{ position: 'absolute', right: 12, top: 9, border: 0, background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>×</button>}
        </div>
      </div>

      <div style={{ ...styles.card, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
          <strong>Companies</strong><span style={styles.muted}>{loading ? 'Searching…' : keyword.trim() ? `${customers.length} result${customers.length === 1 ? '' : 's'}` : 'Enter a keyword to search'}</span>
        </div>
        {error ? <div role="alert" style={{ padding: 24, color: '#b91c1c', fontSize: 14 }}>{error}</div> : !keyword.trim() ? (
          <div style={{ padding: '42px 20px', textAlign: 'center', ...styles.muted, fontSize: 14 }}>Start typing to find a customer.</div>
        ) : customers.length === 0 && !loading ? (
          <div style={{ padding: '42px 20px', textAlign: 'center', ...styles.muted, fontSize: 14 }}>No customers found. Try another keyword.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 520 }}>
              <thead><tr style={{ background: '#f8fafc', color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                <th style={{ width: 48, padding: '12px 16px' }}></th><th style={{ padding: '12px 16px' }}>Company name</th><th style={{ padding: '12px 16px' }}>Status</th><th style={{ padding: '12px 16px' }}>Country</th>
              </tr></thead>
              <tbody>{customers.map((customer) => {
                const expanded = expandedId === customer.customer_id;
                return <Fragment key={customer.customer_id}>
                  <tr key={customer.customer_id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 16px' }}><button type="button" aria-label={`${expanded ? 'Collapse' : 'Expand'} ${customer.customer_name}`} aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : customer.customer_id)} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', background: expanded ? '#eff6ff' : '#fff', color: '#2563eb', borderRadius: 7, cursor: 'pointer', fontSize: 15 }}>{expanded ? '⌄' : '›'}</button></td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 650 }}>{customer.customer_name}</td><td style={{ padding: '14px 16px', fontSize: 13, color: '#475569' }}>{customer.status || '—'}</td><td style={{ padding: '14px 16px', fontSize: 14, color: '#475569' }}>{customer.country || '—'}</td>
                  </tr>
                  {expanded && <tr key={`${customer.customer_id}-details`}><td colSpan={4} style={{ padding: '18px 24px 22px', background: '#f8fafc' }}>
                    <div style={{ display: 'grid', gap: 20 }}>
                      <DetailSection title="Addresses" items={customer.addresses} fields={[["address_type", "Type"], ["raw_address", "Address"], ["address_line1", "Line 1"], ["address_line2", "Line 2"], ["city", "City"], ["state", "State"], ["postal_code", "Postal code"], ["country", "Country"]]} />
                      <DetailSection title="Contacts" items={customer.contacts} fields={[["contact_name", "Name"], ["job_title", "Title"], ["contact_type", "Type"], ["email", "Email"], ["phone", "Phone"], ["fax", "Fax"]]} />
                      <DetailSection title="Banks" items={customer.banks} fields={[["bank_name", "Bank"], ["branch_name", "Branch"], ["bank_country", "Country"], ["swift_bic_code", "SWIFT/BIC"], ["account_no", "Account"]]} />
                      <DetailSection title="Identifiers" items={customer.identifiers} fields={[["identifier_type", "Type"], ["identifier_value", "Value"], ["issuing_country", "Country"]]} />
                    </div>
                  </td></tr>}
                </Fragment>;
              })}</tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

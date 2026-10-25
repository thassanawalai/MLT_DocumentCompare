import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest, jsonRequest } from '../apiClient';

const styles = {
  page: { maxWidth: 1180, margin: '0 auto', padding: '32px 24px', color: '#0f172a' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, boxShadow: '0 4px 18px rgba(15,23,42,.05)' },
  muted: { color: '#64748b' },
  heading: { margin: 0, fontSize: 28, fontWeight: 750, letterSpacing: '-.02em' },
};

function DetailSection({ title, items, fields, icon }) {
  return (
    <section style={{ overflow: 'hidden', border: '1px solid #dbeafe', borderRadius: 10, background: '#fff' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, padding: '12px 16px', background: '#eff6ff', color: '#123c72', fontSize: 15 }}>
        <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, background: '#dbeafe', color: '#1d4ed8', fontSize: icon === 'ID' ? 10 : 12, fontWeight: 800 }}>{icon}</span>
        {title}<span style={{ color: '#64748b', fontWeight: 500, fontSize: 12 }}>({items?.length || 0})</span>
      </h3>
      {!items?.length ? <p style={{ ...styles.muted, padding: '14px 16px', fontSize: 13, margin: 0 }}>No {title.toLowerCase()} on record.</p> : (
        <div style={{ padding: '4px 16px' }}>
          {items.map((item, index) => (
            <div key={`${title}-${index}`} style={{ padding: '12px 0', borderTop: index ? '1px solid #eaf0f8' : 0 }}>
              {fields.map(([key, label]) => item[key] ? <div key={key} style={{ marginBottom: 7, fontSize: 13, lineHeight: 1.55, overflowWrap: 'anywhere' }}><div style={{ color: '#64748b', fontSize: 11 }}>{label}</div><div style={{ color: '#0f172a', fontWeight: key === 'bank_name' ? 650 : 450 }}>{item[key]}</div></div> : null)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EditableListSection({ title, items, fields, onChange }) {
  const addItem = () => onChange([...items, Object.fromEntries(fields.map(([key]) => [key, '']))]);
  const updateItem = (index, key, value) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const removeItem = (index) => onChange(items.filter((_, itemIndex) => itemIndex !== index));

  return (
    <section style={{ gridColumn: '1 / -1', padding: 12, border: '1px solid #dbeafe', borderRadius: 9, background: '#f8fbff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <strong style={{ color: '#123c72', fontSize: 13 }}>{title}</strong>
        <button type="button" onClick={addItem} style={{ border: '1px solid #93c5fd', borderRadius: 6, padding: '5px 9px', background: '#fff', color: '#1d4ed8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
      </div>
      {!items.length && <div style={{ color: '#64748b', fontSize: 12 }}>No entries. Select Add to create one.</div>}
      <div style={{ display: 'grid', gap: 9 }}>
        {items.map((item, index) => (
          <div key={`${title}-${index}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
            {fields.map(([key, label]) => (
              <label key={key} style={{ display: 'grid', gap: 4, color: '#64748b', fontSize: 11, fontWeight: 600 }}>{label}
                <input value={item[key] || ''} onChange={(event) => updateItem(index, key, event.target.value)} style={{ minWidth: 0, height: 32, padding: '0 8px', border: '1px solid #cbd5e1', borderRadius: 6, color: '#0f172a', fontSize: 12 }} />
              </label>
            ))}
            <button type="button" onClick={() => removeItem(index)} style={{ justifySelf: 'start', alignSelf: 'end', border: 0, padding: '7px 4px', background: 'transparent', color: '#b91c1c', fontSize: 11, fontWeight: 650, cursor: 'pointer' }}>Remove</button>
          </div>
        ))}
      </div>
    </section>
  );
}

const EDIT_SECTIONS = [
  { key: 'addresses', title: 'Addresses', fields: [['address_type', 'Address type'], ['raw_address', 'Full address'], ['address_line1', 'Address line 1'], ['address_line2', 'Address line 2'], ['city', 'City'], ['state', 'State'], ['postal_code', 'Postal code']] },
  { key: 'contacts', title: 'Contacts', fields: [['contact_name', 'Contact'], ['job_title', 'Title'], ['contact_type', 'Type'], ['email', 'Email'], ['phone', 'Phone'], ['fax', 'Fax']] },
  { key: 'banks', title: 'Banks', fields: [['bank_name', 'Bank name'], ['branch_name', 'Branch'], ['bank_country', 'Country'], ['swift_bic_code', 'SWIFT / BIC']] },
  { key: 'identifiers', title: 'Identifiers', fields: [['identifier_type', 'Type'], ['identifier_value', 'Value'], ['issuing_country', 'Country']] },
];

export default function CustomerDirectory() {
  const [keyword, setKeyword] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ customer_name: '', country: '', status: '' });
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest('/api/v1/customers/search');
      if (!Array.isArray(result)) throw new Error('Customer API returned an unexpected response.');
      setCustomers(result);
    } catch (requestError) {
      setError(requestError.message || 'Unable to search customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!selectedCustomer) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedCustomer(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCustomer]);

  const startEditing = () => {
    setEditForm({
      customer_name: selectedCustomer.customer_name || '',
      country: selectedCustomer.country || '',
      status: selectedCustomer.status || '',
      addresses: (selectedCustomer.addresses || []).map((item) => ({ ...item })),
      contacts: (selectedCustomer.contacts || []).map((item) => ({ ...item })),
      banks: (selectedCustomer.banks || []).map((item) => ({ ...item })),
      identifiers: (selectedCustomer.identifiers || []).map((item) => ({ ...item })),
    });
    setActionError('');
    setEditing(true);
  };

  const saveCustomer = async (event) => {
    event.preventDefault();
    setActionBusy(true);
    setActionError('');
    try {
      const updated = await apiRequest(
        `/api/v1/customers/${selectedCustomer.customer_id}`,
        jsonRequest('PATCH', {
          customer_name: editForm.customer_name,
          country: editForm.country || null,
          status: editForm.status || null,
          ...Object.fromEntries(EDIT_SECTIONS.map(({ key }) => [
            key,
            (editForm[key] || []).filter((item) => Object.values(item).some((value) => String(value ?? '').trim())),
          ])),
        })
      );
      const refreshedCustomers = await apiRequest('/api/v1/customers/search');
      setCustomers(refreshedCustomers);
      setSelectedCustomer(refreshedCustomers.find((customer) => customer.customer_id === updated.customer_id) || null);
      setEditing(false);
    } catch (requestError) {
      setActionError(requestError.message || 'Unable to save customer changes.');
    } finally {
      setActionBusy(false);
    }
  };

  const deleteCustomer = async () => {
    if (!window.confirm(`Delete ${selectedCustomer.customer_name} and all of its related records?`)) return;
    setActionBusy(true);
    setActionError('');
    try {
      await apiRequest(`/api/v1/customers/${selectedCustomer.customer_id}`, { method: 'DELETE' });
      setCustomers((current) => current.filter((customer) => customer.customer_id !== selectedCustomer.customer_id));
      setSelectedCustomer(null);
      setEditing(false);
    } catch (requestError) {
      setActionError(requestError.message || 'Unable to delete customer.');
    } finally {
      setActionBusy(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const term = keyword.trim().toLocaleLowerCase();
    if (!term) return customers;
    return customers.filter((customer) => {
      const baseValues = Object.entries(customer)
        .filter(([, value]) => !Array.isArray(value))
        .map(([, value]) => value);
      const relatedValues = ['addresses', 'contacts', 'banks', 'identifiers']
        .flatMap((key) => (customer[key] || []).flatMap((item) => Object.values(item)));
      return [...baseValues, ...relatedValues].some((value) =>
        String(value ?? '').toLocaleLowerCase().includes(term)
      );
    });
  }, [customers, keyword]);

  return (
    <main style={styles.page}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ color: '#2563eb', fontWeight: 700, fontSize: 12, letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 7 }}>Master Data</div>
        <h1 style={styles.heading}>Customer Directory</h1>
        <p style={{ ...styles.muted, margin: '7px 0 0', fontSize: 15 }}>Search companies</p>
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
          <strong>Companies</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={styles.muted}>{loading ? 'Loading customers…' : `${filteredCustomers.length} result${filteredCustomers.length === 1 ? '' : 's'}`}</span>
            <button type="button" onClick={loadCustomers} disabled={loading} style={{ border: '1px solid #cbd5e1', borderRadius: 7, padding: '6px 10px', background: loading ? '#f1f5f9' : '#fff', color: '#2563eb', cursor: loading ? 'wait' : 'pointer', fontSize: 12, fontWeight: 650 }}>Refresh</button>
          </div>
        </div>
        {error ? <div role="alert" style={{ padding: 24, color: '#b91c1c', fontSize: 14 }}>{error}</div> : filteredCustomers.length === 0 && !loading ? (
          <div style={{ padding: '42px 20px', textAlign: 'center', ...styles.muted, fontSize: 14 }}>{keyword.trim() ? 'No customers found. Try another keyword.' : 'No customer data available.'}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 440 }}>
              <thead><tr style={{ background: '#f8fafc', color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                <th style={{ padding: '12px 20px' }}>Company</th><th style={{ padding: '12px 20px', width: 220 }}>Country</th>
              </tr></thead>
              <tbody>{filteredCustomers.map((customer) => (
                <tr key={customer.customer_id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0 20px' }}>
                    <button type="button" onClick={() => setSelectedCustomer(customer)} aria-label={`View details for ${customer.customer_name}`} style={{ width: '100%', border: 0, padding: '16px 0', textAlign: 'left', background: 'transparent', color: '#0f172a', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>
                      {customer.customer_name}
                    </button>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 14, color: '#475569' }}>{customer.country || <span aria-label="Not provided">&mdash;</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div role="presentation" onClick={() => { if (!actionBusy) { setSelectedCustomer(null); setEditing(false); } }} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15, 23, 42, .55)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="customer-dialog-title" onClick={(event) => event.stopPropagation()} style={{ width: 'min(960px, 100%)', maxHeight: 'min(90vh, 920px)', overflowY: 'auto', borderRadius: 14, background: '#f8fbff', boxShadow: '0 24px 70px rgba(15,23,42,.3)' }}>
            <header style={{ position: 'sticky', top: 0, zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, padding: '18px 22px', borderBottom: '1px solid #dbeafe', background: 'linear-gradient(105deg, #eff6ff, #f8fbff)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: '1 1 340px' }}>
                <span aria-hidden="true" style={{ display: 'inline-flex', flex: '0 0 auto', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: '#dbeafe', color: '#174a86', fontSize: 22, fontWeight: 800 }}>C</span>
                <div style={{ minWidth: 0 }}>
                  <h2 id="customer-dialog-title" style={{ margin: 0, color: '#102c5c', fontSize: 21, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{selectedCustomer.customer_name}</h2>
                  <p style={{ margin: '4px 0 0', color: '#526b8e', fontSize: 13, lineHeight: 1.45 }}>{selectedCustomer.addresses?.find((address) => address.is_primary)?.raw_address || selectedCustomer.addresses?.[0]?.raw_address || [selectedCustomer.addresses?.[0]?.address_line1, selectedCustomer.addresses?.[0]?.address_line2, selectedCustomer.addresses?.[0]?.city].filter(Boolean).join(', ') || selectedCustomer.raw_address || 'Customer profile'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'grid', justifyItems: 'end', marginRight: 8, color: '#123c72', fontSize: 13, fontWeight: 700 }}>
                  <span>{selectedCustomer.country || 'Country not provided'}</span>
                  {selectedCustomer.status && <span style={{ marginTop: 2, color: '#64748b', fontSize: 11, fontWeight: 500 }}>{selectedCustomer.status}</span>}
                </div>
                <button type="button" onClick={startEditing} disabled={actionBusy} style={{ border: '1px solid #93c5fd', borderRadius: 8, padding: '8px 12px', background: '#fff', color: '#1d4ed8', fontSize: 13, fontWeight: 700, cursor: actionBusy ? 'wait' : 'pointer' }}>Edit</button>
                <button type="button" onClick={deleteCustomer} disabled={actionBusy} style={{ border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', background: '#fff', color: '#b91c1c', fontSize: 13, fontWeight: 700, cursor: actionBusy ? 'wait' : 'pointer' }}>Delete</button>
                <button type="button" autoFocus onClick={() => { setSelectedCustomer(null); setEditing(false); }} disabled={actionBusy} aria-label="Close customer details" style={{ width: 34, height: 34, border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#334155', cursor: actionBusy ? 'wait' : 'pointer', fontSize: 20, lineHeight: 1 }}>&times;</button>
              </div>
            </header>
            <div style={{ padding: 20 }}>
              {actionError && <div role="alert" style={{ marginBottom: 14, padding: '10px 12px', border: '1px solid #fecaca', borderRadius: 8, background: '#fff1f2', color: '#b91c1c', fontSize: 13 }}>{actionError}</div>}
              {editing && (
                <form onSubmit={saveCustomer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', alignItems: 'end', gap: 12, marginBottom: 18, padding: 16, border: '1px solid #bfdbfe', borderRadius: 10, background: '#fff' }}>
                  <label style={{ display: 'grid', gap: 5, color: '#475569', fontSize: 12, fontWeight: 650 }}>Company name
                    <input required value={editForm.customer_name} onChange={(event) => setEditForm((current) => ({ ...current, customer_name: event.target.value }))} style={{ height: 36, padding: '0 10px', border: '1px solid #cbd5e1', borderRadius: 7, color: '#0f172a' }} />
                  </label>
                  <label style={{ display: 'grid', gap: 5, color: '#475569', fontSize: 12, fontWeight: 650 }}>Country
                    <input value={editForm.country} onChange={(event) => setEditForm((current) => ({ ...current, country: event.target.value }))} style={{ height: 36, padding: '0 10px', border: '1px solid #cbd5e1', borderRadius: 7, color: '#0f172a' }} />
                  </label>
                  <label style={{ display: 'grid', gap: 5, color: '#475569', fontSize: 12, fontWeight: 650 }}>Status
                    <input value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))} style={{ height: 36, padding: '0 10px', border: '1px solid #cbd5e1', borderRadius: 7, color: '#0f172a' }} />
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" disabled={actionBusy} style={{ border: 0, borderRadius: 7, padding: '9px 13px', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700, cursor: actionBusy ? 'wait' : 'pointer' }}>{actionBusy ? 'Saving...' : 'Save'}</button>
                    <button type="button" disabled={actionBusy} onClick={() => { setEditing(false); setActionError(''); }} style={{ border: '1px solid #cbd5e1', borderRadius: 7, padding: '8px 12px', background: '#fff', color: '#475569', fontSize: 12, cursor: actionBusy ? 'wait' : 'pointer' }}>Cancel</button>
                  </div>
                  {EDIT_SECTIONS.map(({ key, title, fields }) => (
                    <EditableListSection key={key} title={title} items={editForm[key] || []} fields={fields} onChange={(items) => setEditForm((current) => ({ ...current, [key]: items }))} />
                  ))}
                </form>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 16 }}>
                <DetailSection title="Address" icon="A" items={selectedCustomer.addresses} fields={[["raw_address", "Full address"], ["address_line1", "Address line 1"], ["address_line2", "Address line 2"], ["city", "City"], ["state", "State"], ["postal_code", "Postal code"], ["country", "Country"]]} />
                <DetailSection title="Contact information" icon="C" items={selectedCustomer.contacts} fields={[["contact_name", "Contact"], ["job_title", "Title"], ["email", "Email"], ["phone", "Phone"], ["fax", "Fax"]]} />
                <DetailSection title="Bank details" icon="B" items={selectedCustomer.banks} fields={[["bank_name", "Bank name"], ["branch_name", "Branch"], ["bank_country", "Country"], ["swift_bic_code", "SWIFT / BIC"]]} />
                <DetailSection title="Identifiers" icon="ID" items={selectedCustomer.identifiers} fields={[["identifier_type", "Type"], ["identifier_value", "Value"], ["issuing_country", "Country"]]} />
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

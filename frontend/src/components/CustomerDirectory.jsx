import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest, jsonRequest } from '../apiClient';

const styles = {
  page: { maxWidth: 1180, margin: '0 auto', padding: '32px 24px', color: '#0f172a' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, boxShadow: '0 4px 18px rgba(15,23,42,.05)' },
  muted: { color: '#64748b' },
  heading: { margin: 0, fontSize: 28, fontWeight: 750, letterSpacing: '-.02em' },
};

function CategoryIcon({ name, size = 20 }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const shapes = {
    company: <><path d="M3 21h18M5 21V7l7-4v18M19 21V11l-7-4" /><path d="M8 9v.01M8 12v.01M8 15v.01M14 11v.01M14 14v.01M14 17v.01M17 14v.01M17 17v.01" /></>,
    address: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    contact: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 11a3 3 0 1 0 0-6M17 15a5 5 0 0 1 3.5 5" /></>,
    bank: <><path d="m3 9 9-6 9 6M4 21h16M6 9v9M10 9v9M14 9v9M18 9v9M3 18h18" /></>,
    identifier: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M5.5 16a2.5 2.5 0 0 1 5 0M13 10h5M13 14h5" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...common}>{shapes[name]}</svg>;
}

function DetailSection({ title, items, fields, icon }) {
  return (
    <section style={{ overflow: 'hidden', border: '1px solid #dbeafe', borderRadius: 10, background: '#fff' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, padding: '12px 16px', background: '#eff6ff', color: '#123c72', fontSize: 15 }}>
        <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: '#dbeafe', color: '#1d4ed8' }}><CategoryIcon name={icon} size={18} /></span>
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
                {key === 'remark'
                  ? <textarea value={item[key] || ''} onChange={(event) => updateItem(index, key, event.target.value)} rows={3} style={{ boxSizing: 'border-box', width: '100%', minWidth: 0, padding: 8, border: '1px solid #94a3b8', borderRadius: 6, color: '#0f172a', backgroundColor: '#fff', colorScheme: 'light', fontSize: 12, resize: 'vertical' }} />
                  : <input value={item[key] || ''} onChange={(event) => updateItem(index, key, event.target.value)} style={{ minWidth: 0, height: 32, padding: '0 8px', border: '1px solid #94a3b8', borderRadius: 6, color: '#0f172a', backgroundColor: '#fff', colorScheme: 'light', fontSize: 12 }} />}
              </label>
            ))}
            <button type="button" onClick={() => removeItem(index)} style={{ justifySelf: 'start', alignSelf: 'end', border: 0, padding: '7px 4px', background: 'transparent', color: '#b91c1c', fontSize: 11, fontWeight: 650, cursor: 'pointer' }}>Remove</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function getContactType(contact) {
  const normalizedType = String(contact.contact_type || '').trim().toLowerCase();
  if (['email', 'phone', 'fax'].includes(normalizedType)) return normalizedType[0].toUpperCase() + normalizedType.slice(1);
  if (contact.email) return 'Email';
  if (contact.phone) return 'Phone';
  if (contact.fax) return 'Fax';
  return 'Email';
}

function getContactDetails(contact) {
  const type = getContactType(contact);
  return contact[type.toLowerCase()] || '';
}

function EditableContactsSection({ items, onChange }) {
  const addContact = () => onChange([...items, { contact_name: '', job_title: '', contact_type: 'Email', email: '', phone: '', fax: '' }]);
  const updateContact = (index, key, value) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const updateType = (index, nextType) => onChange(items.map((item, itemIndex) => {
    if (itemIndex !== index) return item;
    const details = getContactDetails(item);
    return {
      ...item,
      contact_type: nextType,
      email: nextType === 'Email' ? details : '',
      phone: nextType === 'Phone' ? details : '',
      fax: nextType === 'Fax' ? details : '',
    };
  }));
  const deleteContact = (index) => {
    if (!window.confirm('Delete this contact method?')) return;
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <section style={{ gridColumn: '1 / -1', padding: 12, border: '1px solid #dbeafe', borderRadius: 9, background: '#f8fbff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <strong style={{ color: '#123c72', fontSize: 13 }}>Contact Information</strong>
        <button type="button" onClick={addContact} style={{ border: '1px solid #93c5fd', borderRadius: 6, padding: '5px 9px', background: '#fff', color: '#1d4ed8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Add Contact</button>
      </div>
      {!items.length ? <div style={{ color: '#64748b', fontSize: 12, padding: '8px 2px' }}>No contact information. Select Add Contact to create one.</div> : (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
          <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead><tr style={{ background: '#eff6ff', color: '#475569', fontSize: 11 }}>
              <th style={{ padding: '9px 10px' }}>Contact Name</th>
              <th style={{ padding: '9px 10px' }}>Job Title</th>
              <th style={{ padding: '9px 10px', width: 130 }}>Contact Type</th>
              <th style={{ padding: '9px 10px' }}>Contact Details</th>
              <th style={{ padding: '9px 10px', width: 90 }}>Actions</th>
            </tr></thead>
            <tbody>{items.map((item, index) => {
              const type = getContactType(item);
              const detailKey = type.toLowerCase();
              return (
                <tr key={`contact-${index}`} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: 8 }}><input aria-label="Contact Name" value={item.contact_name || ''} onChange={(event) => updateContact(index, 'contact_name', event.target.value)} placeholder="Optional" style={contactInputStyle} /></td>
                  <td style={{ padding: 8 }}><input aria-label="Job Title" value={item.job_title || ''} onChange={(event) => updateContact(index, 'job_title', event.target.value)} placeholder="Optional" style={contactInputStyle} /></td>
                  <td style={{ padding: 8 }}>
                    <select aria-label="Contact Type" required value={type} onChange={(event) => updateType(index, event.target.value)} style={{ ...contactInputStyle, padding: '0 8px' }}>
                      <option value="Email">Email</option><option value="Phone">Phone</option><option value="Fax">Fax</option>
                    </select>
                  </td>
                  <td style={{ padding: 8 }}><input aria-label="Contact Details" required type={type === 'Email' ? 'email' : 'text'} value={item[detailKey] || ''} onChange={(event) => updateContact(index, detailKey, event.target.value)} placeholder={type === 'Email' ? 'name@company.com' : 'Enter number'} style={contactInputStyle} /></td>
                  <td style={{ padding: 8 }}><button type="button" onClick={() => deleteContact(index)} style={{ border: 0, padding: '6px 4px', background: 'transparent', color: '#b91c1c', fontSize: 12, fontWeight: 650, cursor: 'pointer' }}>Delete</button></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const contactInputStyle = { boxSizing: 'border-box', width: '100%', minWidth: 0, height: 34, padding: '0 9px', border: '1px solid #94a3b8', borderRadius: 6, color: '#0f172a', backgroundColor: '#fff', colorScheme: 'light', fontSize: 12 };

const EDIT_SECTIONS = [
  { key: 'addresses', title: 'Addresses', fields: [['address_type', 'Address type'], ['raw_address', 'Full address'], ['address_line1', 'Address line 1'], ['address_line2', 'Address line 2'], ['city', 'City'], ['state', 'State'], ['postal_code', 'Postal code']] },
  { key: 'contacts', title: 'Contacts', fields: [['contact_name', 'Contact'], ['job_title', 'Title'], ['contact_type', 'Type'], ['email', 'Email'], ['phone', 'Phone'], ['fax', 'Fax']] },
  { key: 'banks', title: 'Banks', fields: [['bank_name', 'Bank name'], ['branch_name', 'Branch'], ['bank_country', 'Country'], ['swift_bic_code', 'SWIFT / BIC']] },
  { key: 'identifiers', title: 'Identifiers', fields: [['identifier_type', 'Type'], ['identifier_value', 'Value'], ['issuing_country', 'Country']] },
  { key: 'trade_details', title: 'Trade Details', fields: [['acid_no', 'ACID NO'], ['importer_no', 'IMPORTER NO'], ['exporter_no', 'EXPORTER NO'], ['uasc_no', 'UASC NO'], ['remark', 'REMARK']] },
];

function CompanyExtraFields({ form, setForm }) {
  const fields = [
    ['acid_no', 'ACID NO'],
    ['importer_no', 'IMPORTER NO'],
    ['exporter_no', 'EXPORTER NO'],
    ['uasc_no', 'UASC NO'],
  ];

  const inputStyle = {
    ...contactInputStyle,
    height: 36,
    fontSize: 13,
  };

  return (
    <>
      {fields.map(([key, label]) => (
        <label
          key={key}
          style={{
            display: 'grid',
            gap: 5,
            color: '#475569',
            fontSize: 12,
            fontWeight: 650,
          }}
        >
          {label}
          <input
            value={form[key] || ''}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                [key]: event.target.value,
              }))
            }
            style={inputStyle}
          />
        </label>
      ))}

      <label
        style={{
          gridColumn: '1 / -1',
          display: 'grid',
          gap: 5,
          color: '#475569',
          fontSize: 12,
          fontWeight: 650,
        }}
      >
        REMARK
        <textarea
          value={form.remark || ''}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              remark: event.target.value,
            }))
          }
          placeholder="Enter remark..."
          rows={3}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '9px 10px',
            border: '1px solid #94a3b8',
            borderRadius: 7,
            color: '#0f172a',
            background: '#fff',
            fontSize: 13,
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </label>
    </>
  );
}

export default function CustomerDirectory() {
  const [keyword, setKeyword] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [addingCompany, setAddingCompany] = useState(false);
  const [addForm, setAddForm] = useState({
  customer_name: '',
  country: '',
  status: 'Active',

  acid_no: '',
  importer_no: '',
  exporter_no: '',
  uasc_no: '',
  remark: '',

  addresses: [],
  contacts: [],
  banks: [],
  identifiers: [],
  trade_details: [],
  });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ customer_name: '', country: '', status: '' });
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

      acid_no: selectedCustomer.acid_no || '',
      importer_no: selectedCustomer.importer_no || '',
      exporter_no: selectedCustomer.exporter_no || '',
      uasc_no: selectedCustomer.uasc_no || '',
      remark: selectedCustomer.remark || '',

      addresses: (selectedCustomer.addresses || []).map((item) => ({ ...item })),
      contacts: (selectedCustomer.contacts || []).map((item) => ({ ...item })),
      banks: (selectedCustomer.banks || []).map((item) => ({ ...item })),
      identifiers: (selectedCustomer.identifiers || []).map((item) => ({ ...item })),
      trade_details: (selectedCustomer.trade_details || []).map((item) => ({ ...item })),
    });
    setActionError('');
    setEditing(true);
  };

  const startAddingCompany = () => {
    setAddForm({ customer_name: '', country: '', status: 'Active', acid_no: '', importer_no: '', exporter_no: '', uasc_no: '', remark: '', addresses: [], contacts: [], banks: [], identifiers: [], trade_details: [] });
    setActionError('');
    setSuccessMessage('');
    setAddingCompany(true);
  };

  const createCompany = async (event) => {
    event.preventDefault();
    setActionBusy(true);
    setActionError('');
    try {
      const payload = {
        customer_name: addForm.customer_name,
        country: addForm.country || null,
        status: addForm.status || 'Active',
        acid_no: addForm.acid_no || null,
        importer_no: addForm.importer_no || null,
        exporter_no: addForm.exporter_no || null,
        uasc_no: addForm.uasc_no || null,
        remark: addForm.remark || null,
        
        ...Object.fromEntries(EDIT_SECTIONS.map(({ key }) => [
          key,
          (addForm[key] || []).filter((item) => key === 'contacts'
            ? String(getContactDetails(item) ?? '').trim()
            : Object.values(item).some((value) => String(value ?? '').trim())),
        ])),
      };
      const created = await apiRequest('/api/v1/customers', jsonRequest('POST', payload));
      setCustomers((current) => [...current, { ...payload, ...created }]);
      setKeyword('');
      setAddingCompany(false);
      setSuccessMessage(`${created.customer_name} was added successfully.`);
    } catch (requestError) {
      setActionError(requestError.message || 'Unable to add company.');
    } finally {
      setActionBusy(false);
    }
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
          acid_no: editForm.acid_no || null,
          importer_no: editForm.importer_no || null,
          exporter_no: editForm.exporter_no || null,
          uasc_no: editForm.uasc_no || null,
          remark: editForm.remark || null,
          
          ...Object.fromEntries(EDIT_SECTIONS.map(({ key }) => [
            key,
            (editForm[key] || []).filter((item) => key === 'contacts'
              ? String(getContactDetails(item) ?? '').trim()
              : Object.values(item).some((value) => String(value ?? '').trim())),
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
      const relatedValues = ['addresses', 'contacts', 'banks', 'identifiers', 'trade_details']
        .flatMap((key) => (customer[key] || []).flatMap((item) => Object.values(item)));
      return [...baseValues, ...relatedValues].some((value) =>
        String(value ?? '').toLocaleLowerCase().includes(term)
      );
    });
  }, [customers, keyword]);

  const sortedCustomers = useMemo(() => [...filteredCustomers].sort((left, right) => {
    const comparison = (left.customer_name || '').localeCompare(right.customer_name || '', undefined, { sensitivity: 'base' });
    return sortOrder === 'asc' ? comparison : -comparison;
  }), [filteredCustomers, sortOrder]);

  if (addingCompany) {
    return (
      <main style={styles.page}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          <div>
            <div style={{ color: '#2563eb', fontWeight: 700, fontSize: 12, letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 7 }}>Master Data</div>
            <h1 style={styles.heading}>Add Company</h1>
            <p style={{ ...styles.muted, margin: '7px 0 0', fontSize: 15 }}>Create a company profile and add its master data.</p>
          </div>
          <button type="button" onClick={() => { setAddingCompany(false); setActionError(''); }} disabled={actionBusy} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 13px', background: '#fff', color: '#334155', fontWeight: 650, cursor: actionBusy ? 'wait' : 'pointer' }}>Back to Companies</button>
        </header>
        {actionError && <div role="alert" style={{ marginBottom: 14, padding: '10px 12px', border: '1px solid #fecaca', borderRadius: 8, background: '#fff1f2', color: '#b91c1c', fontSize: 13 }}>{actionError}</div>}
        <form onSubmit={createCompany} style={{ ...styles.card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', alignItems: 'end', gap: 14, padding: 20 }}>
          <label style={{ display: 'grid', gap: 5, color: '#475569', fontSize: 12, fontWeight: 650 }}>Company Name
            <input required autoFocus value={addForm.customer_name} onChange={(event) => setAddForm((current) => ({ ...current, customer_name: event.target.value }))} placeholder="Registered company name" style={contactInputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 5, color: '#475569', fontSize: 12, fontWeight: 650 }}>Country
            <input value={addForm.country} onChange={(event) => setAddForm((current) => ({ ...current, country: event.target.value }))} placeholder="Country" style={contactInputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 5, color: '#475569', fontSize: 12, fontWeight: 650 }}>Status
            <input value={addForm.status} onChange={(event) => setAddForm((current) => ({ ...current, status: event.target.value }))} placeholder="Active" style={contactInputStyle} />
          </label>
          {EDIT_SECTIONS.map(({ key, title, fields }) => key === 'contacts'
            ? <EditableContactsSection key={key} items={addForm[key]} onChange={(items) => setAddForm((current) => ({ ...current, [key]: items }))} />
            : <EditableListSection key={key} title={title} items={addForm[key]} fields={fields} onChange={(items) => setAddForm((current) => ({ ...current, [key]: items }))} />)}
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 9, paddingTop: 4 }}>
            <button type="button" onClick={() => { setAddingCompany(false); setActionError(''); }} disabled={actionBusy} style={{ border: '1px solid #cbd5e1', borderRadius: 7, padding: '9px 13px', background: '#fff', color: '#475569', fontSize: 13, cursor: actionBusy ? 'wait' : 'pointer' }}>Cancel</button>
            <button type="submit" disabled={actionBusy} style={{ border: 0, borderRadius: 7, padding: '9px 15px', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, cursor: actionBusy ? 'wait' : 'pointer' }}>{actionBusy ? 'Adding...' : 'Add Company'}</button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <div>
          <div style={{ color: '#2563eb', fontWeight: 700, fontSize: 12, letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 7 }}>Master Data</div>
          <h1 style={styles.heading}>Companies</h1>
          <p style={{ ...styles.muted, margin: '7px 0 0', fontSize: 15 }}>Search and view company information</p>
        </div>
        <button type="button" onClick={startAddingCompany} style={{ border: 0, borderRadius: 8, padding: '10px 15px', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Add Company</button>
      </header>

      {successMessage && <div role="status" style={{ marginBottom: 14, padding: '10px 12px', border: '1px solid #bbf7d0', borderRadius: 8, background: '#f0fdf4', color: '#166534', fontSize: 13 }}>{successMessage}</div>}

      <div style={{ ...styles.card, padding: 18, marginBottom: 16 }}>
        <label htmlFor="customer-search" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#123c72' }}>Search Companies</label>
        <div style={{ position: 'relative' }}>
          <span aria-hidden="true" style={{ position: 'absolute', left: 14, top: 12, color: '#64748b' }}><CategoryIcon name="search" size={19} /></span>
          <input id="customer-search" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Search by company name, email, or Tax ID" style={{ width: '100%', height: 44, boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: 9, padding: '0 42px', fontSize: 15, outlineColor: '#2563eb', color: '#0f172a', backgroundColor: '#fff', colorScheme: 'light' }} />
          {keyword && <button type="button" onClick={() => setKeyword('')} aria-label="Clear search" style={{ position: 'absolute', right: 12, top: 9, border: 0, background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>&times;</button>}
        </div>
      </div>

      <div style={{ ...styles.card, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 18px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
          <strong>Search Results</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={styles.muted}>{loading ? 'Loading companies…' : `${filteredCustomers.length} ${filteredCustomers.length === 1 ? 'company' : 'companies'}`}</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#64748b', whiteSpace: 'nowrap' }}>Sort by
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Sort companies by name" style={{ border: '1px solid #cbd5e1', borderRadius: 7, padding: '6px 9px', color: '#123c72', backgroundColor: '#fff', colorScheme: 'light' }}>
                <option value="asc">Company Name (A-Z)</option>
                <option value="desc">Company Name (Z-A)</option>
              </select>
            </label>
            <button type="button" onClick={loadCustomers} disabled={loading} style={{ border: '1px solid #cbd5e1', borderRadius: 7, padding: '6px 10px', background: loading ? '#f1f5f9' : '#fff', color: '#2563eb', cursor: loading ? 'wait' : 'pointer', fontSize: 12, fontWeight: 650 }}>Refresh</button>
          </div>
        </div>
        {error ? <div role="alert" style={{ padding: 24, color: '#b91c1c', fontSize: 14 }}>{error}</div> : filteredCustomers.length === 0 && !loading ? (
          <div style={{ padding: '42px 20px', textAlign: 'center', ...styles.muted, fontSize: 14 }}>{keyword.trim() ? 'No customers found. Try another keyword.' : 'No customer data available.'}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 440 }}>
              <thead><tr style={{ background: '#f8fafc', color: '#64748b', fontSize: 12, letterSpacing: '.02em' }}>
                <th style={{ padding: '12px 20px' }}>Company Name</th><th style={{ padding: '12px 20px', width: 220 }}>Country</th>
              </tr></thead>
              <tbody>{sortedCustomers.map((customer) => {
                const taxIds = (customer.identifiers || []).filter((item) => item.identifier_type && item.identifier_value);
                return (
                  <tr key={customer.customer_id} onClick={() => setSelectedCustomer(customer)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedCustomer(customer); } }} tabIndex={0} aria-label={`View details for ${customer.customer_name}`} style={{ borderTop: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span aria-hidden="true" style={{ display: 'inline-flex', flex: '0 0 auto', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', color: '#2563eb' }}><CategoryIcon name="company" size={22} /></span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: '#102c5c', fontSize: 14, fontWeight: 650, overflowWrap: 'anywhere' }}>{customer.customer_name}</div>
                        {taxIds.length > 0 && <div style={{ marginTop: 4, color: '#64748b', fontSize: 12, overflowWrap: 'anywhere' }}>{taxIds.map((item) => `${item.identifier_type}: ${item.identifier_value}`).join('  |  ')}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 14, color: '#475569' }}>{customer.country || <span aria-label="Not provided">&mdash;</span>}</td>
                </tr>
              );})}</tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div role="presentation" onClick={() => { if (!actionBusy) { setSelectedCustomer(null); setEditing(false); } }} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15, 23, 42, .55)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="customer-dialog-title" onClick={(event) => event.stopPropagation()} style={{ width: 'min(960px, 100%)', maxHeight: 'min(90vh, 920px)', overflowY: 'auto', borderRadius: 14, background: '#f8fbff', boxShadow: '0 24px 70px rgba(15,23,42,.3)' }}>
            <header style={{ position: 'sticky', top: 0, zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, padding: '18px 22px', borderBottom: '1px solid #dbeafe', background: 'linear-gradient(105deg, #eff6ff, #f8fbff)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: '1 1 340px' }}>
                <span aria-hidden="true" style={{ display: 'inline-flex', flex: '0 0 auto', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: '#dbeafe', color: '#174a86' }}><CategoryIcon name="company" size={28} /></span>
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
                    <input required value={editForm.customer_name} onChange={(event) => setEditForm((current) => ({ ...current, customer_name: event.target.value }))} style={{ height: 36, padding: '0 10px', border: '1px solid #94a3b8', borderRadius: 7, color: '#0f172a', backgroundColor: '#fff', colorScheme: 'light' }} />
                  </label>
                  <label style={{ display: 'grid', gap: 5, color: '#475569', fontSize: 12, fontWeight: 650 }}>Country
                    <input value={editForm.country} onChange={(event) => setEditForm((current) => ({ ...current, country: event.target.value }))} style={{ height: 36, padding: '0 10px', border: '1px solid #94a3b8', borderRadius: 7, color: '#0f172a', backgroundColor: '#fff', colorScheme: 'light' }} />
                  </label>
                  <label style={{ display: 'grid', gap: 5, color: '#475569', fontSize: 12, fontWeight: 650 }}>Status
                    <input value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))} style={{ height: 36, padding: '0 10px', border: '1px solid #94a3b8', borderRadius: 7, color: '#0f172a', backgroundColor: '#fff', colorScheme: 'light' }} />
                  </label>


                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" disabled={actionBusy} style={{ border: 0, borderRadius: 7, padding: '9px 13px', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700, cursor: actionBusy ? 'wait' : 'pointer' }}>{actionBusy ? 'Saving...' : 'Save'}</button>
                    <button type="button" disabled={actionBusy} onClick={() => { setEditing(false); setActionError(''); }} style={{ border: '1px solid #cbd5e1', borderRadius: 7, padding: '8px 12px', background: '#fff', color: '#475569', fontSize: 12, cursor: actionBusy ? 'wait' : 'pointer' }}>Cancel</button>
                  </div>
                  {EDIT_SECTIONS.map(({ key, title, fields }) => key === 'contacts'
                    ? <EditableContactsSection key={key} items={editForm[key] || []} onChange={(items) => setEditForm((current) => ({ ...current, [key]: items }))} />
                    : <EditableListSection key={key} title={title} items={editForm[key] || []} fields={fields} onChange={(items) => setEditForm((current) => ({ ...current, [key]: items }))} />)}
                </form>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 16 }}>
                <DetailSection title="Address" icon="address" items={selectedCustomer.addresses} fields={[["raw_address", "Full address"], ["address_line1", "Address line 1"], ["address_line2", "Address line 2"], ["city", "City"], ["state", "State"], ["postal_code", "Postal code"], ["country", "Country"]]} />
                <DetailSection title="Contact information" icon="contact" items={selectedCustomer.contacts} fields={[["contact_name", "Contact"], ["job_title", "Title"], ["email", "Email"], ["phone", "Phone"], ["fax", "Fax"]]} />
                <DetailSection title="Bank details" icon="bank" items={selectedCustomer.banks} fields={[["bank_name", "Bank name"], ["branch_name", "Branch"], ["bank_country", "Country"], ["swift_bic_code", "SWIFT / BIC"]]} />
                <DetailSection title="Identifiers" icon="identifier" items={selectedCustomer.identifiers} fields={[["identifier_type", "Type"], ["identifier_value", "Value"], ["issuing_country", "Country"]]} />
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

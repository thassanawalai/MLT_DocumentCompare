import React from 'react';
import { SHIPPING_FIELDS } from '../services/templateRegistry';

const getText = (fieldValue) => {
  if (fieldValue === null || fieldValue === undefined) return '';
  if (typeof fieldValue === 'object') {
    return String(fieldValue.value ?? fieldValue.clean_value ?? '');
  }
  return String(fieldValue);
};

const getPages = (fieldValue) => {
  const boxes = Array.isArray(fieldValue?.bbox) ? fieldValue.bbox : [fieldValue?.bbox];
  const pages = [...new Set(boxes
    .map((box) => Number(box?.page))
    .filter((page) => Number.isInteger(page) && page > 0))];
  return pages;
};

const formatPages = (fieldValue, isTh) => {
  const pages = getPages(fieldValue);
  if (!pages.length) return '';
  const pageLabel = isTh ? 'หน้า' : pages.length > 1 ? 'Pages' : 'Page';
  return `${pageLabel} ${pages.join(', ')}`;
};

const findMeasurement = (value) => {
  const match = value.match(/([\d,]+(?:\.\d+)?)\s*(CBM|M\s*3|M³)(?![A-Z])/i);
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(amount) ? amount : null;
};

const findLongNumbers = (value) => value.match(/\d{8,}/g) || [];

const summarizeDifference = (item, leftText, rightText, isTh) => {
  if (!leftText.trim() || !rightText.trim()) {
    if (isTh) return !leftText.trim() ? 'ไม่มีข้อมูลในเอกสาร SI' : 'ไม่มีข้อมูลใน Draft B/L';
    return !leftText.trim() ? 'Value is missing from the SI.' : 'Value is missing from the Draft B/L.';
  }

  if (item.field === 'measurement') {
    const leftAmount = findMeasurement(leftText);
    const rightAmount = findMeasurement(rightText);
    if (leftAmount !== null && rightAmount !== null) {
      const difference = Math.abs(leftAmount - rightAmount);
      const formatted = new Intl.NumberFormat(isTh ? 'th-TH' : 'en-US', {
        maximumFractionDigits: 3,
      }).format(difference);
      return isTh ? `ผลต่าง ${formatted} CBM` : `Difference: ${formatted} CBM`;
    }
  }

  if (['shipper', 'consignee', 'notify_party'].includes(item.field)) {
    const leftIds = findLongNumbers(leftText);
    const rightIds = findLongNumbers(rightText);
    const missingId = leftIds.find((id) => !rightIds.includes(id));
    if (missingId) {
      const truncated = rightIds.find((id) => missingId.startsWith(id) && id.length < missingId.length);
      if (truncated) {
        const missingDigits = missingId.length - truncated.length;
        return isTh
          ? `Draft B/L ขาดเลขท้าย ${missingDigits} หลักเมื่อเทียบกับ SI`
          : `Draft B/L is missing the final ${missingDigits} digit(s) shown in the SI.`;
      }
      return isTh
        ? 'เลขประจำตัวใน SI ไม่พบหรือไม่ตรงกับ Draft B/L'
        : 'An identification number in the SI is missing or different in the Draft B/L.';
    }
  }

  return isTh
    ? 'ค่าระหว่างเอกสารไม่ตรงกัน โปรดตรวจสอบคำที่ไฮไลต์'
    : 'The document values differ. Review the highlighted text.';
};

const getFieldLabel = (field, isTh) => {
  const definition = SHIPPING_FIELDS[field];
  return definition ? (isTh ? definition.labelTh : definition.labelEn) : field.replace(/_/g, ' ').toUpperCase();
};

const getBadge = (item, leftText, rightText, isTh) => {
  if (!leftText.trim() || !rightText.trim()) {
    return isTh ? 'ข้อมูลไม่ครบ' : 'Missing value';
  }
  if (item.field === 'measurement') return isTh ? 'ตัวเลขไม่ตรง' : 'Value mismatch';
  if (['shipper', 'consignee', 'notify_party'].includes(item.field) && (
    findLongNumbers(leftText).length || findLongNumbers(rightText).length
  )) {
    return isTh ? 'ตรวจสอบเลขประจำตัว' : 'Check ID number';
  }
  return isTh ? 'ข้อมูลไม่ตรง' : 'Mismatch';
};

export default function DiscrepancyOverview({
  discrepancies = [],
  leftTitle,
  rightTitle,
  language = 'th',
}) {
  const isTh = language === 'th';
  const items = discrepancies.filter((item) => !item.isMatch);

  if (!items.length) return null;

  return (
    <section
      aria-label={isTh ? 'สรุปจุดที่ข้อมูลไม่ตรงกัน' : 'Discrepancy summary'}
      style={{
        marginBottom: 24,
        border: '1px solid #fecaca',
        borderLeft: '4px solid #ef4444',
        borderRadius: 12,
        background: '#fff',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
      }}
    >
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '14px 18px',
        background: '#fff7f7',
        borderBottom: '1px solid #fee2e2',
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#991b1b', fontSize: 17, fontWeight: 700 }}>
            {isTh ? 'สรุปจุดที่ข้อมูลไม่ตรงกัน' : 'Discrepancy Summary'}
          </h2>
          <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 12 }}>
            {isTh ? 'ตรวจรายการสำคัญก่อนเปิดดูรายละเอียดด้านล่าง' : 'Review these items first; detailed comparison is below.'}
          </p>
        </div>
        <span style={{
          flexShrink: 0,
          borderRadius: 999,
          background: '#fee2e2',
          color: '#991b1b',
          padding: '4px 10px',
          fontSize: 12,
          fontWeight: 700,
        }}>
          {items.length} {isTh ? 'รายการ' : items.length === 1 ? 'issue' : 'issues'}
        </span>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
        gap: 0,
      }}>
        {items.map((item, index) => {
          const leftValue = item.program_value;
          const rightValue = item.original_value;
          const leftText = getText(leftValue);
          const rightText = getText(rightValue);
          const leftPage = formatPages(leftValue, isTh);
          const rightPage = formatPages(rightValue, isTh);

          return (
            <article
              key={item.field || index}
              style={{
                padding: '16px 18px',
                borderBottom: '1px solid #e2e8f0',
                borderRight: '1px solid #f1f5f9',
                minWidth: 0,
              }}
            >
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: 14, fontWeight: 700 }}>
                  {index + 1}. {getFieldLabel(item.field, isTh)}
                </h3>
                <span style={{
                  borderRadius: 999,
                  background: '#fff1f2',
                  color: '#9f1239',
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 650,
                }}>
                  {getBadge(item, leftText, rightText, isTh)}
                </span>
              </div>

              <div style={{ display: 'grid', gap: 9 }}>
                {[
                  { title: leftTitle || (isTh ? 'Shipping Instruction (SI)' : 'Shipping Instruction (SI)'), value: leftText, page: leftPage },
                  { title: rightTitle || (isTh ? 'Draft B/L' : 'Draft B/L'), value: rightText, page: rightPage },
                ].map((row, rowIndex) => (
                  <div key={rowIndex} style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(110px, 0.38fr) minmax(0, 1fr)',
                    gap: 12,
                    alignItems: 'start',
                  }}>
                    <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>{row.title}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        color: row.value ? '#0f172a' : '#94a3b8',
                        fontSize: 13,
                        lineHeight: 1.55,
                        overflowWrap: 'anywhere',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {row.value || (isTh ? '(ว่าง)' : '(Empty)')}
                      </div>
                      {row.page && <div style={{ marginTop: 2, color: '#64748b', fontSize: 11 }}>{row.page}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 12,
                padding: '9px 11px',
                borderRadius: 8,
                background: '#fff7f7',
                color: '#9f1239',
                fontSize: 12,
                fontWeight: 650,
                lineHeight: 1.5,
              }}>
                {summarizeDifference(item, leftText, rightText, isTh)}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

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

const getIdDifference = (leftText, rightText, isTh) => {
  const leftIds = findLongNumbers(leftText);
  const rightIds = findLongNumbers(rightText);

  const missingFromRight = leftIds.find((id) => !rightIds.includes(id));
  if (missingFromRight) {
    const shortenedInRight = rightIds.find((id) => missingFromRight.startsWith(id) && id.length < missingFromRight.length);
    if (shortenedInRight) {
      const missingDigits = missingFromRight.length - shortenedInRight.length;
      return isTh
        ? 'Draft B/L ขาดเลขท้าย ' + missingDigits + ' หลักเมื่อเทียบกับ SI'
        : 'Draft B/L is missing the final ' + missingDigits + ' digit(s) shown in the SI.';
    }
    return isTh
      ? 'เลขประจำตัวใน SI ไม่พบหรือไม่ตรงกับ Draft B/L'
      : 'An identification number in the SI is missing or different in the Draft B/L.';
  }

  const missingFromLeft = rightIds.find((id) => !leftIds.includes(id));
  if (missingFromLeft) {
    const shortenedInLeft = leftIds.find((id) => missingFromLeft.startsWith(id) && id.length < missingFromLeft.length);
    if (shortenedInLeft) {
      const missingDigits = missingFromLeft.length - shortenedInLeft.length;
      return isTh
        ? 'SI ขาดเลขท้าย ' + missingDigits + ' หลักเมื่อเทียบกับ Draft B/L'
        : 'The SI is missing the final ' + missingDigits + ' digit(s) shown in the Draft B/L.';
    }
    return isTh
      ? 'เลขประจำตัวใน Draft B/L ไม่พบหรือไม่ตรงกับ SI'
      : 'An identification number in the Draft B/L is missing or different in the SI.';
  }

  return null;
};

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
    const idDifference = getIdDifference(leftText, rightText, isTh);
    if (idDifference) return idDifference;
  }

  return isTh
    ? 'ค่าระหว่างเอกสารไม่ตรงกัน โปรดตรวจสอบคำที่ไฮไลต์'
    : 'The document values differ. Review the highlighted text.';
};

const getFieldLabel = (field, isTh) => {
  const definition = SHIPPING_FIELDS[field];
  return definition ? (isTh ? definition.labelTh : definition.labelEn) : field.replace(/_/g, ' ').toUpperCase();
};

const renderDiffValue = (fieldValue, fallbackText, isTh) => {
  const chunks = Array.isArray(fieldValue?.diff) ? fieldValue.diff : [];
  if (!chunks.length) {
    return fallbackText || (isTh ? '(ว่าง)' : '(Empty)');
  }

  return chunks.map((chunk, index) => {
    const isChanged = chunk.tag === 'delete' || chunk.tag === 'insert';
    return (
      <span
        key={index}
        style={isChanged ? {
          background: '#ffe4e6',
          color: '#9f1239',
          fontWeight: 800,
          borderRadius: 5,
          padding: '0.02em 0.16em',
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
        } : { color: '#166534' }}
      >
        {chunk.value}
      </span>
    );
  });
};

const getBadge = (item, leftText, rightText, isTh) => {
  if (!leftText.trim() || !rightText.trim()) {
    return isTh ? 'ข้อมูลไม่ครบ' : 'Missing value';
  }
  if (item.field === 'measurement') return isTh ? 'ตัวเลขไม่ตรง' : 'Value mismatch';
  if (['shipper', 'consignee', 'notify_party'].includes(item.field) &&
    getIdDifference(leftText, rightText, isTh)) {
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
        padding: '20px 24px',
        background: '#fff7f7',
        borderBottom: '1px solid #fee2e2',
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#991b1b', fontSize: 34, fontWeight: 700 }}>
            {isTh ? 'สรุปจุดที่ข้อมูลไม่ตรงกัน' : 'Discrepancy Summary'}
          </h2>
          <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 24 }}>
            {isTh ? 'ตรวจรายการสำคัญก่อนเปิดดูรายละเอียดด้านล่าง' : 'Review these items first; detailed comparison is below.'}
          </p>
        </div>
        <span style={{
          flexShrink: 0,
          borderRadius: 999,
          background: '#fee2e2',
          color: '#991b1b',
          padding: '8px 16px',
          fontSize: 24,
          fontWeight: 700,
        }}>
          {items.length} {isTh ? 'รายการ' : items.length === 1 ? 'issue' : 'issues'}
        </span>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
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
                padding: '26px 30px',
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
                marginBottom: 20,
              }}>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 700 }}>
                  {index + 1}. {getFieldLabel(item.field, isTh)}
                </h3>
                <span style={{
                  borderRadius: 999,
                  background: '#fff1f2',
                  color: '#9f1239',
                  padding: '6px 14px',
                  fontSize: 22,
                  fontWeight: 650,
                }}>
                  {getBadge(item, leftText, rightText, isTh)}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
                {[
                  { title: leftTitle || 'Shipping Instruction (SI)', fieldValue: leftValue, value: leftText, page: leftPage },
                  { title: rightTitle || 'Draft B/L', fieldValue: rightValue, value: rightText, page: rightPage },
                ].map((row, rowIndex) => (
                  <div key={rowIndex} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 5,
                    minWidth: 0,
                  }}>
                    <span style={{ color: '#64748b', fontSize: 24, fontWeight: 700 }}>{row.title}</span>
                    <div style={{
                      width: '100%',
                      color: row.value ? '#0f172a' : '#94a3b8',
                      fontSize: 26,
                      lineHeight: 1.55,
                      overflowWrap: 'anywhere',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {renderDiffValue(row.fieldValue, row.value, isTh)}
                    </div>
                    {row.page && <div style={{ marginTop: 2, color: '#64748b', fontSize: 22 }}>{row.page}</div>}
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 20,
                padding: '16px 20px',
                borderRadius: 8,
                background: '#fff7f7',
                color: '#9f1239',
                fontSize: 24,
                fontWeight: 700,
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

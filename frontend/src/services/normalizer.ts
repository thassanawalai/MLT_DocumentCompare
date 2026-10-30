/**
 * Text normalizer for maritime shipping documents
 * Ported from MLT_DocumentCompare backend/app/core/normalizer.py
 */

export const ADDRESS_LIKE_FIELDS = new Set([
  'port_of_loading',
  'port_of_discharge',
  'consignee',
  'shipper',
  'notify_party',
  'place_of_receipt',
  'place_of_delivery',
]);

/**
 * Normalizes text specifically addressing maritime logistics quirks
 * - Whitespace & newline collapse
 * - Address comma flexibility
 * - Special character stripping (\u200b, \x03, \x04, ++++++)
 * - Hyphen line stripping (---)
 */
export function normalizeText(
  text: string | null | undefined,
  options?: { commasAsWhitespace?: boolean }
): string {
  if (!text) return '';

  let cleaned = String(text);

  // 1. Remove lines with 3 or more hyphens (divider lines in telex/shipping forms)
  const lines = cleaned.split('\n');
  const processedLines = lines.map((line) => {
    if (/-{3,}/.test(line)) {
      return line.replace(/-/g, '');
    }
    return line;
  });
  cleaned = processedLines.join('\n');

  // 2. Cut off at legacy telex delimiter '++++++'
  if (cleaned.includes('++++++')) {
    cleaned = cleaned.split('++++++')[0];
  }

  // 3. Remove repeated punctuation (e.g. ..... or =====)
  cleaned = cleaned.replace(/([^\w\s])\1{2,}/g, ' ');

  // 4. Strip leftover asterisks or plus signs
  cleaned = cleaned.replace(/[*+]/g, '');

  // 5. In address and port fields, treat commas as whitespace
  // (prevents "BANGKOK, THAILAND" vs "BANGKOK THAILAND" from falsely failing)
  if (options?.commasAsWhitespace) {
    cleaned = cleaned.replace(/\s*,\s*/g, ' ');
  }

  // 6. Handle hidden control chars & zero-width spaces common in PDF text extractions
  cleaned = cleaned.replace(/\u200b/g, ' ');
  cleaned = cleaned.replace(/\x03/g, ' ');
  cleaned = cleaned.replace(/\\x03/g, ' ');
  cleaned = cleaned.replace(/\x04/g, ' ');

  // 7. Collapse all multiple whitespace/newlines into a single clean space
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned.trim();
}

/**
 * Combines shipper_1 and shipper_2 if present in the data object
 * Ported from MLT_DocumentCompare backend/app/core/comparator.py
 */
export function combineShipperFields(data: Record<string, any>): Record<string, any> {
  if (!('shipper_1' in data || 'shipper_2' in data)) {
    return data;
  }

  const s1 = data['shipper_1'];
  const s2 = data['shipper_2'];

  const val1 = typeof s1 === 'object' && s1 !== null ? s1.value || '' : String(s1 || '');
  const val2 = typeof s2 === 'object' && s2 !== null ? s2.value || '' : String(s2 || '');
  const combinedValue = `${val1} ${val2}`.trim();

  const bboxes: any[] = [];
  if (s1?.bbox) {
    if (Array.isArray(s1.bbox)) bboxes.push(...s1.bbox);
    else bboxes.push(s1.bbox);
  }
  if (s2?.bbox) {
    if (Array.isArray(s2.bbox)) bboxes.push(...s2.bbox);
    else bboxes.push(s2.bbox);
  }

  const newData: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'shipper_1' || key === 'shipper_2') continue;
    newData[key] = value;
    if (key === 'booking_no') {
      newData['shipper'] = { value: combinedValue, bbox: bboxes };
    }
  }

  if (!newData['shipper']) {
    return { shipper: { value: combinedValue, bbox: bboxes }, ...newData };
  }

  return newData;
}

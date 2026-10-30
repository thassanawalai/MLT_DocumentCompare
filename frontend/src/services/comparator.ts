/**
 * Comparison Engine for Shipping Instruction (SI) vs Bill of Lading (B/L)
 * Ported and enhanced from MLT_DocumentCompare backend/app/core/comparator.py
 */

import { DiscrepancyItem, FieldItem } from '../types/shipping';
import { generateStructuredDiff } from './diffMatcher';
import { ADDRESS_LIKE_FIELDS, combineShipperFields, normalizeText } from './normalizer';
import { SHIPPING_FIELDS } from './templateRegistry';

export function runDocumentComparison(
  originalRaw: Record<string, FieldItem | string>,
  programRaw: Record<string, FieldItem | string>
): {
  normalizedOrig: Record<string, FieldItem>;
  normalizedProg: Record<string, FieldItem>;
  discrepancies: DiscrepancyItem[];
  matchCount: number;
  mismatchCount: number;
  totalChecked: number;
} {
  // Step 1: Combine shipper_1 and shipper_2 if split
  const origCombined = combineShipperFields(originalRaw);
  const progCombined = combineShipperFields(programRaw);

  const normalizedOrig: Record<string, FieldItem> = {};
  const normalizedProg: Record<string, FieldItem> = {};

  // Build list of all field keys to check
  const allKeys = Array.from(
    new Set([...Object.keys(SHIPPING_FIELDS), ...Object.keys(origCombined), ...Object.keys(progCombined)])
  );

  const discrepancies: DiscrepancyItem[] = [];
  let matchCount = 0;
  let mismatchCount = 0;

  for (const key of allKeys) {
    // Only check recognized shipping fields or provided fields
    const def = SHIPPING_FIELDS[key] || {
      key,
      labelEn: key.replace(/_/g, ' ').toUpperCase(),
      labelTh: key.replace(/_/g, ' '),
      category: 'cargo',
      severity: 'warning',
      descriptionTh: 'ฟิลด์ข้อมูลการขนส่ง',
    };

    const origObj = origCombined[key];
    const progObj = progCombined[key];

    const origVal =
      typeof origObj === 'object' && origObj !== null ? origObj.value || '' : String(origObj || '');
    const progVal =
      typeof progObj === 'object' && progObj !== null ? progObj.value || '' : String(progObj || '');

    const isAddressField = ADDRESS_LIKE_FIELDS.has(key);

    const cleanOrig = normalizeText(origVal, { commasAsWhitespace: isAddressField });
    const cleanProg = normalizeText(progVal, { commasAsWhitespace: isAddressField });

    normalizedOrig[key] = {
      value: origVal,
      clean_value: cleanOrig,
      bbox: typeof origObj === 'object' ? origObj?.bbox : undefined,
    };

    normalizedProg[key] = {
      value: progVal,
      clean_value: cleanProg,
      bbox: typeof progObj === 'object' ? progObj?.bbox : undefined,
    };

    // Determine match
    let isMatch = false;
    if (cleanOrig === cleanProg) {
      if (!cleanOrig && !cleanProg) {
        // Both empty -> match
        isMatch = true;
      } else {
        isMatch = true;
      }
    }

    if (isMatch) {
      matchCount++;
    } else {
      mismatchCount++;
    }

    const [diffOrig, diffProg] = generateStructuredDiff(cleanOrig, cleanProg);

    discrepancies.push({
      field: key,
      fieldNameEn: def.labelEn,
      fieldNameTh: def.labelTh,
      category: def.category,
      severity: def.severity,
      isMatch,
      original_value: {
        value: origVal,
        clean_value: cleanOrig,
        diff: diffOrig,
        bbox: typeof origObj === 'object' ? origObj?.bbox : undefined,
      },
      program_value: {
        value: progVal,
        clean_value: cleanProg,
        diff: diffProg,
        bbox: typeof progObj === 'object' ? progObj?.bbox : undefined,
      },
      reviewed: false,
    });
  }

  // Sort discrepancies: discrepancies first (ordered by severity: critical > warning > info), then matches
  const severityRank = { critical: 3, warning: 2, info: 1 };
  discrepancies.sort((a, b) => {
    if (a.isMatch !== b.isMatch) {
      return a.isMatch ? 1 : -1;
    }
    return severityRank[b.severity] - severityRank[a.severity];
  });

  return {
    normalizedOrig,
    normalizedProg,
    discrepancies,
    matchCount,
    mismatchCount,
    totalChecked: allKeys.length,
  };
}

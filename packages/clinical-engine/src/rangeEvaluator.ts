import { BiomarkerReading, BiomarkerStatus, ReferenceRange } from './types/clinical.js';

export const CONFIDENCE_THRESHOLD = 0.70;

export interface ParsedRange {
  low?: number;
  high?: number;
  operator?: '<' | '>' | '<=' | '>=' | 'range' | 'qualitative';
  is_present: boolean;
  raw: string;
}

/**
 * Deterministically parses a reference range string into numeric bounds.
 * NEVER infers or invents values if not specified by the lab.
 */
export function parseReferenceRangeString(rangeStr?: string): ParsedRange {
  if (!rangeStr || rangeStr.trim() === '' || rangeStr.toLowerCase().includes('unspecified') || rangeStr.toLowerCase().includes('n/a')) {
    return { is_present: false, raw: rangeStr || 'Unspecified by Laboratory' };
  }

  const clean = rangeStr.trim();

  // Pattern 1: Bounded interval (e.g. "70 - 99", "13.5 - 17.5", "70-100")
  const intervalMatch = clean.match(/^([0-9.]+)\s*[-–—to]+\s*([0-9.]+)$/i);
  if (intervalMatch) {
    const low = parseFloat(intervalMatch[1]);
    const high = parseFloat(intervalMatch[2]);
    if (!isNaN(low) && !isNaN(high)) {
      return { low, high, operator: 'range', is_present: true, raw: clean };
    }
  }

  // Pattern 2: Less than (e.g. "< 5.7", "<= 100", "<150")
  const ltMatch = clean.match(/^([<≤]|less than)\s*([0-9.]+)$/i);
  if (ltMatch) {
    const high = parseFloat(ltMatch[2]);
    if (!isNaN(high)) {
      return { high, operator: '<', is_present: true, raw: clean };
    }
  }

  // Pattern 3: Greater than (e.g. "> 60", ">= 90", ">50")
  const gtMatch = clean.match(/^([>≥]|greater than)\s*([0-9.]+)$/i);
  if (gtMatch) {
    const low = parseFloat(gtMatch[2]);
    if (!isNaN(low)) {
      return { low, operator: '>', is_present: true, raw: clean };
    }
  }

  // Pattern 4: Qualitative (e.g. "Negative", "Non-Reactive", "Normal")
  if (/negative|non-reactive|normal|undetected/i.test(clean)) {
    return { operator: 'qualitative', is_present: true, raw: clean };
  }

  return { is_present: true, raw: clean };
}

/**
 * Deterministically evaluates a test value against its explicit reference range.
 * Returns LOW, NORMAL, HIGH, CRITICAL, or UNSPECIFIED.
 */
export function evaluateBiomarkerStatus(
  testName: string,
  rawVal: number | string,
  range: ReferenceRange
): BiomarkerStatus {
  if (!range.is_present || !range.text_range || range.text_range.toLowerCase().includes('unspecified')) {
    return 'UNSPECIFIED';
  }

  const parsedRange = parseReferenceRangeString(range.text_range);
  if (!parsedRange.is_present) {
    return 'UNSPECIFIED';
  }

  // Handle qualitative values
  if (typeof rawVal === 'string' && isNaN(Number(rawVal))) {
    const valClean = rawVal.trim().toLowerCase();
    const rangeClean = range.text_range.trim().toLowerCase();
    if (rangeClean.includes('negative') || rangeClean.includes('non-reactive')) {
      const isNegative = valClean.includes('negative') || valClean.includes('non-reactive') || valClean.includes('normal') || valClean.includes('undetected');
      if (isNegative) {
        return 'NORMAL';
      }
      if (valClean.includes('positive') || valClean.includes('reactive')) {
        return 'HIGH';
      }
      return 'NORMAL';
    }
    return 'NORMAL';
  }

  const numericVal = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));
  if (isNaN(numericVal)) {
    return 'UNSPECIFIED';
  }

  // Check known critical life-threatening bounds
  const nameLower = testName.toLowerCase();
  if (nameLower.includes('potassium')) {
    if (numericVal < 2.8 || numericVal > 6.2) return 'CRITICAL';
  }
  if (nameLower.includes('glucose') && (nameLower.includes('fasting') || nameLower.includes('blood'))) {
    if (numericVal < 50 || numericVal > 380) return 'CRITICAL';
  }
  if (nameLower.includes('platelet')) {
    if (numericVal < 25) return 'CRITICAL';
  }
  if (nameLower.includes('sodium')) {
    if (numericVal < 120 || numericVal > 158) return 'CRITICAL';
  }

  // Interval evaluation
  if (parsedRange.operator === 'range' && parsedRange.low !== undefined && parsedRange.high !== undefined) {
    if (numericVal < parsedRange.low) return 'LOW';
    if (numericVal > parsedRange.high) return 'HIGH';
    return 'NORMAL';
  }

  // Less than evaluation (< X)
  if (parsedRange.operator === '<' && parsedRange.high !== undefined) {
    if (numericVal >= parsedRange.high) return 'HIGH';
    return 'NORMAL';
  }

  // Greater than evaluation (> X)
  if (parsedRange.operator === '>' && parsedRange.low !== undefined) {
    if (numericVal <= parsedRange.low) return 'LOW';
    return 'NORMAL';
  }

  return 'NORMAL';
}

/**
 * Checks whether an extracted biomarker reading should be gated / locked for human review.
 */
export function isGatedForReview(reading: BiomarkerReading): boolean {
  return reading.confidence < CONFIDENCE_THRESHOLD || reading.needs_review || reading.provenance === 'EXTRACTED_UNVERIFIED';
}

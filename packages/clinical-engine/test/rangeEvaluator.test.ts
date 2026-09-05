import { describe, it, expect } from 'vitest';
import { 
  evaluateBiomarkerStatus, 
  parseReferenceRangeString,
  CONFIDENCE_THRESHOLD,
  isGatedForReview
} from '../src/rangeEvaluator';
import { ReferenceRange, BiomarkerReading } from '../src/types/clinical';

describe('RangeEvaluator pure-function tests', () => {
  describe('parseReferenceRangeString', () => {
    it('parses bounded interval ranges (e.g. "70 - 99")', () => {
      const parsed = parseReferenceRangeString('70 - 99');
      expect(parsed.is_present).toBe(true);
      expect(parsed.operator).toBe('range');
      expect(parsed.low).toBe(70);
      expect(parsed.high).toBe(99);
    });

    it('parses less-than operator (e.g. "< 5.7")', () => {
      const parsed = parseReferenceRangeString('< 5.7');
      expect(parsed.is_present).toBe(true);
      expect(parsed.operator).toBe('<');
      expect(parsed.high).toBe(5.7);
    });

    it('parses greater-than operator (e.g. "> 60")', () => {
      const parsed = parseReferenceRangeString('> 60');
      expect(parsed.is_present).toBe(true);
      expect(parsed.operator).toBe('>');
      expect(parsed.low).toBe(60);
    });

    it('parses qualitative reference ranges (e.g. "Negative")', () => {
      const parsed = parseReferenceRangeString('Negative');
      expect(parsed.is_present).toBe(true);
      expect(parsed.operator).toBe('qualitative');
    });

    it('identifies unspecified or missing reference intervals', () => {
      const empty = parseReferenceRangeString('');
      expect(empty.is_present).toBe(false);

      const unspec = parseReferenceRangeString('Unspecified by Laboratory');
      expect(unspec.is_present).toBe(false);

      const na = parseReferenceRangeString('N/A');
      expect(na.is_present).toBe(false);
    });
  });

  describe('evaluateBiomarkerStatus', () => {
    const makeRange = (text: string, isPresent = true, low?: number, high?: number): ReferenceRange => ({
      text_range: text,
      is_present: isPresent,
      low,
      high
    });

    it('evaluates interval ranges ("70 - 99") correctly', () => {
      const range = makeRange('70 - 99');
      expect(evaluateBiomarkerStatus('Fasting Glucose', 65, range)).toBe('LOW');
      expect(evaluateBiomarkerStatus('Fasting Glucose', 85, range)).toBe('NORMAL');
      expect(evaluateBiomarkerStatus('Fasting Glucose', 125, range)).toBe('HIGH');
    });

    it('evaluates upper-bound less-than ("< 5.7") correctly', () => {
      const range = makeRange('< 5.7');
      expect(evaluateBiomarkerStatus('Hemoglobin A1c', 5.2, range)).toBe('NORMAL');
      expect(evaluateBiomarkerStatus('Hemoglobin A1c', 5.7, range)).toBe('HIGH');
      expect(evaluateBiomarkerStatus('Hemoglobin A1c', 7.4, range)).toBe('HIGH');
    });

    it('evaluates lower-bound greater-than ("> 60") correctly', () => {
      const range = makeRange('> 60');
      expect(evaluateBiomarkerStatus('eGFR', 75, range)).toBe('NORMAL');
      expect(evaluateBiomarkerStatus('eGFR', 60, range)).toBe('LOW');
      expect(evaluateBiomarkerStatus('eGFR', 45, range)).toBe('LOW');
    });

    it('evaluates qualitative results ("Negative")', () => {
      const range = makeRange('Negative');
      expect(evaluateBiomarkerStatus('Urine Leukocyte Esterase', 'Negative', range)).toBe('NORMAL');
      expect(evaluateBiomarkerStatus('Urine Leukocyte Esterase', 'Non-Reactive', range)).toBe('NORMAL');
      expect(evaluateBiomarkerStatus('Urine Leukocyte Esterase', 'Positive', range)).toBe('HIGH');
      expect(evaluateBiomarkerStatus('Urine Leukocyte Esterase', 'Reactive', range)).toBe('HIGH');
    });

    it('falls back to UNSPECIFIED when reference range is missing or unspecified', () => {
      const unspec = makeRange('Unspecified by Laboratory', false);
      expect(evaluateBiomarkerStatus('Alkaline Phosphatase', 68, unspec)).toBe('UNSPECIFIED');

      const blank = makeRange('', false);
      expect(evaluateBiomarkerStatus('Alkaline Phosphatase', 68, blank)).toBe('UNSPECIFIED');
    });

    it('applies critical threshold overrides for life-threatening values', () => {
      const standardKRange = makeRange('3.5 - 5.0');
      // Normal / High
      expect(evaluateBiomarkerStatus('Serum Potassium', 4.2, standardKRange)).toBe('NORMAL');
      expect(evaluateBiomarkerStatus('Serum Potassium', 5.3, standardKRange)).toBe('HIGH');
      // Critical overrides (< 2.8 or > 6.2)
      expect(evaluateBiomarkerStatus('Serum Potassium', 6.4, standardKRange)).toBe('CRITICAL');
      expect(evaluateBiomarkerStatus('Serum Potassium', 2.6, standardKRange)).toBe('CRITICAL');

      // Critical Fasting Glucose (< 50 or > 380)
      const glucoseRange = makeRange('70 - 99');
      expect(evaluateBiomarkerStatus('Fasting Blood Glucose', 420, glucoseRange)).toBe('CRITICAL');
      expect(evaluateBiomarkerStatus('Fasting Blood Glucose', 42, glucoseRange)).toBe('CRITICAL');

      // Critical Platelet Count (< 25)
      const plateletRange = makeRange('150 - 450');
      expect(evaluateBiomarkerStatus('Platelet Count', 18, plateletRange)).toBe('CRITICAL');
      expect(evaluateBiomarkerStatus('Platelet Count', 120, plateletRange)).toBe('LOW');
    });
  });

  describe('isGatedForReview', () => {
    it('flags readings with confidence below 0.70', () => {
      const reading: BiomarkerReading = {
        id: 'r1',
        test_name: 'ESR',
        value: 38,
        unit: 'mm/hr',
        reference_range: { text_range: '0 - 20', is_present: true },
        status: 'HIGH',
        date_collected: '2026-09-04',
        specimen_type: 'Blood',
        confidence: 0.62,
        needs_review: false,
        provenance: 'EXTRACTED_VERIFIED',
        source_snippet: 'ESR: 38'
      };
      expect(isGatedForReview(reading)).toBe(true);
    });

    it('passes verified readings with high confidence', () => {
      const reading: BiomarkerReading = {
        id: 'r2',
        test_name: 'eGFR',
        value: 75,
        unit: 'mL/min',
        reference_range: { text_range: '> 60', is_present: true },
        status: 'NORMAL',
        date_collected: '2026-09-04',
        specimen_type: 'Blood',
        confidence: 0.98,
        needs_review: false,
        provenance: 'EXTRACTED_VERIFIED',
        source_snippet: 'eGFR: 75'
      };
      expect(isGatedForReview(reading)).toBe(false);
    });
  });
});
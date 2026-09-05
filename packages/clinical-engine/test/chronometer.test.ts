import { describe, it, expect } from 'vitest';
import { calculateLongitudinalTrends } from '../src/chronometer';
import { BiomarkerReading } from '../src/types/clinical';

describe('Biomarker Chronometer pure-function tests', () => {
  const createMockReading = (
    test_name: string,
    value: number,
    date_collected: string,
    unit = 'mg/dL',
    needs_review = false
  ): BiomarkerReading => ({
    id: `read-${test_name}-${date_collected}`,
    test_name,
    value,
    unit,
    reference_range: {
      text_range: '70 - 99',
      is_present: true,
      low: 70,
      high: 99
    },
    status: 'NORMAL',
    date_collected,
    confidence: 0.98,
    needs_review,
    provenance: 'EXTRACTED_VERIFIED',
    source_snippet: `${test_name}: ${value} ${unit}`
  });

  describe('Percentage-change math and basic aggregation', () => {
    it('calculates positive delta percentage and delta absolute correctly', () => {
      const historical = [createMockReading('Fasting Blood Glucose', 100, '2026-01-01')];
      const current = [createMockReading('Fasting Blood Glucose', 120, '2026-06-01')];

      const trends = calculateLongitudinalTrends(current, historical);
      expect(trends).toHaveLength(1);

      const t = trends[0];
      expect(t.test_name).toBe('Fasting Blood Glucose');
      expect(t.previous_value).toBe(100);
      expect(t.current_value).toBe(120);
      expect(t.delta_abs).toBe(20);
      expect(t.delta_pct).toBe(20.0);
      expect(t.summary_text).toContain('+20.0% (100 → 120 mg/dL)');
      expect(t.points).toHaveLength(2);
    });

    it('calculates negative delta percentage correctly', () => {
      const historical = [createMockReading('Hemoglobin A1c', 8.0, '2026-01-01', '%')];
      const current = [createMockReading('Hemoglobin A1c', 6.8, '2026-07-01', '%')];

      const trends = calculateLongitudinalTrends(current, historical);
      expect(trends).toHaveLength(1);

      const t = trends[0];
      expect(t.delta_abs).toBe(-1.2);
      expect(t.delta_pct).toBe(-15.0);
      expect(t.summary_text).toContain('-15.0% (8 → 6.8 %)');
    });

    it('sorts readings chronologically even when passed in reversed order', () => {
      const r1 = createMockReading('Total Cholesterol', 240, '2025-06-01');
      const r2 = createMockReading('Total Cholesterol', 200, '2026-01-01');

      // Passed with newer date first
      const trends = calculateLongitudinalTrends([r1], [r2]);
      expect(trends).toHaveLength(1);
      expect(trends[0].previous_value).toBe(240);
      expect(trends[0].current_value).toBe(200);
      expect(trends[0].delta_pct).toBeCloseTo(-16.7, 1);
    });
  });

  describe('Clinical trend classification (Improving / Worsening / Stable)', () => {
    it('classifies minimal changes (< 2%) as stable', () => {
      const historical = [createMockReading('Fasting Blood Glucose', 100, '2026-01-01')];
      const current = [createMockReading('Fasting Blood Glucose', 101, '2026-06-01')]; // +1%

      const trends = calculateLongitudinalTrends(current, historical);
      expect(trends[0].clinical_trend).toBe('stable');
    });

    it('classifies reduction in harmful-when-high markers (e.g. Glucose, HbA1c, LDL) as improving', () => {
      const historical = [
        createMockReading('HbA1c', 8.4, '2026-01-01', '%'),
        createMockReading('LDL Cholesterol', 160, '2026-01-01', 'mg/dL'),
        createMockReading('Serum Creatinine', 1.8, '2026-01-01', 'mg/dL')
      ];
      const current = [
        createMockReading('HbA1c', 7.0, '2026-06-01', '%'),
        createMockReading('LDL Cholesterol', 120, '2026-06-01', 'mg/dL'),
        createMockReading('Serum Creatinine', 1.2, '2026-06-01', 'mg/dL')
      ];

      const trends = calculateLongitudinalTrends(current, historical);
      const a1cTrend = trends.find(t => t.test_name === 'HbA1c');
      const ldlTrend = trends.find(t => t.test_name === 'LDL Cholesterol');
      const creatTrend = trends.find(t => t.test_name === 'Serum Creatinine');

      expect(a1cTrend?.clinical_trend).toBe('improving');
      expect(ldlTrend?.clinical_trend).toBe('improving');
      expect(creatTrend?.clinical_trend).toBe('improving');
    });

    it('classifies increase in harmful-when-high markers as worsening', () => {
      const historical = [createMockReading('WBC Count', 7.5, '2026-01-01', 'x10^3/uL')];
      const current = [createMockReading('WBC Count', 14.5, '2026-06-01', 'x10^3/uL')];

      const trends = calculateLongitudinalTrends(current, historical);
      expect(trends[0].clinical_trend).toBe('worsening');
    });

    it('classifies increase in beneficial/protective markers (e.g. eGFR, Hemoglobin, HDL) as improving', () => {
      const historical = [
        createMockReading('eGFR', 45, '2026-01-01', 'mL/min'),
        createMockReading('Hemoglobin', 10.2, '2026-01-01', 'g/dL'),
        createMockReading('HDL Cholesterol', 38, '2026-01-01', 'mg/dL')
      ];
      const current = [
        createMockReading('eGFR', 65, '2026-06-01', 'mL/min'),
        createMockReading('Hemoglobin', 13.5, '2026-06-01', 'g/dL'),
        createMockReading('HDL Cholesterol', 50, '2026-06-01', 'mg/dL')
      ];

      const trends = calculateLongitudinalTrends(current, historical);
      const egfrTrend = trends.find(t => t.test_name === 'eGFR');
      const hgbTrend = trends.find(t => t.test_name === 'Hemoglobin');
      const hdlTrend = trends.find(t => t.test_name === 'HDL Cholesterol');

      expect(egfrTrend?.clinical_trend).toBe('improving');
      expect(hgbTrend?.clinical_trend).toBe('improving');
      expect(hdlTrend?.clinical_trend).toBe('improving');
    });

    it('classifies decrease in beneficial markers as worsening', () => {
      const historical = [createMockReading('Hemoglobin', 14.0, '2026-01-01', 'g/dL')];
      const current = [createMockReading('Hemoglobin', 9.5, '2026-06-01', 'g/dL')];

      const trends = calculateLongitudinalTrends(current, historical);
      expect(trends[0].clinical_trend).toBe('worsening');
    });
  });

  describe('Sparkline SVG generation & Gated Data Exclusion', () => {
    it('generates a non-empty SVG path string for valid multi-point trends', () => {
      const historical = [createMockReading('Glucose', 110, '2026-01-01')];
      const current = [createMockReading('Glucose', 130, '2026-02-01')];

      const trends = calculateLongitudinalTrends(current, historical);
      expect(trends[0].sparkline_svg_path).toMatch(/^M\s+\d/);
      expect(trends[0].sparkline_svg_path).toContain('L');
    });

    it('strictly excludes readings flagged with needs_review: true', () => {
      const historical = [createMockReading('ESR', 15, '2026-01-01')];
      // Current reading has unverified low-confidence smudge
      const current = [createMockReading('ESR', 46, '2026-06-01', 'mm/hr', true)];

      const trends = calculateLongitudinalTrends(current, historical);
      expect(trends).toHaveLength(0); // Cannot form trend because smudged reading is gated
    });

    it('returns empty array when fewer than 2 data points exist', () => {
      const current = [createMockReading('Calcium', 9.5, '2026-01-01')];
      const trends = calculateLongitudinalTrends(current, []);
      expect(trends).toHaveLength(0);
    });
  });
});

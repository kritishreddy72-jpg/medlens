import { describe, it, expect } from 'vitest';
import { generateSbarReport } from '../src/sbarGenerator';
import { PatientProfile, BiomarkerReading, ClinicalConflict } from '../src/types/clinical';
import { TrendAnalysis } from '../src/chronometer';

describe('SBAR Clinical Hand-off Report pure-function tests', () => {
  const basePatient: PatientProfile = {
    id: 'pt-sbar-1',
    name: 'Eleanor Vance',
    age: 58,
    sex: 'Female',
    vitals: {
      blood_pressure: '138/86 mmHg',
      heart_rate: 74
    },
    symptoms: ['Exertional dyspnea', 'Lower extremity edema'],
    conditions: ['Type 2 Diabetes Mellitus', 'Stage 2 CKD'],
    medications: [
      { name: 'Metformin', dosage: '500mg', frequency: 'BID' },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Daily' }
    ],
    allergies: [
      { substance: 'Penicillin', reaction: 'Anaphylaxis', severity: 'Severe' }
    ],
    provenance: 'USER_REPORTED'
  };

  const createMockReading = (
    test_name: string,
    value: number,
    status: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'UNSPECIFIED',
    unit = 'mg/dL',
    text_range = '70 - 99'
  ): BiomarkerReading => ({
    id: `read-${test_name}`,
    test_name,
    value,
    unit,
    reference_range: {
      text_range,
      is_present: status !== 'UNSPECIFIED',
      low: 70,
      high: 99
    },
    status,
    date_collected: '2026-06-01',
    confidence: 0.98,
    needs_review: false,
    provenance: 'EXTRACTED_VERIFIED',
    source_snippet: `${test_name}: ${value} ${unit}`
  });

  it('generates a complete 4-section SBAR structure with valid clinical data', () => {
    const readings = [
      createMockReading('Fasting Blood Glucose', 158, 'HIGH'),
      createMockReading('Hemoglobin A1c', 8.2, 'HIGH', '%', '< 5.7'),
      createMockReading('Serum Potassium', 6.2, 'CRITICAL', 'mEq/L', '3.5 - 5.0'),
      createMockReading('Total Protein', 7.1, 'NORMAL', 'g/dL', '6.0 - 8.3')
    ];

    const conflicts: ClinicalConflict[] = [
      {
        id: 'conf-1',
        type: 'LAB_MEDICATION_CONTRAINDICATION',
        severity: 'CRITICAL',
        title: 'Hyperkalemia Risk with RAAS Inhibitor',
        description: 'Potassium is 6.2 mEq/L while patient is taking Lisinopril.',
        clinical_rationale: 'Risk of fatal cardiac arrhythmias.',
        recommended_action: 'Hold Lisinopril and recheck serum potassium immediately.'
      }
    ];

    const trends: TrendAnalysis[] = [
      {
        test_name: 'Fasting Blood Glucose',
        unit: 'mg/dL',
        points: [],
        previous_value: 130,
        current_value: 158,
        delta_abs: 28,
        delta_pct: 21.5,
        clinical_trend: 'worsening',
        summary_text: 'Fasting Blood Glucose: changed by +21.5%',
        sparkline_svg_path: 'M 0 10 L 80 5'
      }
    ];

    const sbar = generateSbarReport(basePatient, readings, conflicts, trends);

    // Situation
    expect(sbar.situation.patient_header).toBe('Eleanor Vance, 58 y/o Female');
    expect(sbar.situation.primary_symptoms).toContain('Exertional dyspnea, Lower extremity edema');
    expect(sbar.situation.visit_objective).toBeDefined();

    // Background
    expect(sbar.background.chronic_conditions).toContain('Type 2 Diabetes Mellitus');
    expect(sbar.background.confirmed_allergies).toContain('Penicillin (Anaphylaxis - Severe)');
    expect(sbar.background.current_medications).toContain('Metformin 500mg (BID)');

    // Assessment
    expect(sbar.assessment.critical_flags).toHaveLength(1);
    expect(sbar.assessment.critical_flags[0]).toContain('CRITICAL: Serum Potassium at 6.2 mEq/L');
    expect(sbar.assessment.abnormal_biomarkers).toHaveLength(3);
    expect(sbar.assessment.normal_count).toBe(1);
    expect(sbar.assessment.unspecified_range_count).toBe(0);
    expect(sbar.assessment.contradictions).toHaveLength(1);
    expect(sbar.assessment.longitudinal_highlights).toContain('Fasting Blood Glucose: changed by +21.5%');

    // Recommendations & Responsible AI
    expect(sbar.recommendations.patient_action_items).toHaveLength(3);
    expect(sbar.recommendations.suggested_physician_questions.length).toBeGreaterThanOrEqual(1);
    expect(sbar.responsible_ai_notice).toContain('MedLens for organizational and educational purposes only');
  });

  describe('Handling missing or partial data gracefully', () => {
    it('provides fallback text when symptoms, conditions, or medications are empty', () => {
      const emptyPatient: PatientProfile = {
        ...basePatient,
        symptoms: [],
        conditions: [],
        medications: [],
        allergies: []
      };

      const sbar = generateSbarReport(emptyPatient, [], [], []);

      expect(sbar.situation.primary_symptoms).toBe('Routine clinical follow-up / screening review');
      expect(sbar.background.chronic_conditions).toEqual(['No known chronic illnesses documented']);
      expect(sbar.background.confirmed_allergies).toEqual([]);
      expect(sbar.background.current_medications).toEqual([]);
      expect(sbar.assessment.abnormal_biomarkers).toEqual([]);
      expect(sbar.assessment.normal_count).toBe(0);
    });

    it('generates a preventive inquiry question when all labs are normal and no conflicts exist', () => {
      const normalPatient: PatientProfile = {
        ...basePatient,
        symptoms: ['Annual physical exam']
      };
      const normalReadings = [
        createMockReading('Fasting Blood Glucose', 85, 'NORMAL'),
        createMockReading('Total Cholesterol', 170, 'NORMAL')
      ];

      const sbar = generateSbarReport(normalPatient, normalReadings, [], []);
      expect(sbar.recommendations.suggested_physician_questions[0]).toContain(
        'All evaluated laboratory markers are currently within the reported reference intervals'
      );
    });

    it('generates tailored physician questions for low hemoglobin, abnormal lipids, and kidney markers', () => {
      const readings = [
        createMockReading('Hemoglobin', 10.1, 'LOW', 'g/dL', '12.0 - 15.5'),
        createMockReading('LDL Cholesterol', 165, 'HIGH', 'mg/dL', '< 100'),
        createMockReading('Serum Creatinine', 1.8, 'HIGH', 'mg/dL', '0.6 - 1.2')
      ];

      const sbar = generateSbarReport(basePatient, readings, [], []);
      const questions = sbar.recommendations.suggested_physician_questions;

      expect(questions.some(q => q.includes('hemoglobin reading was lower than normal'))).toBe(true);
      expect(questions.some(q => q.includes('lipid profile shows elevated cholesterol'))).toBe(true);
      expect(questions.some(q => q.includes('kidney markers (Creatinine / eGFR)'))).toBe(true);
    });
  });
});

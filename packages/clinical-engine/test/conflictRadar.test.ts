import { describe, it, expect } from 'vitest';
import { detectClinicalConflicts, DRUG_CLASSES } from '../src/conflictRadar';
import { PatientProfile, BiomarkerReading } from '../src/types/clinical';

describe('Clinical Conflict Radar pure-function tests', () => {
  const basePatient: PatientProfile = {
    id: 'pt-test-1',
    name: 'Sarah Connor',
    age: 42,
    sex: 'Female',
    vitals: {},
    symptoms: [],
    conditions: [],
    medications: [],
    allergies: [],
    provenance: 'USER_REPORTED'
  };

  it('Rule 1: Detects Penicillin allergy + Amoxicillin contraindication (Beta-Lactam class)', () => {
    const patientWithAllergy: PatientProfile = {
      ...basePatient,
      allergies: [
        { substance: 'Penicillin', reaction: 'Hives and facial swelling', severity: 'Severe' }
      ],
      medications: [
        { name: 'Augmentin (Amoxicillin-Clavulanate)', dosage: '875mg', frequency: 'BID' }
      ]
    };

    const conflicts = detectClinicalConflicts(patientWithAllergy, []);
    expect(conflicts.length).toBeGreaterThanOrEqual(1);

    const allergyConflict = conflicts.find(c => c.type === 'ALLERGY_MEDICATION_CONTRAINDICATION');
    expect(allergyConflict).toBeDefined();
    expect(allergyConflict?.severity).toBe('CRITICAL');
    expect(allergyConflict?.title).toContain('High-Risk Allergy Contraindication');
    expect(allergyConflict?.clinical_rationale).toContain('ATC-J01C');
  });

  it('Rule 2: Detects eGFR < 30 + Metformin contraindication (FDA Black Box warning)', () => {
    const patientOnMetformin: PatientProfile = {
      ...basePatient,
      medications: [
        { name: 'Metformin HCl', dosage: '1000mg', frequency: 'Twice daily' }
      ]
    };

    const renalFailureReading: BiomarkerReading = {
      id: 'r-egfr',
      test_name: 'eGFR (CKD-EPI)',
      value: 22, // severely reduced < 30
      unit: 'mL/min/1.73m²',
      reference_range: { text_range: '> 60', is_present: true },
      status: 'CRITICAL',
      date_collected: '2026-09-04',
      specimen_type: 'Blood',
      confidence: 0.99,
      needs_review: false,
      provenance: 'EXTRACTED_VERIFIED',
      source_snippet: 'eGFR: 22 mL/min'
    };

    const conflicts = detectClinicalConflicts(patientOnMetformin, [renalFailureReading]);
    const metforminAlert = conflicts.find(c => c.id === 'conflict-metformin-egfr');
    expect(metforminAlert).toBeDefined();
    expect(metforminAlert?.severity).toBe('CRITICAL');
    expect(metforminAlert?.title).toContain('Metformin in Renal Impairment');
    expect(metforminAlert?.clinical_rationale).toContain('lactic acidosis');
  });

  it('Rule 3: Detects Temporal Anomaly when report collection date is in the future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days in the future
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const anomalousReading: BiomarkerReading = {
      id: 'r-future',
      test_name: 'Total Cholesterol',
      value: 210,
      unit: 'mg/dL',
      reference_range: { text_range: '< 200', is_present: true },
      status: 'HIGH',
      date_collected: futureDateStr,
      specimen_type: 'Blood',
      confidence: 0.95,
      needs_review: false,
      provenance: 'EXTRACTED_VERIFIED',
      source_snippet: `Total Cholesterol: 210 mg/dL (${futureDateStr})`
    };

    const conflicts = detectClinicalConflicts(basePatient, [anomalousReading]);
    const temporalConflict = conflicts.find(c => c.type === 'TEMPORAL_ANOMALY');
    expect(temporalConflict).toBeDefined();
    expect(temporalConflict?.severity).toBe('WARNING');
    expect(temporalConflict?.title).toContain('Temporal Discrepancy: Future Collection Date');
  });

  it('Rule 4: Detects Hyperkalemia risk with RAAS Inhibitors (e.g. Lisinopril)', () => {
    const patientOnLisinopril: PatientProfile = {
      ...basePatient,
      medications: [
        { name: 'Lisinopril', dosage: '20mg', frequency: 'Daily' }
      ]
    };

    const hyperkalemiaReading: BiomarkerReading = {
      id: 'r-k',
      test_name: 'Serum Potassium',
      value: 5.6,
      unit: 'mEq/L',
      reference_range: { text_range: '3.5 - 5.0', is_present: true },
      status: 'HIGH',
      date_collected: '2026-09-04',
      specimen_type: 'Blood',
      confidence: 0.98,
      needs_review: false,
      provenance: 'EXTRACTED_VERIFIED',
      source_snippet: 'Potassium: 5.6 mEq/L'
    };

    const conflicts = detectClinicalConflicts(patientOnLisinopril, [hyperkalemiaReading]);
    const raasConflict = conflicts.find(c => c.id === 'conflict-hyperkalemia-raas');
    expect(raasConflict).toBeDefined();
    expect(raasConflict?.items_involved).toContain('Potassium');
  });

  it('Negative Control: No false positive when medications do not conflict with allergy profile', () => {
    const safePatient: PatientProfile = {
      ...basePatient,
      allergies: [
        { substance: 'Sulfa Drugs', reaction: 'Skin rash', severity: 'Mild' }
      ],
      medications: [
        { name: 'Amoxicillin', dosage: '500mg', frequency: 'TID' }
      ]
    };

    const normalReadings: BiomarkerReading[] = [
      {
        id: 'r-normal',
        test_name: 'eGFR',
        value: 95,
        unit: 'mL/min',
        reference_range: { text_range: '> 60', is_present: true },
        status: 'NORMAL',
        date_collected: '2026-09-01',
        specimen_type: 'Blood',
        confidence: 0.99,
        needs_review: false,
        provenance: 'EXTRACTED_VERIFIED',
        source_snippet: 'eGFR: 95'
      }
    ];

    const conflicts = detectClinicalConflicts(safePatient, normalReadings);
    expect(conflicts.length).toBe(0);
  });
});
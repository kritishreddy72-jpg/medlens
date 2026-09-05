import { ClinicalPreset } from './types/clinical.js';

export const CLINICAL_PRESETS: ClinicalPreset[] = [
  {
    id: 'preset-diabetic-metabolic',
    title: 'Comprehensive Metabolic & Lipid Panel',
    subtitle: 'Diabetic monitoring with elevated Fasting Glucose & HbA1c',
    badge: 'Metabolic & Endocrine',
    iconName: 'Activity',
    patient: {
      id: 'pt-001',
      name: 'Marcus Vance',
      age: 54,
      sex: 'Male',
      symptoms: ['Mild bilateral foot numbness', 'Increased daytime thirst (polydipsia)'],
      conditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
      medications: [
        { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily with meals', prescribed_for: 'Type 2 Diabetes' },
        { name: 'Lisinopril', dosage: '10 mg', frequency: 'Once daily morning', prescribed_for: 'Hypertension' }
      ],
      allergies: [
        { substance: 'Sulfa Drugs', reaction: 'Maculopapular cutaneous rash', severity: 'Moderate' }
      ],
      notes: 'Follow-up for 6-month diabetic regimen review. Recent diet adherence reported as fair.',
      provenance: 'USER_REPORTED'
    },
    document: {
      title: 'Quest Diagnostics — Comprehensive Clinical Panel',
      date: '2026-08-20',
      facility: 'MetroHealth Diagnostic Laboratory, Suite 400',
      report_type: 'Metabolic, Lipid & Renal Panel',
      raw_text: `================================================================================
QUEST DIAGNOSTICS - CLINICAL PATHOLOGY REPORT
Patient: Marcus Vance | DOB: 1972-04-14 | Sex: M | Age: 54
Physician: Dr. Eleanor Vance, MD | Requisition: Q-9812401
Specimen: Venous Whole Blood & Serum | Collected: 2026-08-20 07:45 AM
Fast Duration: 12 Hours Fasting
================================================================================
TEST NAME                        VALUE      UNIT       REFERENCE RANGE   FLAG
--------------------------------------------------------------------------------
Fasting Blood Glucose            158        mg/dL      70 - 99           HIGH
Hemoglobin A1c (HbA1c)           8.2        %          < 5.7             HIGH
Total Cholesterol                218        mg/dL      < 200             HIGH
HDL Cholesterol                  42         mg/dL      > 40              NORMAL
LDL Cholesterol (Calculated)     142        mg/dL      < 100             HIGH
Triglycerides                    170        mg/dL      < 150             HIGH
Serum Creatinine                 1.05       mg/dL      0.70 - 1.30       NORMAL
eGFR (CKD-EPI)                   84         mL/min     > 60              NORMAL
Potassium, Serum                 4.4        mEq/L      3.5 - 5.0         NORMAL
Sodium, Serum                    139        mEq/L      135 - 145         NORMAL
Alkaline Phosphatase             72         U/L        Unspecified       --
Urine Albumin/Creatinine Ratio   38         mg/g       < 30              HIGH
================================================================================
COMMENTS: Glycemic parameters indicate suboptimal control. Microalbuminuria noted.
Electronically signed by: Harold Sterling, MD (Laboratory Director)
================================================================================`
    },
    readings: [
      {
        id: 'read-01',
        test_name: 'Fasting Blood Glucose',
        category: 'Metabolic',
        value: 158,
        unit: 'mg/dL',
        reference_range: { low: 70, high: 99, text_range: '70 - 99', is_present: true, operator: 'range' },
        status: 'HIGH',
        date_collected: '2026-08-20',
        confidence: 0.98,
        needs_review: false,
        source_snippet: 'Fasting Blood Glucose            158        mg/dL      70 - 99           HIGH',
        provenance: 'EXTRACTED_VERIFIED',
        notes: 'Elevated fasting state consistent with diabetic etiology.'
      },
      {
        id: 'read-02',
        test_name: 'Hemoglobin A1c',
        category: 'Metabolic',
        value: 8.2,
        unit: '%',
        reference_range: { high: 5.7, text_range: '< 5.7', is_present: true, operator: '<' },
        status: 'HIGH',
        date_collected: '2026-08-20',
        confidence: 0.99,
        needs_review: false,
        source_snippet: 'Hemoglobin A1c (HbA1c)           8.2        %          < 5.7             HIGH',
        provenance: 'EXTRACTED_VERIFIED',
        notes: 'Reflects average 90-day glycemic index.'
      },
      {
        id: 'read-03',
        test_name: 'Total Cholesterol',
        category: 'Lipid Panel',
        value: 218,
        unit: 'mg/dL',
        reference_range: { high: 200, text_range: '< 200', is_present: true, operator: '<' },
        status: 'HIGH',
        date_collected: '2026-08-20',
        confidence: 0.96,
        needs_review: false,
        source_snippet: 'Total Cholesterol                218        mg/dL      < 200             HIGH',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'read-04',
        test_name: 'HDL Cholesterol',
        category: 'Lipid Panel',
        value: 42,
        unit: 'mg/dL',
        reference_range: { low: 40, text_range: '> 40', is_present: true, operator: '>' },
        status: 'NORMAL',
        date_collected: '2026-08-20',
        confidence: 0.95,
        needs_review: false,
        source_snippet: 'HDL Cholesterol                  42         mg/dL      > 40              NORMAL',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'read-05',
        test_name: 'LDL Cholesterol',
        category: 'Lipid Panel',
        value: 142,
        unit: 'mg/dL',
        reference_range: { high: 100, text_range: '< 100', is_present: true, operator: '<' },
        status: 'HIGH',
        date_collected: '2026-08-20',
        confidence: 0.97,
        needs_review: false,
        source_snippet: 'LDL Cholesterol (Calculated)     142        mg/dL      < 100             HIGH',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'read-06',
        test_name: 'Serum Creatinine',
        category: 'Renal',
        value: 1.05,
        unit: 'mg/dL',
        reference_range: { low: 0.70, high: 1.30, text_range: '0.70 - 1.30', is_present: true, operator: 'range' },
        status: 'NORMAL',
        date_collected: '2026-08-20',
        confidence: 0.98,
        needs_review: false,
        source_snippet: 'Serum Creatinine                 1.05       mg/dL      0.70 - 1.30       NORMAL',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'read-07',
        test_name: 'eGFR',
        category: 'Renal',
        value: 84,
        unit: 'mL/min',
        reference_range: { low: 60, text_range: '> 60', is_present: true, operator: '>' },
        status: 'NORMAL',
        date_collected: '2026-08-20',
        confidence: 0.94,
        needs_review: false,
        source_snippet: 'eGFR (CKD-EPI)                   84         mL/min     > 60              NORMAL',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'read-08',
        test_name: 'Alkaline Phosphatase',
        category: 'Hepatic',
        value: 72,
        unit: 'U/L',
        reference_range: { text_range: 'Unspecified by Laboratory', is_present: false },
        status: 'UNSPECIFIED',
        date_collected: '2026-08-20',
        confidence: 0.92,
        needs_review: false,
        source_snippet: 'Alkaline Phosphatase             72         U/L        Unspecified       --',
        provenance: 'EXTRACTED_VERIFIED',
        notes: 'Laboratory omitted reference interval for this assay lot. Marked Unspecified.'
      }
    ],
    initial_conflicts: [],
    initial_clarifications: [],
    historical_readings: [
      {
        id: 'hist-01',
        test_name: 'Fasting Blood Glucose',
        category: 'Metabolic',
        value: 178,
        unit: 'mg/dL',
        reference_range: { low: 70, high: 99, text_range: '70 - 99', is_present: true, operator: 'range' },
        status: 'HIGH',
        date_collected: '2026-02-15',
        confidence: 1.0,
        needs_review: false,
        source_snippet: 'Historical record Feb 15, 2026',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'hist-02',
        test_name: 'Hemoglobin A1c',
        category: 'Metabolic',
        value: 8.9,
        unit: '%',
        reference_range: { high: 5.7, text_range: '< 5.7', is_present: true, operator: '<' },
        status: 'HIGH',
        date_collected: '2026-02-15',
        confidence: 1.0,
        needs_review: false,
        source_snippet: 'Historical record Feb 15, 2026',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'hist-03',
        test_name: 'LDL Cholesterol',
        category: 'Lipid Panel',
        value: 156,
        unit: 'mg/dL',
        reference_range: { high: 100, text_range: '< 100', is_present: true, operator: '<' },
        status: 'HIGH',
        date_collected: '2026-02-15',
        confidence: 1.0,
        needs_review: false,
        source_snippet: 'Historical record Feb 15, 2026',
        provenance: 'EXTRACTED_VERIFIED'
      }
    ]
  },
  {
    id: 'preset-cbc-acute-shift',
    title: 'Complete Blood Count with Confidence-Gated Review',
    subtitle: 'Acute shift with low-confidence OCR smudge demonstrating the Review Barrier',
    badge: 'Hematology / Review Gating',
    iconName: 'ShieldAlert',
    patient: {
      id: 'pt-002',
      name: 'Sarah Lin',
      age: 31,
      sex: 'Female',
      symptoms: ['Persistent fatigue', 'Low-grade fever (100.4 F)', 'Productive morning cough'],
      conditions: ['Mild Exercise-Induced Asthma'],
      medications: [
        { name: 'Albuterol Inhaler', dosage: '90 mcg', frequency: 'As needed for wheezing', prescribed_for: 'Asthma' }
      ],
      allergies: [],
      notes: 'Patient presented to outpatient clinic after 4 days of worsening fever and respiratory congestion.',
      provenance: 'USER_REPORTED'
    },
    document: {
      title: 'LabCorp — Hematology Complete Blood Count with Differential',
      date: '2026-08-30',
      facility: 'LabCorp Regional Pathology Center',
      report_type: 'Complete Blood Count (CBC) & Acute Phase Reactants',
      raw_text: `================================================================================
LABCORP - HEMATOLOGY & INFLAMMATORY REPORT
Patient: Sarah Lin | DOB: 1995-11-03 | Sex: F | Age: 31
Ordering Clinician: Dr. Raj Patel, MD | Order # LC-773412
Specimen: EDTA Whole Blood | Collected: 2026-08-30 09:15 AM
================================================================================
TEST NAME                        VALUE      UNIT          REFERENCE RANGE   FLAG
--------------------------------------------------------------------------------
White Blood Cells (WBC)          14.8       x10^3/uL      4.5 - 11.0        HIGH
Red Blood Cells (RBC)            3.92       x10^6/uL      4.00 - 5.20       LOW
Hemoglobin                       10.4       g/dL          12.0 - 15.5       LOW
Hematocrit                       32.1       %             36.0 - 46.0       LOW
Platelet Count                   215        x10^3/uL      150 - 450         NORMAL
Neutrophils, Absolute            11.4       x10^3/uL      1.8 - 7.7         HIGH
Lymphocytes, Absolute            1.8        x10^3/uL      1.0 - 4.8         NORMAL
[SCAN SMUDGE AT LINE 8]:
Erythrocyte Sed. Rate (ESR)      ~46?       mm/hr         0 - 20            HIGH*
================================================================================
*Note on Line 8: Paper printout sustained ink smudge over numeric decimal.
Optical scan confidence is low (62%). Human verification recommended.
================================================================================`
    },
    readings: [
      {
        id: 'cbc-01',
        test_name: 'White Blood Cells (WBC)',
        category: 'Complete Blood Count',
        value: 14.8,
        unit: 'x10^3/uL',
        reference_range: { low: 4.5, high: 11.0, text_range: '4.5 - 11.0', is_present: true, operator: 'range' },
        status: 'HIGH',
        date_collected: '2026-08-30',
        confidence: 0.99,
        needs_review: false,
        source_snippet: 'White Blood Cells (WBC)          14.8       x10^3/uL      4.5 - 11.0        HIGH',
        provenance: 'EXTRACTED_VERIFIED',
        notes: 'Leukocytosis reflecting active inflammatory or infectious response.'
      },
      {
        id: 'cbc-02',
        test_name: 'Hemoglobin',
        category: 'Complete Blood Count',
        value: 10.4,
        unit: 'g/dL',
        reference_range: { low: 12.0, high: 15.5, text_range: '12.0 - 15.5', is_present: true, operator: 'range' },
        status: 'LOW',
        date_collected: '2026-08-30',
        confidence: 0.97,
        needs_review: false,
        source_snippet: 'Hemoglobin                       10.4       g/dL          12.0 - 15.5       LOW',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'cbc-03',
        test_name: 'Platelet Count',
        category: 'Complete Blood Count',
        value: 215,
        unit: 'x10^3/uL',
        reference_range: { low: 150, high: 450, text_range: '150 - 450', is_present: true, operator: 'range' },
        status: 'NORMAL',
        date_collected: '2026-08-30',
        confidence: 0.98,
        needs_review: false,
        source_snippet: 'Platelet Count                   215        x10^3/uL      150 - 450         NORMAL',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'cbc-04',
        test_name: 'Erythrocyte Sedimentation Rate (ESR)',
        category: 'Inflammatory',
        value: 46,
        unit: 'mm/hr',
        reference_range: { low: 0, high: 20, text_range: '0 - 20', is_present: true, operator: 'range' },
        status: 'HIGH',
        date_collected: '2026-08-30',
        confidence: 0.62, // BELOW THRESHOLD: 0.62 < 0.70
        needs_review: true,
        source_snippet: 'Erythrocyte Sed. Rate (ESR)      ~46?       mm/hr         0 - 20            HIGH*',
        provenance: 'EXTRACTED_UNVERIFIED',
        notes: 'OCR confidence is 62% due to ink smudge. Locked from downstream analytics until verified.'
      }
    ],
    initial_conflicts: [],
    initial_clarifications: [
      {
        id: 'clarify-esr-01',
        field: 'ESR (Erythrocyte Sedimentation Rate)',
        question: 'The printed report has an ink smudge over the ESR reading. The AI OCR parsed "~46", but this is low-confidence (62%). Can you confirm the number from your physical sheet?',
        suggested_options: ['46 mm/hr (Confirmed)', '16 mm/hr', '40 mm/hr', 'Unreadable / Retest needed'],
        resolved: false
      }
    ]
  },
  {
    id: 'preset-allergy-conflict',
    title: 'Prescription with Latent Drug-Allergy Contraindication',
    subtitle: 'Amoxicillin/Clavulanate prescribed to patient with documented Penicillin Anaphylaxis',
    badge: 'Clinical Safety Radar',
    iconName: 'AlertTriangle',
    patient: {
      id: 'pt-003',
      name: 'Robert Chen',
      age: 42,
      sex: 'Male',
      symptoms: ['Severe facial pain and sinus pressure', 'Purulent nasal discharge for 10 days'],
      conditions: ['Recurrent Acute Bacterial Sinusitis'],
      medications: [],
      allergies: [
        { substance: 'Penicillin', reaction: 'Anaphylaxis / Airway constriction', severity: 'Severe' }
      ],
      notes: 'Patient explicitly reported severe childhood penicillin anaphylaxis requiring epinephrine.',
      provenance: 'USER_REPORTED'
    },
    document: {
      title: 'CityCare Urgent Care — Prescription & Clinical Discharge Note',
      date: '2026-09-02',
      facility: 'CityCare Walk-In Medical Center',
      report_type: 'Urgent Care Prescription Slip',
      raw_text: `================================================================================
CITYCARE URGENT CARE & OCCUPATIONAL HEALTH
1022 Medical Parkway, Suite 100
Patient: Robert Chen | DOB: 1984-06-22 | Sex: M | Date: 2026-09-02
Attending Physician: Dr. K. Reynolds, MD | DEA: BR4491028
================================================================================
CLINICAL DIAGNOSIS: Acute Maxillary Sinusitis, presumed bacterial etiology
VITAL SIGNS: BP 124/82 | Pulse 82 bpm | Temp 99.8 F | SpO2 99% RA

Rx (ELECTRONIC PRESCRIPTION DISPATCHED):
MEDICATION: Augmentin (Amoxicillin / Clavulanate Potassium)
STRENGTH:   875 mg / 125 mg oral tablet
SIG:        Take 1 tablet orally twice daily with meals for 10 days
DISPENSE:   #20 (Twenty) tablets | REFILLS: 0
PHARMACY:   Cornerstone Pharmacy, 4th & Main Street
================================================================================
DISCHARGE INSTRUCTIONS: Complete full antibiotic course. Return immediately if
swelling, hives, or breathing difficulty occurs.
================================================================================`
    },
    readings: [
      {
        id: 'vitals-01',
        test_name: 'Body Temperature',
        category: 'Other',
        value: 99.8,
        unit: 'F',
        reference_range: { low: 97.0, high: 99.0, text_range: '97.0 - 99.0', is_present: true, operator: 'range' },
        status: 'HIGH',
        date_collected: '2026-09-02',
        confidence: 0.98,
        needs_review: false,
        source_snippet: 'Temp 99.8 F',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'vitals-02',
        test_name: 'Resting Pulse Rate',
        category: 'Other',
        value: 82,
        unit: 'bpm',
        reference_range: { low: 60, high: 100, text_range: '60 - 100', is_present: true, operator: 'range' },
        status: 'NORMAL',
        date_collected: '2026-09-02',
        confidence: 0.99,
        needs_review: false,
        source_snippet: 'Pulse 82 bpm',
        provenance: 'EXTRACTED_VERIFIED'
      }
    ],
    initial_conflicts: [
      {
        id: 'conflict-augmentin-penicillin',
        type: 'ALLERGY_MEDICATION_CONTRAINDICATION',
        severity: 'CRITICAL',
        title: 'Severe Allergy Contraindication: AUGMENTIN (Amoxicillin/Clavulanate)',
        description: 'Patient has a documented severe allergy to "Penicillin" (Anaphylaxis), but the newly uploaded prescription slip orders Augmentin 875/125 mg.',
        clinical_rationale: 'Cross-referenced against WHO-ATC classification ATC-J01CR02: Augmentin is a combination of Amoxicillin (a synthetic penicillin) and clavulanic acid. Administering this drug carries an imminent risk of severe IgE-mediated anaphylaxis.',
        items_involved: ['Penicillin', 'Augmentin (Amoxicillin)']
      }
    ],
    initial_clarifications: [
      {
        id: 'clarify-allergy-01',
        field: 'Augmentin vs Penicillin Allergy',
        question: 'Did your doctor or pharmacist discuss your Penicillin anaphylaxis prior to prescribing Augmentin?',
        suggested_options: [
          'No, the doctor was not aware of my allergy (Immediate clinic contact required)',
          'Yes, an alternative non-penicillin antibiotic (like Doxycycline or Azithromycin) was substituted',
          'I need to verify with the pharmacy before taking any pills'
        ],
        resolved: false
      }
    ]
  },
  {
    id: 'preset-longitudinal-trends',
    title: 'Longitudinal 6-Month Trajectory: Glycemic & Renal Health',
    subtitle: 'Cross-report comparison showing biomarker delta trajectory and therapy response',
    badge: 'Chronometer / Multi-Date',
    iconName: 'TrendingUp',
    patient: {
      id: 'pt-004',
      name: 'Elena Rostova',
      age: 62,
      sex: 'Female',
      symptoms: ['No active complaints; routine follow-up'],
      conditions: ['Type 2 Diabetes Mellitus', 'Hyperlipidemia', 'Early Stage Chronic Kidney Disease'],
      medications: [
        { name: 'Empagliflozin', dosage: '10 mg', frequency: 'Once daily morning', prescribed_for: 'Diabetes & Renal protection' },
        { name: 'Atorvastatin', dosage: '20 mg', frequency: 'Once daily at bedtime', prescribed_for: 'Hyperlipidemia' }
      ],
      allergies: [],
      notes: 'Patient started SGLT2 inhibitor (Empagliflozin) in March 2026. Evaluating 6-month renal & glycemic response.',
      provenance: 'USER_REPORTED'
    },
    document: {
      title: 'Endocrine & Metabolic Specialists — 6-Month Comparative Lab Panel',
      date: '2026-09-01',
      facility: 'Regional University Health Laboratory',
      report_type: 'Comparative Follow-up Panel',
      raw_text: `================================================================================
REGIONAL UNIVERSITY HEALTH - CLINICAL BIOCHEMISTRY
Patient: Elena Rostova | DOB: 1964-01-19 | Age: 62 | Sex: F
Follow-up: 6-Month Therapeutic Assessment | Date: 2026-09-01
================================================================================
BIOMARKER                        CURRENT (SEP 2026)  PREV (MAR 2026)   REF RANGE
--------------------------------------------------------------------------------
Fasting Plasma Glucose           118 mg/dL           164 mg/dL         70 - 99 mg/dL
Hemoglobin A1c                   6.9 %               8.4 %             < 5.7 %
Serum Creatinine                 1.12 mg/dL          1.38 mg/dL        0.60 - 1.20 mg/dL
eGFR (CKD-EPI)                   68 mL/min           52 mL/min         > 60 mL/min
LDL Cholesterol                  88 mg/dL            132 mg/dL         < 100 mg/dL
Triglycerides                    138 mg/dL           195 mg/dL         < 150 mg/dL
Urine Albumin/Creatinine         22 mg/g             64 mg/g           < 30 mg/g
================================================================================
IMPRESSION: Marked favorable glycemic and nephroprotective response following
initiation of SGLT2 inhibitor. HbA1c improved by 1.5% absolute. eGFR stabilized.
================================================================================`
    },
    readings: [
      {
        id: 'long-01',
        test_name: 'Fasting Plasma Glucose',
        category: 'Metabolic',
        value: 118,
        unit: 'mg/dL',
        reference_range: { low: 70, high: 99, text_range: '70 - 99', is_present: true, operator: 'range' },
        status: 'HIGH',
        date_collected: '2026-09-01',
        confidence: 0.99,
        needs_review: false,
        source_snippet: 'Fasting Plasma Glucose           118 mg/dL           164 mg/dL         70 - 99 mg/dL',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'long-02',
        test_name: 'Hemoglobin A1c',
        category: 'Metabolic',
        value: 6.9,
        unit: '%',
        reference_range: { high: 5.7, text_range: '< 5.7', is_present: true, operator: '<' },
        status: 'HIGH',
        date_collected: '2026-09-01',
        confidence: 0.99,
        needs_review: false,
        source_snippet: 'Hemoglobin A1c                   6.9 %               8.4 %             < 5.7 %',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'long-03',
        test_name: 'eGFR',
        category: 'Renal',
        value: 68,
        unit: 'mL/min',
        reference_range: { low: 60, text_range: '> 60', is_present: true, operator: '>' },
        status: 'NORMAL',
        date_collected: '2026-09-01',
        confidence: 0.98,
        needs_review: false,
        source_snippet: 'eGFR (CKD-EPI)                   68 mL/min           52 mL/min         > 60 mL/min',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'long-04',
        test_name: 'LDL Cholesterol',
        category: 'Lipid Panel',
        value: 88,
        unit: 'mg/dL',
        reference_range: { high: 100, text_range: '< 100', is_present: true, operator: '<' },
        status: 'NORMAL',
        date_collected: '2026-09-01',
        confidence: 0.98,
        needs_review: false,
        source_snippet: 'LDL Cholesterol                  88 mg/dL            132 mg/dL         < 100 mg/dL',
        provenance: 'EXTRACTED_VERIFIED'
      }
    ],
    initial_conflicts: [],
    initial_clarifications: [],
    historical_readings: [
      {
        id: 'long-hist-01',
        test_name: 'Fasting Plasma Glucose',
        category: 'Metabolic',
        value: 164,
        unit: 'mg/dL',
        reference_range: { low: 70, high: 99, text_range: '70 - 99', is_present: true, operator: 'range' },
        status: 'HIGH',
        date_collected: '2026-03-01',
        confidence: 1.0,
        needs_review: false,
        source_snippet: 'Baseline Mar 01, 2026',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'long-hist-02',
        test_name: 'Hemoglobin A1c',
        category: 'Metabolic',
        value: 8.4,
        unit: '%',
        reference_range: { high: 5.7, text_range: '< 5.7', is_present: true, operator: '<' },
        status: 'HIGH',
        date_collected: '2026-03-01',
        confidence: 1.0,
        needs_review: false,
        source_snippet: 'Baseline Mar 01, 2026',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'long-hist-03',
        test_name: 'eGFR',
        category: 'Renal',
        value: 52,
        unit: 'mL/min',
        reference_range: { low: 60, text_range: '> 60', is_present: true, operator: '>' },
        status: 'LOW',
        date_collected: '2026-03-01',
        confidence: 1.0,
        needs_review: false,
        source_snippet: 'Baseline Mar 01, 2026',
        provenance: 'EXTRACTED_VERIFIED'
      },
      {
        id: 'long-hist-04',
        test_name: 'LDL Cholesterol',
        category: 'Lipid Panel',
        value: 132,
        unit: 'mg/dL',
        reference_range: { high: 100, text_range: '< 100', is_present: true, operator: '<' },
        status: 'HIGH',
        date_collected: '2026-03-01',
        confidence: 1.0,
        needs_review: false,
        source_snippet: 'Baseline Mar 01, 2026',
        provenance: 'EXTRACTED_VERIFIED'
      }
    ]
  }
];

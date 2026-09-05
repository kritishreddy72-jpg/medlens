export type ProvenanceType = 
  | 'USER_REPORTED' 
  | 'EXTRACTED_UNVERIFIED' 
  | 'EXTRACTED_VERIFIED' 
  | 'SYNTHESIZED';

export type BiomarkerStatus = 
  | 'NORMAL' 
  | 'LOW' 
  | 'HIGH' 
  | 'CRITICAL' 
  | 'UNSPECIFIED';

export interface ReferenceRange {
  low?: number;
  high?: number;
  text_range: string;
  is_present: boolean;
  operator?: '<' | '>' | '<=' | '>=' | 'range' | 'qualitative';
}

export interface BiomarkerReading {
  id: string;
  test_name: string;
  category: 'Metabolic' | 'Complete Blood Count' | 'Lipid Panel' | 'Renal' | 'Hepatic' | 'Inflammatory' | 'Other';
  value: number | string;
  unit: string;
  reference_range: ReferenceRange;
  status: BiomarkerStatus;
  date_collected: string;
  specimen_type?: string;
  confidence: number; // 0.0 to 1.0
  needs_review: boolean; // True if confidence < 0.70 or unverified
  source_snippet: string; // Verbatim quote from source document
  provenance: ProvenanceType;
  notes?: string;
}

export interface PatientVitals {
  blood_pressure?: string;
  heart_rate?: number;
  spo2?: number;
  temperature?: number;
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  respiratory_rate?: number;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  dob?: string;
  blood_group?: string;
  vitals?: PatientVitals;
  symptoms: string[];
  conditions: string[];
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    prescribed_for?: string;
  }[];
  allergies: {
    substance: string;
    reaction: string;
    severity: 'Mild' | 'Moderate' | 'Severe';
  }[];
  notes?: string;
  provenance: 'USER_REPORTED';
}

export interface ClinicalConflict {
  id: string;
  type: 'ALLERGY_MEDICATION_CONTRAINDICATION' | 'TEMPORAL_ANOMALY' | 'DISCREPANT_VALUE' | 'DUPLICATE_TEST' | 'CONDITION_CONTRAINDICATION';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  clinical_rationale: string;
  items_involved: string[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  test_id: string;
  test_name: string;
  field: string;
  old_value: any;
  new_value: any;
  modified_by: string;
  reason: string;
}

export interface ClarificationPrompt {
  id: string;
  field: string;
  question: string;
  suggested_options: string[];
  resolved: boolean;
  user_selection?: string;
}

export interface ClinicalPreset {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  iconName: string;
  patient: PatientProfile;
  document: {
    title: string;
    date: string;
    facility: string;
    raw_text: string;
    report_type: string;
  };
  readings: BiomarkerReading[];
  initial_conflicts: ClinicalConflict[];
  initial_clarifications: ClarificationPrompt[];
  historical_readings?: BiomarkerReading[];
}

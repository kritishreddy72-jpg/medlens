import { BiomarkerReading, ClinicalConflict, PatientProfile } from './types/clinical.js';
import { TrendAnalysis } from './chronometer.js';
export interface SbarReport {
    situation: {
        patient_header: string;
        primary_symptoms: string;
        visit_objective: string;
    };
    background: {
        chronic_conditions: string[];
        confirmed_allergies: string[];
        current_medications: string[];
    };
    assessment: {
        critical_flags: string[];
        abnormal_biomarkers: {
            name: string;
            value: string;
            unit: string;
            reference_range: string;
            status: string;
            direction?: string;
        }[];
        normal_count: number;
        unspecified_range_count: number;
        contradictions: string[];
        longitudinal_highlights: string[];
    };
    recommendations: {
        patient_action_items: string[];
        suggested_physician_questions: string[];
    };
    responsible_ai_notice: string;
}
/**
 * Generates an SBAR clinical handoff sheet for patient-physician consultations.
 */
export declare function generateSbarReport(patient: PatientProfile, readings: BiomarkerReading[], conflicts: ClinicalConflict[], trends: TrendAnalysis[]): SbarReport;
/**
 * Exports data as a standard FHIR R4 Bundle for electronic health record interoperability.
 */
export declare function exportToFhirR4(patient: PatientProfile, readings: BiomarkerReading[], reportTitle?: string): any;

import { BiomarkerReading, ClinicalConflict, PatientProfile } from './types/clinical';
interface DrugClassMapping {
    class_name: string;
    atc_code: string;
    generic_names: string[];
    brand_names: string[];
}
export declare const DRUG_CLASSES: DrugClassMapping[];
/**
 * Checks for drug-allergy contraindications, drug-condition risks, and temporal anomalies.
 */
export declare function detectClinicalConflicts(patient: PatientProfile, readings: BiomarkerReading[], extractedMedications?: {
    name: string;
    dosage?: string;
}[]): ClinicalConflict[];
export {};

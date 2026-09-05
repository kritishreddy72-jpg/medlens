import { BiomarkerReading } from './types/clinical';
export interface LocalExtractionResult {
    readings: BiomarkerReading[];
    document_summary: string;
    extracted_patient_info?: {
        name?: string;
        age?: number;
        sex?: string;
        collection_date?: string;
    };
    extracted_medications?: {
        name: string;
        dosage?: string;
        frequency?: string;
    }[];
}
export declare function parseClinicalTextOffline(rawText: string): LocalExtractionResult;

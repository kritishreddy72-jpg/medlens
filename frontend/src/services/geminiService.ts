import { BiomarkerReading } from '../types/clinical';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

export interface ExtractionResult {
  readings: BiomarkerReading[];
  document_summary: string;
  extracted_patient_info?: {
    name?: string;
    age?: number;
    sex?: string;
    collection_date?: string;
  };
}

/**
 * Executes multimodal extraction via the secure backend API.
 * The Gemini API key is kept securely on the server side.
 */
export async function extractMedicalReportWithGemini(
  fileData: { base64: string; mimeType: string },
  patientContext?: string
): Promise<ExtractionResult> {
  const response = await fetch(`${API_BASE_URL}/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      base64: fileData.base64,
      mime_type: fileData.mimeType,
      patient_context: patientContext
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server extraction failed with status ${response.status}`);
  }

  const result: ExtractionResult = await response.json();
  return result;
}

/**
 * Generates an educational, non-diagnostic synthesis via the backend API.
 */
export async function generatePatientFriendlySummary(
  patientName: string,
  readings: BiomarkerReading[]
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      patient_name: patientName,
      readings
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Summary generation failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.summary || 'Summary could not be generated.';
}


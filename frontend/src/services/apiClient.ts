import { BiomarkerReading, ClinicalConflict, ClinicalPreset, PatientProfile } from '../types/clinical';
import { BiomarkerTrend } from '../engine/chronometer';
import { SbarReport } from '../engine/sbarGenerator';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

/**
 * Checks backend health status.
 */
export async function checkBackendHealth(): Promise<{ online: boolean; version?: string; service?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, version: data.version, service: data.service };
  } catch {
    return { online: false };
  }
}

/**
 * Fetches clinical presets from the backend API.
 */
export async function fetchPresetsFromBackend(): Promise<ClinicalPreset[]> {
  const response = await fetch(`${API_BASE_URL}/presets`);
  if (!response.ok) {
    throw new Error(`Failed to fetch presets: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Evaluates clinical conflicts via the backend /api/conflicts endpoint.
 */
export async function evaluateConflictsWithBackend(
  patient: PatientProfile,
  readings: BiomarkerReading[],
  extractedMedications?: any[]
): Promise<ClinicalConflict[]> {
  const response = await fetch(`${API_BASE_URL}/conflicts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient,
      readings,
      extracted_medications: extractedMedications
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Conflict evaluation failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.conflicts || [];
}

/**
 * Calculates longitudinal trends via the backend /api/trends endpoint.
 */
export async function calculateTrendsWithBackend(
  currentReadings: BiomarkerReading[],
  historicalReadings: BiomarkerReading[]
): Promise<BiomarkerTrend[]> {
  const response = await fetch(`${API_BASE_URL}/trends`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_readings: currentReadings,
      historical_readings: historicalReadings
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Trends calculation failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.trends || [];
}

/**
 * Generates an SBAR clinical briefing via the backend /api/sbar endpoint.
 */
export async function generateSbarWithBackend(
  patient: PatientProfile,
  readings: BiomarkerReading[],
  conflicts: ClinicalConflict[],
  trends: BiomarkerTrend[]
): Promise<SbarReport> {
  const response = await fetch(`${API_BASE_URL}/sbar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient,
      readings,
      conflicts,
      trends
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `SBAR generation failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.sbar;
}

/**
 * Exports patient record and biomarker readings as a FHIR R4 Bundle via the backend /api/fhir endpoint.
 */
export async function exportFhirWithBackend(
  patient: PatientProfile,
  readings: BiomarkerReading[],
  reportTitle: string
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/fhir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient,
      readings,
      report_title: reportTitle
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `FHIR export failed with status ${response.status}`);
  }

  return await response.json();
}
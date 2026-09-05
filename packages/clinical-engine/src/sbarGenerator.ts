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
export function generateSbarReport(
  patient: PatientProfile,
  readings: BiomarkerReading[],
  conflicts: ClinicalConflict[],
  trends: TrendAnalysis[]
): SbarReport {
  const abnormal = readings.filter(r => r.status === 'HIGH' || r.status === 'LOW' || r.status === 'CRITICAL');
  const critical = readings.filter(r => r.status === 'CRITICAL');
  const normal = readings.filter(r => r.status === 'NORMAL');
  const unspecified = readings.filter(r => r.status === 'UNSPECIFIED');

  // Formulate physician questions based on abnormal markers
  const questions: string[] = [];

  const highGlucose = readings.find(r => r.test_name.toLowerCase().includes('glucose') && r.status === 'HIGH');
  const highA1c = readings.find(r => r.test_name.toLowerCase().includes('hba1c') && r.status === 'HIGH');
  if (highGlucose || highA1c) {
    questions.push('My blood glucose/HbA1c was elevated above the lab reference range. What target level should we aim for, and does my diet or medication need adjustment?');
  }

  const highLipids = readings.find(r => (r.test_name.toLowerCase().includes('ldl') || r.test_name.toLowerCase().includes('cholesterol')) && r.status === 'HIGH');
  if (highLipids) {
    questions.push('My lipid profile shows elevated cholesterol values. Should we discuss cardiovascular risk factors or lipid-lowering strategies?');
  }

  const lowHemoglobin = readings.find(r => r.test_name.toLowerCase().includes('hemoglobin') && r.status === 'LOW');
  if (lowHemoglobin) {
    questions.push('My hemoglobin reading was lower than normal. Should we investigate potential iron deficiency, nutritional causes, or further hematology tests?');
  }

  const kidneyMarkers = readings.find(r => (r.test_name.toLowerCase().includes('creatinine') || r.test_name.toLowerCase().includes('egfr')) && (r.status === 'HIGH' || r.status === 'LOW'));
  if (kidneyMarkers) {
    questions.push('My kidney markers (Creatinine / eGFR) shifted out of range. How frequently should we re-test kidney function?');
  }

  if (conflicts.length > 0) {
    questions.push(`We identified a potential conflict regarding: ${conflicts.map(c => c.title).join('; ')}. Can you confirm if this is safe?`);
  }

  if (questions.length === 0) {
    questions.push('All evaluated laboratory markers are currently within the reported reference intervals. What preventive health milestones should we focus on next?');
  }

  return {
    situation: {
      patient_header: `${patient.name}, ${patient.age} y/o ${patient.sex}`,
      primary_symptoms: patient.symptoms.length > 0 ? patient.symptoms.join(', ') : 'Routine clinical follow-up / screening review',
      visit_objective: 'Review recently processed laboratory findings, reconcile medications, and clarify out-of-range clinical biomarkers.'
    },
    background: {
      chronic_conditions: patient.conditions.length > 0 ? patient.conditions : ['No known chronic illnesses documented'],
      confirmed_allergies: patient.allergies.map(a => `${a.substance} (${a.reaction} - ${a.severity})`),
      current_medications: patient.medications.map(m => `${m.name} ${m.dosage} (${m.frequency})`)
    },
    assessment: {
      critical_flags: critical.map(c => `CRITICAL: ${c.test_name} at ${c.value} ${c.unit} (Lab Ref: ${c.reference_range.text_range})`),
      abnormal_biomarkers: abnormal.map(a => ({
        name: a.test_name,
        value: String(a.value),
        unit: a.unit,
        reference_range: a.reference_range.text_range,
        status: a.status,
        direction: a.status === 'HIGH' ? 'Above Range' : 'Below Range'
      })),
      normal_count: normal.length,
      unspecified_range_count: unspecified.length,
      contradictions: conflicts.map(c => `[${c.severity}] ${c.title}: ${c.description}`),
      longitudinal_highlights: trends.map(t => t.summary_text)
    },
    recommendations: {
      patient_action_items: [
        'Bring this 1-page SBAR brief to your consultation.',
        'Do not alter medication dosages or discontinue prescriptions without direct clinical supervision.',
        'Review the flagged questions below with your doctor.'
      ],
      suggested_physician_questions: questions
    },
    responsible_ai_notice: 'This briefing is synthesized by MedLens for organizational and educational purposes only. It does not provide medical diagnosis, clinical prognosis, or prescription therapy.'
  };
}

/**
 * Exports data as a standard FHIR R4 Bundle for electronic health record interoperability.
 */
export function exportToFhirR4(
  patient: PatientProfile,
  readings: BiomarkerReading[],
  reportTitle: string = 'Laboratory Diagnostic Report'
): any {
  const patientId = `patient-${patient.id}`;

  const fhirBundle = {
    resourceType: 'Bundle',
    type: 'document',
    timestamp: new Date().toISOString(),
    entry: [
      {
        resource: {
          resourceType: 'Patient',
          id: patientId,
          name: [{ text: patient.name }],
          gender: patient.sex.toLowerCase(),
          active: true
        }
      },
      {
        resource: {
          resourceType: 'DiagnosticReport',
          id: `report-${Date.now()}`,
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
              code: 'LAB',
              display: 'Laboratory'
            }]
          }],
          code: { text: reportTitle },
          subject: { reference: `Patient/${patientId}`, display: patient.name },
          result: readings.map(r => ({ reference: `Observation/obs-${r.id}`, display: r.test_name }))
        }
      },
      ...readings.map(r => ({
        resource: {
          resourceType: 'Observation',
          id: `obs-${r.id}`,
          status: r.needs_review ? 'preliminary' : 'final',
          code: { text: r.test_name },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: r.date_collected,
          valueQuantity: typeof r.value === 'number' ? {
            value: r.value,
            unit: r.unit,
            system: 'http://unitsofmeasure.org'
          } : undefined,
          valueString: typeof r.value === 'string' ? r.value : undefined,
          interpretation: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: r.status === 'NORMAL' ? 'N' : r.status === 'HIGH' ? 'H' : r.status === 'LOW' ? 'L' : 'IND',
              display: r.status
            }]
          }],
          referenceRange: r.reference_range.is_present ? [{
            text: r.reference_range.text_range,
            low: r.reference_range.low !== undefined ? { value: r.reference_range.low, unit: r.unit } : undefined,
            high: r.reference_range.high !== undefined ? { value: r.reference_range.high, unit: r.unit } : undefined
          }] : undefined
        }
      }))
    ]
  };

  return fhirBundle;
}

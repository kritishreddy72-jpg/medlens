import { describe, it, expect } from 'vitest';
import { parseClinicalTextOffline } from '../src/offlineClinicalParser';

describe('Offline Clinical Parser pure-function tests', () => {
  it('extracts patient demographics from clinical report headers', () => {
    const rawReport = `
================================================================================
METROPOLITAN CLINICAL LABORATORY - OFFICIAL REPORT
Patient Name: Johnathan Doe | DOB: 1978-04-12 | Age: 48 | Sex: Male
Collection Date: 2026-05-14
================================================================================
Fasting Blood Glucose: 115 mg/dL (Reference: 70 - 99) [HIGH]
Serum Creatinine: 0.95 mg/dL (Reference: 0.70 - 1.30) [NORMAL]
`;

    const result = parseClinicalTextOffline(rawReport);

    expect(result.extracted_patient_info?.name).toBe('Johnathan Doe');
    expect(result.extracted_patient_info?.age).toBe(48);
    expect(result.extracted_patient_info?.sex).toBe('Male');
    expect(result.extracted_patient_info?.collection_date).toBe('2026-05-14');
    expect(result.readings).toHaveLength(2);
  });

  it('extracts prescribed medications and latent drugs from clinical notes', () => {
    const rawPrescription = `
URGENT CARE CLINICAL ENCOUNTER
Patient: Maria Gomez | Age: 35 | Sex: Female
Chief Complaint: Acute maxillary sinusitis
Rx: Augmentin 875/125 mg PO BID x 10 days
Also continuing daily Metformin 500mg
`;

    const result = parseClinicalTextOffline(rawPrescription);

    expect(result.extracted_medications).toBeDefined();
    expect(result.extracted_medications?.length).toBeGreaterThanOrEqual(2);
    expect(result.extracted_medications?.some(m => m.name.toLowerCase().includes('augmentin'))).toBe(true);
    expect(result.extracted_medications?.some(m => m.name.toLowerCase().includes('metformin'))).toBe(true);
  });

  it('correctly extracts biomarkers, units, reference ranges, and calculates status', () => {
    const rawLab = `
LABORATORY REPORT
Patient: Alex Mercer | Age: 52 | Sex: M
Glucose, Fasting    145 mg/dL    70 - 99 mg/dL    HIGH
Hemoglobin A1c      7.8 %        < 5.7 %          HIGH
eGFR (CKD-EPI)      85 mL/min    > 60 mL/min      NORMAL
Alkaline Phosphatase 112 U/L     Unspecified
`;

    const result = parseClinicalTextOffline(rawLab);
    const glucose = result.readings.find(r => r.test_name === 'Fasting Blood Glucose');
    const a1c = result.readings.find(r => r.test_name === 'Hemoglobin A1c');
    const egfr = result.readings.find(r => r.test_name === 'eGFR');
    const alkPhos = result.readings.find(r => r.test_name.includes('Alkaline Phosphatase'));

    expect(glucose).toBeDefined();
    expect(glucose?.value).toBe(145);
    expect(glucose?.status).toBe('HIGH');
    expect(glucose?.reference_range.text_range).toContain('70 - 99');

    expect(a1c).toBeDefined();
    expect(a1c?.value).toBe(7.8);
    expect(a1c?.status).toBe('HIGH');

    expect(egfr).toBeDefined();
    expect(egfr?.value).toBe(85);
    expect(egfr?.status).toBe('NORMAL');

    expect(alkPhos).toBeDefined();
    expect(alkPhos?.reference_range.text_range).toBe('Unspecified by Laboratory');
    expect(alkPhos?.status).toBe('UNSPECIFIED');
  });

  it('gates smudged or ambiguous OCR lines with lower confidence and needs_review: true', () => {
    const smudgedReport = `
HAEMATOLOGY REPORT
Patient: Sarah Lin | Age: 31 | Sex: Female
WBC Count: 14.8 x10^3/uL (Reference: 4.5 - 11.0)
ESR (Sedimentation Rate): ~46 mm/hr (Faint smudge on printed sheet)
`;

    const result = parseClinicalTextOffline(smudgedReport);
    const wbc = result.readings.find(r => r.test_name.includes('WBC'));
    const esr = result.readings.find(r => r.test_name.includes('Erythrocyte Sedimentation Rate') || r.test_name.includes('ESR'));

    expect(wbc).toBeDefined();
    expect(wbc?.confidence).toBe(0.98);
    expect(wbc?.needs_review).toBe(false);

    expect(esr).toBeDefined();
    expect(esr?.value).toBe(46);
    expect(esr?.confidence).toBe(0.62);
    expect(esr?.needs_review).toBe(true);
  });

  it('handles empty text and malformed inputs gracefully without throwing', () => {
    const resultEmpty = parseClinicalTextOffline('');
    expect(resultEmpty.readings).toEqual([]);
    expect(resultEmpty.extracted_medications).toEqual([]);
    expect(resultEmpty.document_summary).toContain('extracted 0 structured biomarkers');

    const resultMalformed = parseClinicalTextOffline('==================\nRandom garbage text\nNo clinical data');
    expect(resultMalformed.readings).toEqual([]);
  });
});

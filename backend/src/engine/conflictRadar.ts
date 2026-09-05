import { BiomarkerReading, ClinicalConflict, PatientProfile } from '../types/clinical';

interface DrugClassMapping {
  class_name: string;
  atc_code: string;
  generic_names: string[];
  brand_names: string[];
}

// Transparent clinical drug class directory based on WHO-ATC and RxNorm
export const DRUG_CLASSES: DrugClassMapping[] = [
  {
    class_name: 'Penicillins / Beta-Lactams',
    atc_code: 'ATC-J01C',
    generic_names: ['penicillin', 'amoxicillin', 'ampicillin', 'amoxicillin-clavulanate', 'piperacillin', 'oxacillin', 'methicillin'],
    brand_names: ['augmentin', 'amoxil', 'unasyn', 'zosyn', 'bicillin', 'pen-vk']
  },
  {
    class_name: 'Cephalosporins (1st-3rd Gen)',
    atc_code: 'ATC-J01D',
    generic_names: ['cephalexin', 'cefuroxime', 'cefdinir', 'ceftriaxone', 'cefazolin', 'cefpodoxime'],
    brand_names: ['keflex', 'ceftin', 'omnicef', 'rocephin', 'ancef']
  },
  {
    class_name: 'Nonsteroidal Anti-inflammatory Drugs (NSAIDs)',
    atc_code: 'ATC-M01A',
    generic_names: ['ibuprofen', 'naproxen', 'aspirin', 'meloxicam', 'celecoxib', 'ketorolac', 'diclofenac', 'indomethacin'],
    brand_names: ['advil', 'motrin', 'aleve', 'toradol', 'mobic', 'celebrex', 'voltaren']
  },
  {
    class_name: 'Sulfonamide Antimicrobials',
    atc_code: 'ATC-J01E',
    generic_names: ['sulfamethoxazole', 'trimethoprim-sulfamethoxazole', 'sulfadiazine', 'sulfasalazine'],
    brand_names: ['bactrim', 'septra', 'sulfazine']
  },
  {
    class_name: 'Biguanides (Metformin)',
    atc_code: 'ATC-A10BA02',
    generic_names: ['metformin', 'metformin-er'],
    brand_names: ['glucophage', 'glumetza', 'fortamet']
  }
];

/**
 * Checks for drug-allergy contraindications, drug-condition risks, and temporal anomalies.
 */
export function detectClinicalConflicts(
  patient: PatientProfile,
  readings: BiomarkerReading[],
  extractedMedications?: { name: string; dosage?: string }[]
): ClinicalConflict[] {
  const conflicts: ClinicalConflict[] = [];

  // Combine user-reported medications with newly extracted medications from prescription documents
  const allMeds = [
    ...patient.medications.map(m => m.name.toLowerCase()),
    ...(extractedMedications || []).map(m => m.name.toLowerCase())
  ];

  // 1. Check Allergy vs Medication Contraindications
  for (const allergy of patient.allergies) {
    const allergyLower = allergy.substance.toLowerCase();

    for (const drugClass of DRUG_CLASSES) {
      const isAllergicToClass = 
        allergyLower.includes(drugClass.class_name.toLowerCase()) ||
        drugClass.generic_names.some(g => allergyLower.includes(g)) ||
        drugClass.brand_names.some(b => allergyLower.includes(b));

      if (isAllergicToClass) {
        // Find if patient is taking or prescribed any drug in this class
        for (const med of allMeds) {
          const matchesMed = 
            drugClass.generic_names.some(g => med.includes(g)) ||
            drugClass.brand_names.some(b => med.includes(b));

          if (matchesMed) {
            conflicts.push({
              id: `conflict-allergy-${allergy.substance}-${med}`,
              type: 'ALLERGY_MEDICATION_CONTRAINDICATION',
              severity: 'CRITICAL',
              title: `High-Risk Allergy Contraindication: ${med.toUpperCase()}`,
              description: `Patient has a documented allergy to "${allergy.substance}" (${allergy.reaction || 'Severe reaction'}), but was prescribed or is currently taking "${med}".`,
              clinical_rationale: `Cross-referenced against WHO-ATC class ${drugClass.atc_code} (${drugClass.class_name}). Administering this medication poses an acute risk of hypersensitivity/anaphylaxis. Immediate clinical confirmation required.`,
              items_involved: [allergy.substance, med]
            });
          }
        }
      }
    }
  }

  // 2. Check Clinical Biomarker vs Medication Contraindications (e.g. Metformin with low eGFR)
  const egfrReading = readings.find(r => r.test_name.toLowerCase().includes('egfr') && !r.needs_review);
  if (egfrReading && typeof egfrReading.value === 'number' && egfrReading.value < 30) {
    const takingMetformin = allMeds.some(m => m.includes('metformin') || m.includes('glucophage'));
    if (takingMetformin) {
      conflicts.push({
        id: 'conflict-metformin-egfr',
        type: 'CONDITION_CONTRAINDICATION',
        severity: 'CRITICAL',
        title: 'Medication Safety Alert: Metformin in Renal Impairment',
        description: `Patient eGFR is severely reduced (${egfrReading.value} mL/min/1.73m²), while active regimen includes Metformin.`,
        clinical_rationale: 'FDA Black Box Warning: Metformin is contraindicated in patients with eGFR < 30 mL/min due to elevated risk of potentially fatal lactic acidosis.',
        items_involved: ['eGFR', 'Metformin']
      });
    }
  }

  // 3. Check Temporal Anomalies
  const today = new Date();
  for (const reading of readings) {
    if (reading.date_collected) {
      const testDate = new Date(reading.date_collected);
      if (!isNaN(testDate.getTime()) && testDate > today) {
        conflicts.push({
          id: `conflict-future-date-${reading.id}`,
          type: 'TEMPORAL_ANOMALY',
          severity: 'WARNING',
          title: `Temporal Discrepancy: Future Collection Date (${reading.test_name})`,
          description: `Test date is marked as "${reading.date_collected}", which is in the future.`,
          clinical_rationale: 'Specimen timestamping inconsistency detected. Likely typographical error in original lab entry or OCR date parsing.',
          items_involved: [reading.test_name, reading.date_collected]
        });
      }
    }
  }

  // 4. Check Potassium vs ACE Inhibitors / ARBs / Spironolactone (Hyperkalemia Alert)
  const potassiumReading = readings.find(r => r.test_name.toLowerCase().includes('potassium') && !r.needs_review);
  if (potassiumReading && typeof potassiumReading.value === 'number' && potassiumReading.value >= 5.2) {
    const isTakingRaasInhibitor = allMeds.some(m =>
      /lisinopril|enalapril|ramipril|losartan|valsartan|candesartan|spironolactone|eplerenone/i.test(m)
    );
    if (isTakingRaasInhibitor) {
      conflicts.push({
        id: 'conflict-hyperkalemia-raas',
        type: 'CONDITION_CONTRAINDICATION',
        severity: potassiumReading.value >= 5.8 ? 'CRITICAL' : 'WARNING',
        title: `Electrolyte Risk: Serum Potassium ${potassiumReading.value} mEq/L with RAAS Inhibitor`,
        description: `Patient has hyperkalemia (Potassium ${potassiumReading.value} mEq/L), while taking an ACE-inhibitor, ARB, or potassium-sparing diuretic.`,
        clinical_rationale: 'RAAS inhibitors decrease aldosterone production and renal potassium excretion, compounding the danger of cardiac conduction abnormalities or arrhythmias. Recommend urgent repeat electrolyte check and medication review.',
        items_involved: ['Potassium', 'RAAS Inhibitor Regimen']
      });
    }
  }

  // 5. Check Renal Impairment vs NSAIDs (eGFR < 45 with Ibuprofen/Naproxen)
  if (egfrReading && typeof egfrReading.value === 'number' && egfrReading.value < 45) {
    const isTakingNsaid = allMeds.some(m =>
      /ibuprofen|naproxen|meloxicam|diclofenac|ketorolac|celecoxib|advil|aleve/i.test(m)
    );
    if (isTakingNsaid) {
      conflicts.push({
        id: 'conflict-nsaid-renal',
        type: 'CONDITION_CONTRAINDICATION',
        severity: 'WARNING',
        title: 'Nephrotoxic Risk: NSAID Use in Chronic Kidney Disease',
        description: `Patient eGFR is reduced (${egfrReading.value} mL/min/1.73m²), while active medications include an NSAID.`,
        clinical_rationale: 'Systemic NSAIDs inhibit renal prostaglandins, reducing renal blood flow and potentially accelerating acute-on-chronic renal decline.',
        items_involved: ['eGFR', 'NSAIDs']
      });
    }
  }

  // 6. Check Bleeding Risk: Low Platelets with Anticoagulants/Antiplatelets
  const plateletReading = readings.find(r => r.test_name.toLowerCase().includes('platelet') && !r.needs_review);
  if (plateletReading && typeof plateletReading.value === 'number' && plateletReading.value < 60) {
    const isTakingAnticoag = allMeds.some(m =>
      /warfarin|coumadin|apixaban|eliquis|rivaroxaban|xarelto|clopidogrel|plavix|dabigatran/i.test(m)
    );
    if (isTakingAnticoag) {
      conflicts.push({
        id: 'conflict-platelet-anticoag',
        type: 'CONDITION_CONTRAINDICATION',
        severity: 'CRITICAL',
        title: `Hemorrhagic Danger: Severe Thrombocytopenia (${plateletReading.value}k/uL) on Anticoagulation`,
        description: `Platelet count is markedly decreased while active regimen includes blood-thinning agents.`,
        clinical_rationale: 'Concomitant anticoagulation during severe thrombocytopenia markedly multiplies spontaneous gastrointestinal or intracranial hemorrhage risk.',
        items_involved: ['Platelet Count', 'Anticoagulant']
      });
    }
  }

  return conflicts;
}

import { evaluateBiomarkerStatus, parseReferenceRangeString } from './rangeEvaluator';
const TEST_CATALOG = [
    // Metabolic
    {
        canonicalName: 'Fasting Blood Glucose',
        category: 'Metabolic',
        patterns: [/fasting\s+(?:blood\s+)?glucose/i, /glucose[,\s]+fasting/i, /\bglucose\b/i],
        defaultUnit: 'mg/dL'
    },
    {
        canonicalName: 'Hemoglobin A1c',
        category: 'Metabolic',
        patterns: [/hemoglobin\s+a1c/i, /hba1c/i, /glycated\s+hemoglobin/i, /a1c\b/i],
        defaultUnit: '%'
    },
    {
        canonicalName: 'Serum Calcium',
        category: 'Metabolic',
        patterns: [/serum\s+calcium/i, /\bcalcium[,\s]+serum/i, /\bcalcium\b/i],
        defaultUnit: 'mg/dL'
    },
    {
        canonicalName: 'Total Protein',
        category: 'Metabolic',
        patterns: [/total\s+protein/i, /\bprotein[,\s]+total/i],
        defaultUnit: 'g/dL'
    },
    {
        canonicalName: 'Serum Albumin',
        category: 'Metabolic',
        patterns: [/serum\s+albumin/i, /\balbumin[,\s]+serum/i, /\balbumin\b/i],
        defaultUnit: 'g/dL'
    },
    // Lipid Panel
    {
        canonicalName: 'Total Cholesterol',
        category: 'Lipid Panel',
        patterns: [/total\s+cholesterol/i, /cholesterol[,\s]+total/i],
        defaultUnit: 'mg/dL'
    },
    {
        canonicalName: 'HDL Cholesterol',
        category: 'Lipid Panel',
        patterns: [/hdl\s+(?:cholesterol|c)/i, /cholesterol[,\s]+hdl/i],
        defaultUnit: 'mg/dL'
    },
    {
        canonicalName: 'LDL Cholesterol',
        category: 'Lipid Panel',
        patterns: [/ldl\s+(?:cholesterol|c)(?:\s*\(calculated\))?/i, /cholesterol[,\s]+ldl/i],
        defaultUnit: 'mg/dL'
    },
    {
        canonicalName: 'Triglycerides',
        category: 'Lipid Panel',
        patterns: [/\btriglycerides?\b/i],
        defaultUnit: 'mg/dL'
    },
    // Renal & Electrolytes
    {
        canonicalName: 'Serum Creatinine',
        category: 'Renal',
        patterns: [/serum\s+creatinine/i, /creatinine[,\s]+serum/i, /\bcreatinine\b/i],
        defaultUnit: 'mg/dL'
    },
    {
        canonicalName: 'eGFR',
        category: 'Renal',
        patterns: [/egfr\s*(?:\([a-z0-9-]+\))?/i, /estimated\s+gfr/i, /\bgfr\b/i],
        defaultUnit: 'mL/min'
    },
    {
        canonicalName: 'Blood Urea Nitrogen (BUN)',
        category: 'Renal',
        patterns: [/blood\s+urea\s+nitrogen/i, /\bbun\b/i, /\burea\b/i],
        defaultUnit: 'mg/dL'
    },
    {
        canonicalName: 'Serum Potassium',
        category: 'Renal',
        patterns: [/serum\s+potassium/i, /potassium[,\s]+serum/i, /\bpotassium\b/i],
        defaultUnit: 'mEq/L'
    },
    {
        canonicalName: 'Serum Sodium',
        category: 'Renal',
        patterns: [/serum\s+sodium/i, /sodium[,\s]+serum/i, /\bsodium\b/i],
        defaultUnit: 'mEq/L'
    },
    {
        canonicalName: 'Serum Chloride',
        category: 'Renal',
        patterns: [/serum\s+chloride/i, /chloride[,\s]+serum/i, /\bchloride\b/i],
        defaultUnit: 'mEq/L'
    },
    {
        canonicalName: 'Urine Albumin/Creatinine Ratio',
        category: 'Renal',
        patterns: [/urine\s+albumin[\s/]+creatinine\s+ratio/i, /\buacr\b/i, /microalbumin[\s/]+creatinine/i],
        defaultUnit: 'mg/g'
    },
    // Complete Blood Count
    {
        canonicalName: 'White Blood Cells (WBC)',
        category: 'Complete Blood Count',
        patterns: [/white\s+blood\s+(?:cells?|count)/i, /\bwbc\b/i, /leukocyte\s+count/i],
        defaultUnit: 'x10^3/uL'
    },
    {
        canonicalName: 'Red Blood Cells (RBC)',
        category: 'Complete Blood Count',
        patterns: [/red\s+blood\s+(?:cells?|count)/i, /\brbc\b/i, /erythrocyte\s+count/i],
        defaultUnit: 'x10^6/uL'
    },
    {
        canonicalName: 'Hemoglobin',
        category: 'Complete Blood Count',
        patterns: [/\bhemoglobin\b/i, /\bhgb\b/i],
        defaultUnit: 'g/dL'
    },
    {
        canonicalName: 'Hematocrit',
        category: 'Complete Blood Count',
        patterns: [/\bhematocrit\b/i, /\bhct\b/i],
        defaultUnit: '%'
    },
    {
        canonicalName: 'Platelet Count',
        category: 'Complete Blood Count',
        patterns: [/\bplatelet\s+count\b/i, /\bplatelets?\b/i, /\bplt\b/i],
        defaultUnit: 'x10^3/uL'
    },
    {
        canonicalName: 'Neutrophils, Absolute',
        category: 'Complete Blood Count',
        patterns: [/neutrophils[,\s]+absolute/i, /absolute\s+neutrophil\s+count/i, /\banc\b/i],
        defaultUnit: 'x10^3/uL'
    },
    {
        canonicalName: 'Lymphocytes, Absolute',
        category: 'Complete Blood Count',
        patterns: [/lymphocytes[,\s]+absolute/i, /absolute\s+lymphocyte\s+count/i],
        defaultUnit: 'x10^3/uL'
    },
    // Inflammatory
    {
        canonicalName: 'Erythrocyte Sedimentation Rate (ESR)',
        category: 'Inflammatory',
        patterns: [/erythrocyte\s+sed(?:imentation)?\s+rate/i, /\besr\b/i, /sed\s+rate/i],
        defaultUnit: 'mm/hr'
    },
    {
        canonicalName: 'C-Reactive Protein (CRP)',
        category: 'Inflammatory',
        patterns: [/c-reactive\s+protein/i, /\bcrp\b/i, /\bhs-crp\b/i],
        defaultUnit: 'mg/L'
    },
    {
        canonicalName: 'Ferritin',
        category: 'Inflammatory',
        patterns: [/\bferritin\b/i, /serum\s+ferritin/i],
        defaultUnit: 'ng/mL'
    },
    // Hepatic
    {
        canonicalName: 'Alkaline Phosphatase',
        category: 'Hepatic',
        patterns: [/alkaline\s+phosphatase/i, /\balk\s*phos\b/i, /\balp\b/i],
        defaultUnit: 'U/L'
    },
    {
        canonicalName: 'Alanine Aminotransferase (ALT)',
        category: 'Hepatic',
        patterns: [/alanine\s+aminotransferase/i, /\balt\b/i, /\bsgpt\b/i],
        defaultUnit: 'U/L'
    },
    {
        canonicalName: 'Aspartate Aminotransferase (AST)',
        category: 'Hepatic',
        patterns: [/aspartate\s+aminotransferase/i, /\bast\b/i, /\bsgot\b/i],
        defaultUnit: 'U/L'
    },
    // Thyroid
    {
        canonicalName: 'Thyroid Stimulating Hormone (TSH)',
        category: 'Other',
        patterns: [/thyroid\s+stimulating\s+hormone/i, /\btsh\b/i],
        defaultUnit: 'uIU/mL'
    },
    {
        canonicalName: 'Free Thyroxine (Free T4)',
        category: 'Other',
        patterns: [/free\s+t4/i, /free\s+thyroxine/i, /\bft4\b/i],
        defaultUnit: 'ng/dL'
    },
    // Vitals
    {
        canonicalName: 'Resting Pulse Rate',
        category: 'Other',
        patterns: [/\bpulse\b/i, /heart\s+rate/i, /\bhr\b/i],
        defaultUnit: 'bpm'
    },
    {
        canonicalName: 'Body Temperature',
        category: 'Other',
        patterns: [/\btemp(?:erature)?\b/i],
        defaultUnit: 'F'
    },
    {
        canonicalName: 'Oxygen Saturation (SpO2)',
        category: 'Other',
        patterns: [/spo2/i, /oxygen\s+sat(?:uration)?/i],
        defaultUnit: '%'
    }
];
export function parseClinicalTextOffline(rawText) {
    const lines = rawText.split(/\r?\n/);
    const readings = [];
    const extractedMeds = [];
    let extractedPatientInfo = {};
    // 1. Scan header lines for Patient Demographics
    for (const line of lines.slice(0, 20)) {
        // Patient Name
        const nameMatch = line.match(/patient(?:\s*name)?\s*[:|]\s*([A-Za-z\s.]+?)(?:\s*[|;,]|\s+dob|\s+age|\s*$)/i);
        if (nameMatch && nameMatch[1].trim().length > 2 && !extractedPatientInfo.name) {
            extractedPatientInfo.name = nameMatch[1].trim();
        }
        // Age
        const ageMatch = line.match(/age\s*[:|]\s*(\d{1,3})/i);
        if (ageMatch && !extractedPatientInfo.age) {
            extractedPatientInfo.age = parseInt(ageMatch[1], 10);
        }
        // Sex
        const sexMatch = line.match(/sex\s*[:|]\s*([MF]|male|female|other)/i);
        if (sexMatch && !extractedPatientInfo.sex) {
            const s = sexMatch[1].toUpperCase();
            extractedPatientInfo.sex = s === 'M' || s.startsWith('MAL') ? 'Male' : s === 'F' || s.startsWith('FEM') ? 'Female' : 'Other';
        }
        // Collection Date
        const dateMatch = line.match(/(?:collected|date)\s*[:|]\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i);
        if (dateMatch && !extractedPatientInfo.collection_date) {
            extractedPatientInfo.collection_date = dateMatch[1];
        }
    }
    // 2. Scan lines for Prescription / Medication entries
    for (const line of lines) {
        const rxMatch = line.match(/(?:rx|medication|prescribed)\s*[:|]\s*([A-Za-z0-9\s/-]+?)(?:\s*(?:strength|sig|#|\n|$))/i);
        if (rxMatch) {
            const medName = rxMatch[1].trim();
            if (medName.length > 2) {
                extractedMeds.push({ name: medName });
            }
        }
        // Augmentin / Amoxicillin / Metformin direct detect
        if (/augmentin|amoxicillin|lisinopril|metformin|atorvastatin|warfarin|apixaban/i.test(line)) {
            const medWord = line.match(/\b(augmentin|amoxicillin|lisinopril|metformin|atorvastatin|warfarin|apixaban|aspirin|ibuprofen)\b/i);
            if (medWord && !extractedMeds.some(m => m.name.toLowerCase().includes(medWord[1].toLowerCase()))) {
                extractedMeds.push({ name: medWord[1] });
            }
        }
    }
    // 3. Scan lines for Lab Biomarkers
    const processedTests = new Set();
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('=') || line.startsWith('-') || line.length < 5)
            continue;
        for (const catalogEntry of TEST_CATALOG) {
            if (processedTests.has(catalogEntry.canonicalName))
                continue;
            const matches = catalogEntry.patterns.some(p => p.test(line));
            if (!matches)
                continue;
            // Extract numbers from this line
            // Standard format: [TestName] [Value] [Unit] [Reference Range] [Flag]
            // Or: Temp 99.8 F | Pulse 82 bpm
            // Look for numeric value
            const numberRegex = /(?:~?\s*)?([<>]?\s*\d+(?:\.\d+)?)/g;
            const numbers = [];
            let m;
            // Extract tokens after test name
            let sub = line;
            for (const p of catalogEntry.patterns) {
                const found = line.match(p);
                if (found && found.index !== undefined) {
                    sub = line.slice(found.index + found[0].length);
                    break;
                }
            }
            while ((m = numberRegex.exec(sub)) !== null) {
                numbers.push(m[1].trim());
            }
            if (numbers.length === 0)
                continue;
            const rawValStr = numbers[0].replace('~', '').trim();
            const numVal = parseFloat(rawValStr);
            if (isNaN(numVal))
                continue;
            // Unit extraction: look for known unit or default
            const unitMatch = sub.match(/(mg\/dL|g\/dL|mmol\/L|mEq\/L|%|x10\^3\/uL|x10\^6\/uL|mm\/hr|mg\/L|ng\/mL|U\/L|uIU\/mL|bpm|F|C|mg\/g|mL\/min)/i);
            const unit = unitMatch ? unitMatch[1] : catalogEntry.defaultUnit;
            // Reference Range extraction
            // Look for range pattern like "70 - 99", "< 5.7", "> 60", "0.70 - 1.30", or "Unspecified"
            let textRange = 'Unspecified by Laboratory';
            let isPresent = false;
            const rangeMatch = sub.match(/(\d+(?:\.\d+)?\s*[-–—to]+\s*\d+(?:\.\d+)?|[<>≤≥]\s*\d+(?:\.\d+)?)/i);
            if (rangeMatch) {
                textRange = rangeMatch[1].trim();
                isPresent = true;
            }
            else if (/unspecified|none\s*given|n\/a/i.test(sub)) {
                textRange = 'Unspecified by Laboratory';
                isPresent = false;
            }
            // Check if low confidence (smudge, question mark, tilde)
            const hasSmudge = line.includes('?') || line.includes('~') || /smudge|unclear|faint/i.test(line);
            const confidence = hasSmudge ? 0.62 : 0.98;
            const refRange = {
                ...parseReferenceRangeString(textRange),
                text_range: textRange,
                is_present: isPresent
            };
            const status = evaluateBiomarkerStatus(catalogEntry.canonicalName, numVal, refRange);
            readings.push({
                id: `offline-read-${Date.now()}-${readings.length}`,
                test_name: catalogEntry.canonicalName,
                category: catalogEntry.category,
                value: numVal,
                unit: unit,
                reference_range: refRange,
                status: status,
                date_collected: extractedPatientInfo.collection_date || new Date().toISOString().split('T')[0],
                confidence: confidence,
                needs_review: confidence < 0.70,
                source_snippet: line,
                provenance: 'EXTRACTED_UNVERIFIED'
            });
            processedTests.add(catalogEntry.canonicalName);
            break;
        }
    }
    const outOfRange = readings.filter(r => r.status === 'HIGH' || r.status === 'LOW' || r.status === 'CRITICAL');
    const summary = `Local Clinical Parser extracted ${readings.length} structured biomarkers. ${outOfRange.length > 0
        ? `${outOfRange.length} value(s) fall outside source laboratory reference intervals.`
        : 'All extracted values fall within reported reference intervals.'} Zero-hallucination reference range rules strictly enforced.`;
    return {
        readings,
        document_summary: summary,
        extracted_patient_info: extractedPatientInfo,
        extracted_medications: extractedMeds
    };
}

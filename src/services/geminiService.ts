import { GoogleGenAI, Type } from '@google/genai';
import { BiomarkerReading, BiomarkerStatus, ReferenceRange } from '../types/clinical';
import { evaluateBiomarkerStatus, isGatedForReview } from '../engine/rangeEvaluator';

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
 * Executes multimodal extraction via Gemini 2.5 Flash with strict JSON Schema.
 */
export async function extractMedicalReportWithGemini(
  apiKey: string,
  fileData: { base64: string; mimeType: string },
  patientContext?: string
): Promise<ExtractionResult> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are MedLens Clinical Information Intelligence, a specialized medical document extraction engine.
Carefully parse this medical document (laboratory report, prescription, or clinical summary).

CRITICAL CLINICAL RULES:
1. ONLY extract laboratory values that are physically visible.
2. REFERENCE RANGES: Extract ONLY the reference range printed on the source document. If a reference range is absent or omitted, set "is_present" to false and "text_range" to "Unspecified by Laboratory". NEVER invent, estimate, or hallucinate a reference range.
3. SOURCE SNIPPET: For every single extracted value, copy the exact verbatim text line where this number appeared.
4. CONFIDENCE SCORE: Rate your optical character recognition confidence from 0.0 to 1.0. If the text is blurred, handwriting is faint, or characters are ambiguous, assign a confidence score below 0.70.
5. NO DIAGNOSES: Do not diagnose medical conditions. Simply extract the objective findings.
${patientContext ? `Known patient context: ${patientContext}` : ''}`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      patient_info: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          age: { type: Type.INTEGER },
          sex: { type: Type.STRING },
          collection_date: { type: Type.STRING }
        }
      },
      document_summary: {
        type: Type.STRING,
        description: 'Brief, objective 2-sentence summary of the document type and contents'
      },
      tests: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            test_name: { type: Type.STRING },
            category: { 
              type: Type.STRING,
              description: 'One of: Metabolic, Complete Blood Count, Lipid Panel, Renal, Hepatic, Inflammatory, Other'
            },
            value: { type: Type.STRING, description: 'Numeric or qualitative value as string' },
            unit: { type: Type.STRING },
            reference_range: {
              type: Type.OBJECT,
              properties: {
                low: { type: Type.NUMBER },
                high: { type: Type.NUMBER },
                text_range: { type: Type.STRING },
                is_present: { type: Type.BOOLEAN }
              },
              required: ['text_range', 'is_present']
            },
            date_collected: { type: Type.STRING },
            specimen_type: { type: Type.STRING },
            confidence: { type: Type.NUMBER, description: 'Confidence between 0.0 and 1.0' },
            source_snippet: { type: Type.STRING, description: 'Verbatim text line from the report' },
            notes: { type: Type.STRING }
          },
          required: ['test_name', 'value', 'unit', 'reference_range', 'confidence', 'source_snippet']
        }
      }
    },
    required: ['document_summary', 'tests']
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: fileData.mimeType,
              data: fileData.base64
            }
          },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.1 // Low temperature for deterministic, factual extraction
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  const testsRaw = parsed.tests || [];

  const readings: BiomarkerReading[] = testsRaw.map((t: any, index: number) => {
    // Process numeric vs string value
    const numericParsed = parseFloat(String(t.value).replace(/[^0-9.-]/g, ''));
    const finalValue = isNaN(numericParsed) ? t.value : numericParsed;

    const refRange: ReferenceRange = {
      low: t.reference_range?.low,
      high: t.reference_range?.high,
      text_range: t.reference_range?.text_range || 'Unspecified by Laboratory',
      is_present: Boolean(t.reference_range?.is_present)
    };

    const status: BiomarkerStatus = evaluateBiomarkerStatus(t.test_name, finalValue, refRange);
    const confidence = typeof t.confidence === 'number' ? Math.min(Math.max(t.confidence, 0), 1) : 0.95;

    const reading: BiomarkerReading = {
      id: `ai-extracted-${Date.now()}-${index}`,
      test_name: t.test_name,
      category: t.category || 'Other',
      value: finalValue,
      unit: t.unit || '',
      reference_range: refRange,
      status: status,
      date_collected: t.date_collected || parsed.patient_info?.collection_date || new Date().toISOString().split('T')[0],
      specimen_type: t.specimen_type || 'Blood',
      confidence: confidence,
      needs_review: confidence < 0.70,
      source_snippet: t.source_snippet || '',
      provenance: confidence >= 0.70 ? 'EXTRACTED_UNVERIFIED' : 'EXTRACTED_UNVERIFIED',
      notes: t.notes
    };

    return reading;
  });

  return {
    readings,
    document_summary: parsed.document_summary || 'Document processed successfully.',
    extracted_patient_info: parsed.patient_info
  };
}

/**
 * Generates an educational, non-diagnostic synthesis of lab results using Gemini.
 */
export async function generatePatientFriendlySummary(
  apiKey: string,
  patientName: string,
  readings: BiomarkerReading[]
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const abnormal = readings.filter(r => r.status === 'HIGH' || r.status === 'LOW' || r.status === 'CRITICAL');
  const normal = readings.filter(r => r.status === 'NORMAL');

  const prompt = `You are MedLens Health Intelligence Assistant.
Write a clear, reassuring, and patient-friendly educational summary of the following test results for ${patientName}.

STRICT SAFETY & RESPONSIBLE AI DIRECTIVES:
1. Under NO circumstances provide a definitive medical diagnosis (e.g. Do NOT say "You have kidney disease" or "You have diabetes").
2. Under NO circumstances prescribe medications or recommend changes to prescription dosages.
3. Plain Language: Explain what tests like eGFR, HbA1c, or Creatinine measure in terms a high school student can easily understand.
4. Always frame results relative to the lab's printed reference range (e.g., "Your fasting blood sugar was noted as above the lab's standard reference interval").
5. Conclude with encouraging the patient to discuss these findings with their primary care provider.

Abnormal Findings:
${abnormal.map(a => `- ${a.test_name}: ${a.value} ${a.unit} (Lab Reference Range: ${a.reference_range.text_range}, Status: ${a.status})`).join('\n')}

Normal Findings Count: ${normal.length} markers within standard reference bounds.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      temperature: 0.3
    }
  });

  return response.text || 'Summary could not be generated.';
}

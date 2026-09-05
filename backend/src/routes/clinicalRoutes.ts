import { Router, Request, Response } from 'express';
import { evaluateBiomarkerStatus } from '../engine/rangeEvaluator';
import { detectClinicalConflicts } from '../engine/conflictRadar';
import { calculateLongitudinalTrends } from '../engine/chronometer';
import { generateSbarReport, exportToFhirR4 } from '../engine/sbarGenerator';
import { CLINICAL_PRESETS } from '../data_presets';
import { GoogleGenAI, Type } from '@google/genai';

export const clinicalRouter = Router();

// Healthcheck
clinicalRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'MedLens Clinical Intelligence API',
    version: '2.5.0',
    deterministic_engine: 'Active',
    safety_radar: 'WHO-ATC / RxNorm Grounded',
    timestamp: new Date().toISOString()
  });
});

// Presets for 1-Click evaluation
clinicalRouter.get('/presets', (req: Request, res: Response) => {
  res.json(CLINICAL_PRESETS);
});

// Deterministic Range Evaluation Endpoint
clinicalRouter.post('/evaluate', (req: Request, res: Response) => {
  const { test_name, value, reference_range } = req.body;
  if (!test_name) {
    return res.status(400).json({ error: 'test_name is required' });
  }
  const status = evaluateBiomarkerStatus(test_name, value, reference_range || { is_present: false, text_range: 'Unspecified by Laboratory' });
  res.json({ test_name, value, status });
});

// Clinical Contradiction Radar Endpoint
clinicalRouter.post('/conflicts', (req: Request, res: Response) => {
  const { patient, readings, extracted_medications } = req.body;
  if (!patient || !readings) {
    return res.status(400).json({ error: 'patient and readings are required' });
  }
  const conflicts = detectClinicalConflicts(patient, readings, extracted_medications);
  res.json({ conflicts, count: conflicts.length });
});

// Longitudinal Chronometer Trends Endpoint
clinicalRouter.post('/trends', (req: Request, res: Response) => {
  const { current_readings, historical_readings } = req.body;
  const trends = calculateLongitudinalTrends(current_readings || [], historical_readings || []);
  res.json({ trends, count: trends.length });
});

// SBAR Doctor Briefing Generation Endpoint
clinicalRouter.post('/sbar', (req: Request, res: Response) => {
  const { patient, readings, conflicts, trends } = req.body;
  if (!patient || !readings) {
    return res.status(400).json({ error: 'patient and readings are required' });
  }
  const sbar = generateSbarReport(patient, readings, conflicts || [], trends || []);
  res.json({ sbar });
});

// FHIR R4 Standard Export Endpoint
clinicalRouter.post('/fhir', (req: Request, res: Response) => {
  const { patient, readings, report_title } = req.body;
  if (!patient || !readings) {
    return res.status(400).json({ error: 'patient and readings are required' });
  }
  const fhirBundle = exportToFhirR4(patient, readings, report_title || 'Laboratory Report');
  res.json(fhirBundle);
});

// Gemini 2.5 Flash Multimodal Extraction Endpoint
clinicalRouter.post('/extract', async (req: Request, res: Response) => {
  const { base64, mime_type, api_key, patient_context } = req.body;
  const key = api_key || process.env.GEMINI_API_KEY;

  if (!key) {
    return res.status(400).json({ error: 'Gemini API key is required either in request or environment' });
  }

  if (!base64 || !mime_type) {
    return res.status(400).json({ error: 'Document base64 and mime_type are required' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });

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
              category: { type: Type.STRING },
              value: { type: Type.STRING },
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
              confidence: { type: Type.NUMBER },
              source_snippet: { type: Type.STRING },
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
            { inlineData: { mimeType: mime_type, data: base64 } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.1
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gemini processing failed' });
  }
});

import { Router, Request, Response } from 'express';
import { 
  evaluateBiomarkerStatus, 
  detectClinicalConflicts, 
  calculateLongitudinalTrends, 
  generateSbarReport, 
  exportToFhirR4 
} from '@medlens/clinical-engine';
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
    return res.status(400).json({ error: 'Gemini API key is required either in server environment (GEMINI_API_KEY) or request payload' });
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
${patient_context ? `Known patient context: ${patient_context}` : ''}`;

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
    const testsRaw = parsed.tests || [];

    const readings = testsRaw.map((t: any, index: number) => {
      const numericParsed = parseFloat(String(t.value).replace(/[^0-9.-]/g, ''));
      const finalValue = isNaN(numericParsed) ? t.value : numericParsed;

      const refRange = {
        low: t.reference_range?.low,
        high: t.reference_range?.high,
        text_range: t.reference_range?.text_range || 'Unspecified by Laboratory',
        is_present: Boolean(t.reference_range?.is_present)
      };

      const status = evaluateBiomarkerStatus(t.test_name, finalValue, refRange);
      const confidence = typeof t.confidence === 'number' ? Math.min(Math.max(t.confidence, 0), 1) : 0.95;

      return {
        id: `ai-extracted-${Date.now()}-${index}`,
        test_name: t.test_name,
        category: t.category || 'Other',
        value: finalValue,
        unit: t.unit || '',
        reference_range: refRange,
        status,
        date_collected: t.date_collected || parsed.patient_info?.collection_date || new Date().toISOString().split('T')[0],
        specimen_type: t.specimen_type || 'Blood',
        confidence,
        needs_review: confidence < 0.70,
        source_snippet: t.source_snippet || '',
        provenance: 'EXTRACTED_UNVERIFIED',
        notes: t.notes
      };
    });

    res.json({
      readings,
      document_summary: parsed.document_summary || 'Document processed successfully.',
      extracted_patient_info: parsed.patient_info
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gemini processing failed' });
  }
});

// Gemini Patient-Friendly Summary Generation Endpoint
clinicalRouter.post('/summary', async (req: Request, res: Response) => {
  const { patient_name, readings, api_key } = req.body;
  const key = api_key || process.env.GEMINI_API_KEY;

  if (!key) {
    return res.status(400).json({ error: 'Gemini API key is required either in server environment (GEMINI_API_KEY) or request payload' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const abnormal = (readings || []).filter((r: any) => r.status === 'HIGH' || r.status === 'LOW' || r.status === 'CRITICAL');
    const normal = (readings || []).filter((r: any) => r.status === 'NORMAL');

    const prompt = `You are MedLens Health Intelligence Assistant.
Write a clear, reassuring, and patient-friendly educational summary of the following test results for ${patient_name || 'the patient'}.

STRICT SAFETY & RESPONSIBLE AI DIRECTIVES:
1. Under NO circumstances provide a definitive medical diagnosis (e.g. Do NOT say "You have kidney disease" or "You have diabetes").
2. Under NO circumstances prescribe medications or recommend changes to prescription dosages.
3. Plain Language: Explain what tests like eGFR, HbA1c, or Creatinine measure in terms a high school student can easily understand.
4. Always frame results relative to the lab's printed reference range (e.g., "Your fasting blood sugar was noted as above the lab's standard reference interval").
5. Conclude with encouraging the patient to discuss these findings with their primary care provider.

Abnormal Findings:
${abnormal.map((a: any) => `- ${a.test_name}: ${a.value} ${a.unit} (Lab Reference Range: ${a.reference_range?.text_range}, Status: ${a.status})`).join('\n')}

Normal Findings Count: ${normal.length} markers within standard reference bounds.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: { temperature: 0.3 }
    });

    res.json({ summary: response.text || 'Summary could not be generated.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Summary generation failed' });
  }
});

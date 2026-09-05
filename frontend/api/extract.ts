import { GoogleGenAI, Type } from '@google/genai';
import { evaluateBiomarkerStatus } from '@medlens/clinical-engine';

/**
 * Rate Limiter for AI endpoints (~30 req/min per IP).
 * - Primary (Distributed): Upstash Redis / Vercel KV REST API if KV_REST_API_URL or UPSTASH_REDIS_REST_URL is configured.
 * - Fallback (Instance-Local): In-memory Map sliding window.
 */
const ipMap = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(req: any): Promise<boolean> {
  const ip = (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'anonymous';
  const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const key = `ratelimit:gemini:${ip}`;
      const res = await fetch(`${redisUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, 60]
        ]),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) {
        const data = await res.json();
        const currentCount = data?.[0]?.result;
        if (typeof currentCount === 'number' && currentCount > 30) {
          return true;
        }
        return false;
      }
    } catch {
      // Degrade gracefully to in-memory on network failure/timeout
    }
  }

  // In-memory fallback per Lambda instance
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now > entry.resetTime) {
    ipMap.set(ip, { count: 1, resetTime: now + 60000 });
    return false;
  }
  if (entry.count >= 30) return true;
  entry.count++;
  return false;
}

function handleCors(req: any, res: any): boolean {
  const origin = req.headers?.origin || req.headers?.Origin;
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o: string) => o.trim())
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://medlens-nnv1ve9zm-aibs4.vercel.app',
        'https://medlens-aibs4.vercel.app',
        'https://medlens.vercel.app'
      ];

  const isAllowed = !origin || allowedOrigins.includes(origin) || (typeof origin === 'string' && origin.endsWith('.vercel.app'));

  if (origin && isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || 'http://localhost:3000');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return true;
  }

  if (origin && !isAllowed) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: `CORS blocked for origin: ${origin}` }));
    return true;
  }

  return false;
}

async function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c: any) => { data += typeof c === 'string' ? c : Buffer.isBuffer(c) ? c.toString('utf8') : ''; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');

  if (await checkRateLimit(req)) {
    res.statusCode = 429;
    res.end(JSON.stringify({ error: 'Too many clinical AI extraction requests. Please wait a minute before retrying.' }));
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Gemini API key is not configured on the server. Set GEMINI_API_KEY in environment.' }));
    return;
  }

  const body = await parseBody(req);
  const { base64, mime_type, patient_context } = body;

  if (!base64 || !mime_type) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Document base64 and mime_type are required' }));
    return;
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

    res.statusCode = 200;
    res.end(JSON.stringify({
      readings,
      document_summary: parsed.document_summary || 'Document processed successfully.',
      extracted_patient_info: parsed.patient_info
    }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message || 'Gemini processing failed' }));
  }
}

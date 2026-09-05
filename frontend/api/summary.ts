import { GoogleGenAI } from '@google/genai';

const ipMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(req: any): boolean {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'anonymous';
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (checkRateLimit(req)) {
    res.statusCode = 429;
    res.end(JSON.stringify({ error: 'Too many clinical AI requests. Please wait a minute before retrying.' }));
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Gemini API key is not configured on the server. Set GEMINI_API_KEY in environment.' }));
    return;
  }

  const body = await parseBody(req);
  const { patient_name, readings } = body;

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

    res.statusCode = 200;
    res.end(JSON.stringify({ summary: response.text || 'Summary could not be generated.' }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message || 'Summary generation failed' }));
  }
}

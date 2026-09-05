import { GoogleGenAI } from '@google/genai';

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

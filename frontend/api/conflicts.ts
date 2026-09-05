import { detectClinicalConflicts } from '@medlens/clinical-engine';

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

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

export default async function handler(req: any, res: any) {
  try {
    if (handleCors(req, res)) return;
    res.setHeader('Content-Type', 'application/json');

  const body = await parseBody(req);
  const { patient, readings, extracted_medications } = body;

  if (!patient || !readings) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'patient and readings are required' }));
    return;
  }

  const conflicts = detectClinicalConflicts(patient, readings, extracted_medications);
  res.statusCode = 200;
  res.end(JSON.stringify({ conflicts, count: conflicts.length }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message || 'Conflict evaluation failed' }));
  }
}

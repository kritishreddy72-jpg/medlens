import type { IncomingMessage, ServerResponse } from 'http';

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

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (handleCors(req, res)) return;

  res.setHeader('Content-Type', 'application/json');

  res.statusCode = 200;
  res.end(
    JSON.stringify({
      status: 'ok',
      service: 'MedLens Clinical Intelligence API',
      version: '2.5.0',
      deterministic_engine: 'Active',
      safety_radar: 'WHO-ATC / RxNorm Grounded',
      timestamp: new Date().toISOString()
    })
  );
}

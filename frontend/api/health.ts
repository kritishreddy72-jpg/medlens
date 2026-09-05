import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

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

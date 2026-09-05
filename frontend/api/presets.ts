import type { IncomingMessage, ServerResponse } from 'http';
import { CLINICAL_PRESETS } from '@medlens/clinical-engine';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  try {
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
    res.end(JSON.stringify(CLINICAL_PRESETS));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
  }
}

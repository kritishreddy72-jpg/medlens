import express from 'express';
import cors from 'cors';
import { clinicalRouter } from './routes/clinicalRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Mount Clinical Intelligence Routes
app.use('/api', clinicalRouter);

// Root Welcome
app.get('/', (req, res) => {
  res.json({
    name: 'MedLens Clinical Intelligence API',
    description: 'Deterministic Validation Layer & Gemini Multimodal Extraction Engine',
    version: '2.5.0',
    endpoints: [
      'GET  /api/health',
      'GET  /api/presets',
      'POST /api/evaluate',
      'POST /api/conflicts',
      'POST /api/trends',
      'POST /api/sbar',
      'POST /api/fhir',
      'POST /api/extract'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`[MedLens Backend] Running on http://127.0.0.1:${PORT}`);
  console.log(`[MedLens Backend] Health check: http://127.0.0.1:${PORT}/api/health`);
});

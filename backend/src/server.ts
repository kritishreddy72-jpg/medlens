import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { clinicalRouter } from './routes/clinicalRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers
app.use(helmet());

// Rate Limiter: specifically for paid Gemini API routes (~30 req/min per IP)
const geminiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many clinical AI requests from this IP. Please wait a minute before retrying.'
  }
});

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://medlens-nnv1ve9zm-aibs4.vercel.app',
      'https://medlens-aibs4.vercel.app',
      'https://medlens.vercel.app'
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Apply rate limiting specifically on AI endpoints
app.use('/api/extract', geminiRateLimiter);
app.use('/api/summary', geminiRateLimiter);

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

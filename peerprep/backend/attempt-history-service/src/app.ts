import express from 'express';
import config from './config/config.js';
import attemptRoutes from './routes/attemptRoutes.js';

const app = express();

// Basic CORS handling for browser clients (adjust origin as needed)
app.use((req, res, next) => {
  // Support flexible CORS during development.
  // Set `CORS_ORIGIN` to a comma-separated list of allowed origins if needed.
  const allowed = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin as string | undefined;
  if (origin && allowed.includes(origin)) {
    // Echo back the request origin when it's allowed (required for CORS correctness)
    res.header('Access-Control-Allow-Origin', origin);
  } else if (allowed.includes('*')) {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // If this is a preflight request, respond immediately
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'PeerPrep Attempt History Service',
    version: '1.0.0',
    environment: config.environment
  });
});

// Mount attempt history routes under /attempts
app.use('/attempts', attemptRoutes);

export default app;
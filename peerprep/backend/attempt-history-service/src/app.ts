import express from 'express';
import config from './config/config.js';
import attemptRoutes from './routes/attemptRoutes.js';

const app = express();
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
import express from 'express';
import config from './config/config.ts';
import questionRouter from './routes/questionRoutes.ts';

const app = express();
app.use(express.json());

app.use('/api/question', questionRouter)

app.get('/', (req, res) => {
  res.json({
    message: 'PeerPrep Question Service',
    version: '1.0.0',
    environment: config.environment
  })
})

app.get('/{*any}', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`
  })
})

// Global error handler (should be after routes)
// app.use(errorHandler);

export default app;
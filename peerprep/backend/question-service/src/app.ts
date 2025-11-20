import express from 'express';
import config from './config/config.js';
import questionRouter from './routes/questionRoutes.js';

const app = express();
app.use(express.json());

app.use('/api/questions', questionRouter)

app.get('/', (req, res) => {
  res.json({
    message: 'PeerPrep Question Service',
    version: '1.0.0',
    environment: config.environment
  })
})

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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
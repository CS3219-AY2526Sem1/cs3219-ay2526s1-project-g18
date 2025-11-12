import dotenv from 'dotenv';

// Load .env into process.env for local development
dotenv.config();

// Plain JavaScript configuration (no TypeScript types here)
const config = {
  serverPort: Number(process.env.SERVER_PORT) || 3000,
  environment: process.env.NODE_ENV || 'development',
};

export default config;
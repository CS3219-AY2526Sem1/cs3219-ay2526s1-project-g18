import dotenv from 'dotenv';

dotenv.config();

interface Config {
  serverPort: number;
  environment: string;
}

const config: Config = {
  serverPort: Number(process.env.SERVER_PORT) || 3000,
  environment: process.env.NODE_ENV || 'development',
};

export default config;

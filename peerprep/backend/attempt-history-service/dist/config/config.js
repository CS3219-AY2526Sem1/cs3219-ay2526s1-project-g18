import dotenv from 'dotenv';
dotenv.config();
const config = {
    serverPort: Number(process.env.SERVER_PORT) || 3000,
    environment: process.env.NODE_ENV || 'development',
};
export default config;
//# sourceMappingURL=config.js.map
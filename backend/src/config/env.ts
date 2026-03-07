import 'dotenv/config';

export const env = {
    PORT: parseInt(process.env.PORT || '3001', 10),
    HOST: process.env.HOST || '0.0.0.0',
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || 'changeme',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    SESSION_DIR: process.env.SESSION_DIR || './sessions',
    WORKER_INTERVAL_MS: parseInt(process.env.WORKER_INTERVAL_MS || '5000', 10),
    MESSAGE_DELAY_MS: parseInt(process.env.MESSAGE_DELAY_MS || '3000', 10),
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY || '',
    MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY || '',
    MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION === 'true',
};

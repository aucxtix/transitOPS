import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'transitops-super-secret-key-change-in-prod',
  JWT_EXPIRES_IN: '24h',
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN
};

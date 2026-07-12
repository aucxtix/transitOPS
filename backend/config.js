import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define a strict schema for environment variables
const envSchema = z.object({
  PORT: z.string().default('8000'),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default('24h'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate environment variables
const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  console.error("❌ Invalid environment variables:", envVars.error.format());
  process.exit(1); // Security: Crash on startup if critical config is missing
}

export const config = envVars.data;

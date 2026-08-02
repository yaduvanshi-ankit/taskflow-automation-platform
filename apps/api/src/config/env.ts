import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

// npm workspaces starts this API with apps/api as its working directory.
// Load the repository-level development settings explicitly instead of relying
// on dotenv's default current-directory lookup.
dotenv.config({ path: resolve(process.cwd(), '../../.env') });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default('mongodb://taskflow:taskflow@localhost:27017/taskflow?authSource=admin'),
  REDIS_URL: z.string().default('redis://:taskflow@localhost:6379'),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().min(32).default('development-access-secret-change-this-value'),
  JWT_REFRESH_SECRET: z.string().min(32).default('development-refresh-secret-change-this-value'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d')
});
export const env = schema.parse(process.env);

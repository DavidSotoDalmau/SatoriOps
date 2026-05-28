import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  AUTH_TRUST_HOST: z.enum(["true", "false"]).default("true"),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  BOOTSTRAP_OWNER_EMAIL: z.string().email().optional(),
  BOOTSTRAP_OWNER_NAME: z.string().min(1).optional(),
});

const parsedEnv = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  APP_URL: process.env.APP_URL,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
  AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
  AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
  BOOTSTRAP_OWNER_EMAIL: process.env.BOOTSTRAP_OWNER_EMAIL,
  BOOTSTRAP_OWNER_NAME: process.env.BOOTSTRAP_OWNER_NAME,
});

if (!parsedEnv.success) {
  throw new Error("Invalid environment configuration");
}

export const env = parsedEnv.data;

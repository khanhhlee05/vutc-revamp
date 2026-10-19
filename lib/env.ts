import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().min(1).default("VUTC Events <events@vutc.com>"),
  EVENTS_INBOX: z.string().email().default("events@vutc.com"),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional().default(""),
  TURNSTILE_SECRET_KEY: z.string().optional().default(""),
  CRON_SECRET: z.string().min(8),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

/**
 * Validated server environment. Importing this on the client is a mistake;
 * only NEXT_PUBLIC_* values are safe there and should be read directly.
 */
export const env = schema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";

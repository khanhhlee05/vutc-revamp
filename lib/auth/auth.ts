import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env, isProduction } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";

/**
 * Server-side auth instance. Email + password only, no self signup:
 * accounts are created by personnel management and activated through the
 * password reset flow (invite link).
 */
export const auth = betterAuth({
  appName: "VUTC",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      rateLimit: schema.rateLimit,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60 * 24, // invite and reset links last a day
    sendResetPassword: async ({ user, url }) => {
      const isInvite = url.includes("invite%3D1") || url.includes("invite=1");
      await sendEmail({
        to: user.email,
        subject: isInvite
          ? "Your VUTC staff account"
          : "Reset your VUTC password",
        text: [
          `Hi ${user.name},`,
          "",
          isInvite
            ? "A VUTC staff account was created for you. Use the link below to set your password. It expires in 24 hours."
            : "Use the link below to reset your password for the VUTC staff site. It expires in 24 hours.",
          url,
          "",
          "If you did not expect this email, you can ignore it.",
        ].join("\n"),
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day of activity
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60 * 15, max: 3 },
      "/reset-password": { window: 60 * 15, max: 5 },
    },
  },
  advanced: {
    useSecureCookies: isProduction,
    cookiePrefix: "vutc",
  },
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

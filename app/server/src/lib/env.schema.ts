import { z } from "zod"

/**
 * Pure schema — no side effects, so tests can exercise the validation rules
 * without needing a populated process.env. The actual parse (and the
 * intentional fail-fast on boot) lives in ./env.ts.
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    // FR-08: verifies Google ID tokens are meant for THIS app (the `aud` claim) —
    // without it any Google client's token would be accepted as ours.
    GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required for Google sign-in"),
    // FR-08: the `hd` claim / email suffix that auto-approves a Google sign-in.
    // Course scope aside, this is the institution boundary — everyone outside
    // it lands PENDING for an ADMIN to approve by hand.
    INSTITUTION_EMAIL_DOMAIN: z.string().min(1).default("kmitl.ac.th"),
    // FR-05a: comma-separated emails that become ADMIN on Google sign-in. The
    // only way to get the first ADMIN without editing the database by hand —
    // kept in the environment so no personal email lives in the repo.
    ADMIN_EMAILS: z
      .string()
      .default("")
      .transform((value) =>
        value
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email.length > 0),
      ),
    RATE_LIMIT_MAX: z.coerce.number().default(100),
    RATE_LIMIT_WINDOW: z.string().default("1 minute"),
  })
  // Threat model "Data Flow Sniffing": in production every hop carrying
  // student data is encrypted — the database connection and the browser's.
  // Development keeps plain localhost.
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return
    if (!/[?&]sslmode=(require|verify-ca|verify-full)(?:&|$)/.test(env.DATABASE_URL)) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message: "production DATABASE_URL must set sslmode=require (or verify-ca / verify-full)",
      })
    }
    if (!env.CORS_ORIGIN.startsWith("https://")) {
      ctx.addIssue({
        code: "custom",
        path: ["CORS_ORIGIN"],
        message: "production CORS_ORIGIN must be https",
      })
    }
  })

export type Env = z.infer<typeof envSchema>

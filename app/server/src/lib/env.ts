import { envSchema, type Env } from "./env.schema.js"

/**
 * Parsed at import time on purpose: the server must refuse to boot when
 * DATABASE_URL or JWT_SECRET are missing/too short rather than failing later
 * on the first request. See docs/markdown/dev/architecture/dev.md §2.3.
 */
export const env: Env = envSchema.parse(process.env)

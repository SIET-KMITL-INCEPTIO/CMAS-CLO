/**
 * env.ts parses process.env at import and refuses to load without these. CI's
 * verify job has no .env, so tests supply throwaway values — but never
 * overwrite real ones: the isolation job's DATABASE_URL must survive.
 */
process.env.JWT_SECRET ??= "test-secret-at-least-thirty-two-characters!!"
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres"
process.env.GOOGLE_CLIENT_ID ??= "test-client-id.apps.googleusercontent.com"
// The default limit (100 a minute) is for people. The isolation test fires one
// request per route, and a fast database makes the whole suite one burst.
process.env.RATE_LIMIT_MAX ??= "100000"

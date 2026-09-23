/**
 * Google ID token verification (FR-08).
 *
 * The client only ever hands us the ID token string; every claim in it is
 * verified HERE, server-side. Never trust a client-decoded payload — `aud`
 * must be this app's own client id (otherwise any Google client's token
 * would be accepted as ours) and `iss` must be Google's issuer (otherwise a
 * self-signed JWT with a matching shape would pass).
 *
 * No `google-auth-library` dependency: `jose` is already in use for our own
 * JWTs, and Google's ID tokens are just RS256 JWTs signed with keys published
 * at a JWKS endpoint — `createRemoteJWKSet` handles fetching and rotating
 * those keys for us.
 */
import { createRemoteJWKSet, jwtVerify } from "jose"
import { env } from "./env.js"

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
const GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"]

// Module-level: fetches and caches Google's signing keys, and follows their
// rotation. Do not construct one per request.
const googleJwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL))

export type GoogleIdTokenPayload = {
  sub: string
  email: string
  emailVerified: boolean
  name?: string
  /** Google Workspace domain, present only for a managed account. */
  hd?: string
}

/**
 * Verifies signature, `iss`, `aud`, and expiry. Throws on any failure —
 * callers must not distinguish the reason in their response (an expired vs.
 * forged vs. wrong-audience token all mean the same thing to the caller: no).
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdTokenPayload> {
  const { payload } = await jwtVerify(idToken, googleJwks, {
    issuer: GOOGLE_ISSUERS,
    audience: env.GOOGLE_CLIENT_ID,
  })

  if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
    throw new Error("Google ID token missing required claims")
  }

  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : undefined,
    hd: typeof payload.hd === "string" ? payload.hd : undefined,
  }
}

/**
 * FR-08: `hd` is only set for a Google Workspace account, and is the
 * authoritative signal when present. A personal @gmail.com token never has
 * it, so we also accept a matching email suffix — the two checks agree for
 * every well-formed institution account and only the email check fires for
 * an institution that hasn't set up Workspace `hd` at all.
 */
export function isInstitutionDomain(payload: GoogleIdTokenPayload): boolean {
  const domain = env.INSTITUTION_EMAIL_DOMAIN.toLowerCase()
  if (payload.hd && payload.hd.toLowerCase() === domain) return true
  return payload.email.toLowerCase().endsWith(`@${domain}`)
}

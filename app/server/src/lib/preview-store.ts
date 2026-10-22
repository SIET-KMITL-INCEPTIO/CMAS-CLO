/**
 * Validated import previews between "preview" and "commit" (FR-67): the
 * commit takes only a token, so the rows the instructor looked at are exactly
 * the rows written, and nothing a second upload could swap in.
 *
 * In memory, 15 minutes, bound to one course and one user. A restart drops
 * every preview — the instructor uploads again, nothing is half-written. This
 * holds while the API runs as one process; a second instance would need a
 * shared store (the table or Redis) before it could take import traffic.
 */
import { randomBytes } from "node:crypto"

const TTL_MS = 15 * 60_000
const MAX_ENTRIES = 500

type Entry<T> = { courseId: string; userId: string; kind: string; expiresAt: number; data: T }
const store = new Map<string, Entry<unknown>>()

function sweep(now: number) {
  for (const [k, v] of store) if (v.expiresAt <= now) store.delete(k)
  // Oldest first: Map keeps insertion order.
  while (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value!)
}

export function savePreview<T>(kind: string, courseId: string, userId: string, data: T): string {
  const now = Date.now()
  sweep(now)
  const token = randomBytes(24).toString("base64url")
  store.set(token, { kind, courseId, userId, expiresAt: now + TTL_MS, data })
  return token
}

/** One use: a token is consumed by the commit that reads it. Null for every kind of mismatch alike. */
export function takePreview<T>(
  kind: string,
  token: string,
  courseId: string,
  userId: string,
): T | null {
  const entry = store.get(token)
  if (!entry) return null
  store.delete(token)
  if (entry.expiresAt <= Date.now()) return null
  if (entry.kind !== kind || entry.courseId !== courseId || entry.userId !== userId) return null
  return entry.data as T
}

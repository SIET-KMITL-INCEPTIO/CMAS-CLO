/**
 * The add-in release the server tells Excel about. The add-in only compares
 * versions and tells the instructor a new one exists; it never downloads or
 * runs code from the server (no auto-update).
 *
 * The add-in is not code-signed (no certificate yet), so the SHA-256 is how an
 * instructor checks that the file they installed is the one CMAS published.
 * Update both fields together when a new CMAS.xlam is released; sha256 stays
 * null until the first real build exists (P0 is a spike).
 */
export const ADDIN_RELEASE = {
  version: "0.1.0",
  sha256: null as string | null,
  /** Desktop only: Excel on the web cannot run VBA. */
  platforms: ["windows", "mac"] as const,
}

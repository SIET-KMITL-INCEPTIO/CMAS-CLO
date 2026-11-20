/**
 * The add-in release the server tells Excel about. The add-in only compares
 * versions and tells the instructor a new one exists; it never downloads or
 * runs code from the server (no auto-update).
 *
 * The add-in is not code-signed (no certificate yet), so the SHA-256 is how an
 * instructor checks that the file they installed is the one CMAS published.
 * Update both fields together when a new CMAS.xlam is released, from the
 * output of `python scripts/build-excel-addin.py package`. sha256 stays null
 * until a build has been made in Excel and checked (app/excel-addin/README.md).
 * `version` must equal CMAS_ADDIN_VERSION in src/modCmasInfo.bas (tested).
 */
export const ADDIN_RELEASE = {
  version: "0.2.0",
  sha256: null as string | null,
  /** Desktop only: Excel on the web cannot run VBA. */
  platforms: ["windows", "mac"] as const,
}

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
  sha256: "5936bd36baf629c46aa5dde81060829302e217aae3ec3664ba70b32b86d51291" as string | null,
  /** Desktop only: Excel on the web cannot run VBA. */
  platforms: ["windows", "mac"] as const,
}

/** Where the released file lives in the repo (committed; `dist/` is git-ignored). */
export const ADDIN_FILE = new URL("../../../../excel-addin/release/CMAS.xlam", import.meta.url)
export const ADDIN_FILE_NAME = "CMAS.xlam"
export const ADDIN_MIME = "application/vnd.ms-excel.addin.macroEnabled.12"

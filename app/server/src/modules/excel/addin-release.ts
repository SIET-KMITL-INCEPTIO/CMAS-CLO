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
  sha256: "414418a6cf7ec758164dbe6d58c25abfa52dfe5c3c8e3522804bf6f1fd766aff" as string | null,
  /** Desktop only: Excel on the web cannot run VBA. */
  platforms: ["windows", "mac"] as const,
}

/** Where the released file lives in the repo (committed; `dist/` is git-ignored). */
export const ADDIN_FILE = new URL("../../../../excel-addin/release/CMAS.xlam", import.meta.url)
export const ADDIN_FILE_NAME = "CMAS.xlam"
export const ADDIN_MIME = "application/vnd.ms-excel.addin.macroEnabled.12"

/**
 * The score workbook: the same VBA as the add-in, saved in Excel as an .xlsm
 * (app/excel-addin/README.md, "Build the score workbook"). The server stamps a
 * copy per download with the course, the CMAS address and a one-time ticket,
 * so the file connects itself when opened. The bytes served differ per
 * download; the SHA-256 here is of the template, checked before every stamp.
 * `version` must equal CMAS_ADDIN_VERSION in src/modCmasInfo.bas (tested): it
 * is the newest VBA, which the add-in above may lag behind.
 */
export const WORKBOOK_RELEASE = {
  version: "0.3.0",
  sha256: "7aa9827c9e1e8592dddefb8360143f2a7329d505cafd62591af35c2d080dd24e" as string | null,
}
export const WORKBOOK_TEMPLATE = new URL(
  "../../../../excel-addin/release/CMAS-template.xlsm",
  import.meta.url,
)
export const WORKBOOK_MIME = "application/vnd.ms-excel.sheet.macroEnabled.12"

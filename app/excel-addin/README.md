# CMAS add-in for Excel (VBA)

Two-way score sync between Excel desktop (Windows and Mac) and CMAS. Plan and
the reasons behind each choice:
[excel-vba-sync-plan.md](../../docs/markdown/dev/planning/excel-vba-sync-plan.md).

**Status: P0 spike.** The code here proves the risky parts work. It is not the
add-in instructors will use. P4 (Windows) and P5 (Mac) build that.

## Rules the add-in keeps

- **Code and data stay apart.** The VBA lives in `CMAS.xlam`. Score files are
  plain `.xlsx`; CMAS refuses an upload that contains macros.
- **No secret in a file.** The token is kept in memory only, never in a cell,
  name, document property, file or the registry. It reaches one course's
  scores, lasts 8 hours and can be cut from `/excel/link`.
- **https only**, certificate checks never switched off, 5 s timeouts.
- **Text from the server is written as text** (`WriteText`), so a name that
  starts with `=` never becomes a formula.
- **No auto-update.** The add-in compares its version with `GET /excel/addin`
  and tells the instructor; it never downloads or runs code.
- **ASCII-only VBA source.** VBA stores modules in the machine's code page, so
  Thai text in a `.bas` file breaks on another locale or on Mac. P4 builds
  Thai strings with `ChrW` or reads them from a hidden sheet.

## Folder

| Path                         | What                                                          |
| ---------------------------- | ------------------------------------------------------------- |
| `src/modCmasHttp.bas`        | one HTTP call: WinHttp on Windows, AppleScriptTask on Mac     |
| `src/modCmasAuth.bas`        | device-code sign-in, token in memory                          |
| `src/clsCmasAppEvents.cls`   | Application-level `SheetChange` (hears edits in any workbook) |
| `src/modCmasSpike.bas`       | the spike checks below                                        |
| `mac/CMAS.applescript`       | Mac only: runs `curl` with the token in a 600 config file     |
| `install/install.ps1`, `.sh` | check SHA-256, remove the download mark, copy into place      |

## Build the spike add-in (by hand, needs Excel)

1. New blank workbook → `Alt+F11` (Mac: Tools → Macro → Visual Basic Editor).
2. File → Import File… each file in `src/`.
3. Save As → **Excel Add-in (.xlam)** → `CMAS.xlam`.
4. Get its hash: `Get-FileHash CMAS.xlam` (Windows) or `shasum -a 256 CMAS.xlam` (Mac).
5. Install with `install/install.ps1` or `install/install.sh`, passing that hash.

The server needs migration `0011_excel_addin_sign_in` applied, and an
instructor account that teaches at least one course.

## Spike checklist (P0)

Record ✅ / ❌ and the Excel version for each platform. P2 is already built; if
a check fails on Mac, decide before P4 whether Mac waits or changes approach.

| #   | Check                                                                               | How                                                         | Windows | Mac |
| --- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------- | --- |
| S1  | Unsigned `.xlam`, installed by the script, loads with no macro warning              | restart Excel after install                                 |         |     |
| S2  | The same file **without** the install script is blocked (proves S1 means something) | open a freshly downloaded copy                              |         |     |
| S3  | Sign-in by device code works end to end                                             | `CmasConnect` → type code at `/excel/link` → status bar     |         |     |
| S4  | Edits in any workbook are heard                                                     | `SpikeStartListening`, edit a cell                          |         |     |
| S5  | `OnTime` fires every 10 s                                                           | `SpikeTimer`, watch 3 ticks                                 |         |     |
| S6  | Token reads its course (200), not another course or `/auth/me` (404)                | `SpikeCheckScope`                                           |         |     |
| S7  | Formula-looking text stays text                                                     | `SpikeFormulaText` → `HasFormula = False`                   |         |     |
| S8  | Mac: the token is not visible to `ps` during a request                              | `ps -axww \| grep cmasx_` in a loop while S6 runs           | n/a     |     |
| S9  | Closing Excel leaves no token anywhere                                              | search the workbook, `%APPDATA%` / `~/Library` for `cmasx_` |         |     |

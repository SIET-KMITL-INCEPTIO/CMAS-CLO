# CMAS add-in for Excel (VBA)

Two-way score sync between Excel desktop (Windows and Mac) and CMAS. Plan and
the reasons behind each choice:
[excel-vba-sync-plan.md](../../docs/markdown/dev/planning/excel-vba-sync-plan.md).

**Status: written, not yet run in Excel.** Nothing outside Excel can compile
VBA. `python scripts/build-excel-addin.py check` (a CI step) catches what it
can; the checklist at the end is what only Excel can prove.

## What the instructor sees

1. **CMAS → เชื่อมต่อ.** The add-in asks for the CMAS address once, then shows
   an 8-character code. The instructor opens `/excel/link` in the CMAS web app,
   types the code and picks one course.
2. A new workbook opens with the course sheet: student codes, names, one
   column per activity. Grey cells cannot be edited (closed activity,
   withdrawn student).
3. **Typing a score** sends it about 2 seconds later. **x** means excused.
   **Clearing a cell** deletes the score, after a yes/no question.
4. **Changes made on the web** appear within about 10 seconds.
5. **Somebody else changed the cell first:** it turns red, with CMAS's value
   in a note. **ใช้ค่าของฉัน** sends yours over it; **ใช้ค่าใน CMAS** drops
   yours.
6. **Offline or disconnected:** edits stay in the sheet. The next connect
   finds them and sends them, and still catches conflicts.

The workbook is a plain `.xlsx` — save it anywhere. It has no macros and no
token. A very hidden `_cmas` sheet holds the ids and the last values CMAS
confirmed. Writes from Excel appear in the score history as **แก้ใน Excel**.

## Rules the add-in keeps

- **Code and data stay apart.** The VBA lives in `CMAS.xlam`. Score files are
  plain `.xlsx`; CMAS refuses an upload that contains macros.
- **No secret in a file.** The token is kept in memory only, never in a cell,
  name, document property, file or the registry. It reaches one course
  (`course.view` + `score.edit`), lasts 8 hours and can be cut from
  `/excel/link`. The CMAS address is remembered; it is not a secret.
- **https only**, certificate checks never switched off, 5 s timeouts.
- **Text from the server is written as text**, so a name that starts with `=`
  never becomes a formula.
- **No auto-update.** The add-in compares its version with `GET /excel/addin`
  and tells the instructor; it never downloads or runs code.
- **ASCII-only VBA source.** Thai strings live in `text/th.json`; the build
  script turns them into `src/modCmasText.bas` as hex code points.
- **No `Scripting.Dictionary`** (Excel for Mac lacks it): `clsCmasMap` and
  `modCmasJson` replace it and VBA-JSON.

## Folder

| Path                         | What                                                              |
| ---------------------------- | ----------------------------------------------------------------- |
| `src/modCmasHttp.bas`        | one HTTP call: WinHttp on Windows, AppleScriptTask + curl on Mac  |
| `src/modCmasAuth.bas`        | device-code sign-in, token in memory, version notice              |
| `src/modCmasSync.bas`        | the sheet, pull every 10 s, push 2 s after an edit, red cells     |
| `src/modCmasJson.bas`        | JSON reader/writer for both platforms                             |
| `src/clsCmasMap.cls`         | string-keyed map for both platforms                               |
| `src/clsCmasAppEvents.cls`   | Application-level `SheetChange`                                   |
| `src/modCmasRibbon.bas`      | callbacks for the CMAS tab                                        |
| `src/modCmasUi.bas`          | message and input boxes that show Thai on any Windows locale      |
| `src/modCmasText.bas`        | **generated** from `text/th.json` — do not edit                   |
| `src/modCmasInfo.bas`        | the version; must equal `addin-release.ts` (a server test checks) |
| `ribbon/customUI14.xml`      | the CMAS tab                                                      |
| `mac/CMAS.applescript`       | Mac only: runs `curl` with the token in a 600 config file         |
| `install/install.ps1`, `.sh` | check SHA-256, remove the download mark, copy into place          |
| `spike/modCmasSpike.bas`     | P0 checks; **not** part of the add-in                             |

## Build (needs Excel, Windows or Mac)

1. `python scripts/build-excel-addin.py check` — must pass.
2. New blank workbook → `Alt+F11` (Mac: Tools → Macro → Visual Basic Editor).
3. File → Import File… **every file in `src/`** (not `spike/`).
4. Debug → Compile VBAProject — must finish with no error.
5. Save As → **Excel Add-in (.xlam)** → `CMAS-raw.xlam`.
6. `python scripts/build-excel-addin.py package CMAS-raw.xlam` → writes
   `app/excel-addin/release/CMAS.xlam` with the ribbon and prints its SHA-256.
7. Put that SHA-256 and the version into
   `app/server/src/modules/excel/addin-release.ts`, and commit
   `release/CMAS.xlam` with it. The web page `/excel/link` then offers the
   download (`GET /excel/addin/file`, sign-in required) and refuses to serve a
   file whose hash is not the published one.
8. Install with `install/install.ps1` or `install/install.sh`, passing that hash.

**Re-importing after a change:** remove the old module first (right-click →
Remove → **No** to export), then import. Importing over a module that is still
there makes a second copy named `clsCmasMap1` and the like, which breaks the
build.

To change Thai text: edit `text/th.json`, run
`python scripts/build-excel-addin.py text`, re-import `modCmasText.bas`.

## Checklist in real Excel

Run on **both** Windows and Mac, record ✅ / ❌ and the Excel version. The
server side of every row is covered by `excel.db.test.ts`; these prove the
Excel side.

| #   | Check                                                                                 | Windows | Mac |
| --- | ------------------------------------------------------------------------------------- | ------- | --- |
| S1  | Unsigned `.xlam` installed by the script loads with no macro warning; CMAS tab shows  |         |     |
| S2  | A freshly downloaded copy **without** the script is blocked (S1 means something)      |         |     |
| S3  | Connect: code shown, approved at `/excel/link`, course sheet opens                    |         |     |
| S4  | Type a score → web page shows it within ~3 s; history says แก้ใน Excel                |         |     |
| S5  | Change a score on the web → Excel shows it within ~12 s                               |         |     |
| S6  | Type `x` → web shows ยกเว้น; type `25` in a max-20 column → refused, value restored   |         |     |
| S7  | Clear a cell → asked first; No restores the value                                     |         |     |
| S8  | Change the same cell on web and Excel → red cell with CMAS's value; both buttons work |         |     |
| S9  | Paste a block of 20 scores → all sent in one request                                  |         |     |
| S10 | Grey cells (closed activity, withdrawn student) cannot be edited                      |         |     |
| S11 | Add a student on the web → Excel redraws with the new row                             |         |     |
| S12 | Disconnect, edit, save, close; reopen, connect → edits sent                           |         |     |
| S13 | Cut the link at `/excel/link` → Excel says disconnected within ~10 s; edits kept      |         |     |
| S14 | A student named `=HYPERLINK("x")` shows as text                                       |         |     |
| S15 | Mac: the token never appears in `ps -axww` while syncing                              | n/a     |     |
| S16 | After closing Excel, no `cmasx_` in the workbook, `%APPDATA%` or `~/Library`          |         |     |

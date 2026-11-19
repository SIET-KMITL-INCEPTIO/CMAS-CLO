#!/bin/sh
# Installs CMAS.xlam and its AppleScript helper for the current Mac user (P0 spike).
#
#   sh install.sh ./CMAS.xlam <sha256 from the CMAS web page>
#
# 1. Refuses the file unless its SHA-256 matches the one CMAS publishes
#    (GET /api/v1/excel/addin). The add-in is not code-signed.
# 2. Removes the quarantine mark macOS puts on downloads.
# 3. Copies the add-in to Office's add-in folder and compiles CMAS.scpt into
#    the one folder Excel's sandbox may run scripts from.
# Then in Excel: Tools > Excel Add-ins > Browse > CMAS.xlam.
#
# It changes no Excel or macOS setting and needs no administrator rights.
set -eu

XLAM=${1:?usage: install.sh CMAS.xlam SHA256}
EXPECTED=$(printf '%s' "${2:?usage: install.sh CMAS.xlam SHA256}" | tr 'A-F' 'a-f')
HERE=$(cd "$(dirname "$0")" && pwd)

ACTUAL=$(shasum -a 256 "$XLAM" | cut -d ' ' -f 1)
if [ "$ACTUAL" != "$EXPECTED" ]; then
  echo "SHA-256 does not match. Expected $EXPECTED, got $ACTUAL. Do not install this file." >&2
  exit 1
fi

xattr -d com.apple.quarantine "$XLAM" 2>/dev/null || true

# P0 must confirm this is the folder Excel's Browse dialog opens on this Office version.
ADDINS="$HOME/Library/Group Containers/UBF8T346G9.Office/User Content.localized/Add-Ins.localized"
mkdir -p "$ADDINS"
cp "$XLAM" "$ADDINS/CMAS.xlam"

SCRIPTS="$HOME/Library/Application Scripts/com.microsoft.Excel"
mkdir -p "$SCRIPTS"
osacompile -o "$SCRIPTS/CMAS.scpt" "$HERE/../mac/CMAS.applescript"

echo "Installed. Enable it in Excel: Tools > Excel Add-ins > Browse > CMAS.xlam"

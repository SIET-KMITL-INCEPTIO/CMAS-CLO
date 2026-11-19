# Installs CMAS.xlam for the current Windows user (P0 spike).
#
#   powershell -ExecutionPolicy Bypass -File install.ps1 -Xlam .\CMAS.xlam -Sha256 <hash from the CMAS web page>
#
# 1. Refuses the file unless its SHA-256 matches the one CMAS publishes
#    (GET /api/v1/excel/addin). The add-in is not code-signed, so this is
#    how you know the file is the one CMAS released.
# 2. Removes the "downloaded from the internet" mark (Mark of the Web), which
#    makes Excel block every macro in the file.
# 3. Copies it to the user's AddIns folder. Then in Excel:
#    File > Options > Add-ins > Manage: Excel Add-ins > Go > tick CMAS.
#
# It changes no Excel or Windows setting and needs no administrator rights.
param(
    [Parameter(Mandatory = $true)][string]$Xlam,
    [Parameter(Mandatory = $true)][string]$Sha256
)
$ErrorActionPreference = "Stop"

$file = Resolve-Path -LiteralPath $Xlam
$actual = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash
if ($actual -ne $Sha256.Trim().ToUpperInvariant()) {
    Write-Error "SHA-256 does not match. Expected $Sha256, got $actual. Do not install this file."
    exit 1
}

Unblock-File -LiteralPath $file

$target = Join-Path $env:APPDATA "Microsoft\AddIns"
New-Item -ItemType Directory -Force -Path $target | Out-Null
Copy-Item -LiteralPath $file -Destination (Join-Path $target "CMAS.xlam") -Force
Write-Output "Installed to $target\CMAS.xlam. Enable it in Excel: File > Options > Add-ins > Go > tick CMAS."

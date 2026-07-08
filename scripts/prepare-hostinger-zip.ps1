# Creates plotsnhomes-deploy.zip for Hostinger "Upload files" deploy (no node_modules)
# Usage: .\scripts\prepare-hostinger-zip.ps1

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "plotsnhomes-deploy.zip"

if (Test-Path $out) { Remove-Item $out -Force }

$temp = Join-Path $env:TEMP "plotsnhomes-deploy"
if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
New-Item -ItemType Directory -Path $temp | Out-Null

$exclude = @("node_modules", ".next", ".git", "prisma\dev.db", "prisma\dev.db-journal", "plotsnhomes-deploy.zip")

Get-ChildItem $root -Force | Where-Object {
  $_.Name -notin $exclude -and $_.Name -ne "node_modules" -and $_.Name -ne ".next"
} | ForEach-Object {
  Copy-Item $_.FullName -Destination $temp -Recurse -Force -ErrorAction SilentlyContinue
}

# Remove nested junk if copied
@(
  (Join-Path $temp "node_modules"),
  (Join-Path $temp ".next"),
  (Join-Path $temp ".env")
) | Where-Object { Test-Path $_ } | ForEach-Object { Remove-Item $_ -Recurse -Force }

Compress-Archive -Path "$temp\*" -DestinationPath $out -Force
Remove-Item $temp -Recurse -Force

Write-Host "Created: $out" -ForegroundColor Green
Write-Host "Upload this zip in Hostinger hPanel -> Node.js Apps -> Upload files" -ForegroundColor Cyan

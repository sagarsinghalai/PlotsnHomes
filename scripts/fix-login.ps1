# Fix login: stop server, regenerate Prisma, ensure admin exists
$plotsnhomes = Split-Path $PSScriptRoot -Parent
Set-Location $plotsnhomes

Write-Host "Stopping port 3001..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2

Write-Host "Prisma generate..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) {
  Write-Host "If EPERM: close all terminals running npm run dev, then run this script again." -ForegroundColor Red
  exit 1
}

Write-Host "Ensuring admin user..." -ForegroundColor Cyan
npx tsx scripts/ensure-admin.ts

Write-Host "Done. Start app: npm run dev" -ForegroundColor Green
Write-Host "Login: admin@plotsnhomes.com / demo1234" -ForegroundColor Gray

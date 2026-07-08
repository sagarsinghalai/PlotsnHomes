# Stop dev server locks, regenerate Prisma, start on port 3001
$plotsnhomes = Split-Path $PSScriptRoot -Parent
Set-Location $plotsnhomes

Write-Host "Stopping Node processes on port 3001 (if any)..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 2

Write-Host "Prisma generate + db push..." -ForegroundColor Cyan
npx prisma db push
npx prisma generate

Write-Host "Starting dev server..." -ForegroundColor Green
npm run dev

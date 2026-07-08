# Stop duplicate Next.js servers, then start PlotsnHomes on port 3001
foreach ($port in 3000, 3001) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 2
Set-Location $PSScriptRoot\..
Write-Host "Starting PlotsnHomes at http://localhost:3001" -ForegroundColor Green
npm run dev

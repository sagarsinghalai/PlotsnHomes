# Paste Stripe TEST keys into .env (run from plotsnhomes folder)
$envPath = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envPath)) {
  Write-Host "ERROR: .env not found at $envPath" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "=== PlotsnHomes Stripe setup ===" -ForegroundColor Cyan
Write-Host "Open: https://dashboard.stripe.com/test/apikeys" -ForegroundColor Yellow
Write-Host ""

$sk = Read-Host "Paste STRIPE_SECRET_KEY (sk_test_...)"
$pk = Read-Host "Paste NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_...)"

if (-not $sk.StartsWith("sk_test_") -and -not $sk.StartsWith("sk_live_")) {
  Write-Host "Warning: secret key should start with sk_test_ or sk_live_" -ForegroundColor Yellow
}
if (-not $pk.StartsWith("pk_test_") -and -not $pk.StartsWith("pk_live_")) {
  Write-Host "Warning: publishable key should start with pk_test_ or pk_live_" -ForegroundColor Yellow
}

$content = Get-Content $envPath -Raw

function Set-EnvLine($name, $value) {
  $pattern = "(?m)^#?\s*$name=.*$"
  $line = "$name=`"$value`""
  if ($content -match $pattern) {
    $script:content = $content -replace $pattern, $line
  } else {
    $script:content = $content.TrimEnd() + "`n$line`n"
  }
}

Set-EnvLine "STRIPE_SECRET_KEY" $sk.Trim()
Set-EnvLine "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" $pk.Trim()

Set-Content -Path $envPath -Value $content.TrimEnd() -NoNewline
Add-Content -Path $envPath -Value "`n"

Write-Host ""
Write-Host "Done! Keys saved to .env" -ForegroundColor Green
Write-Host "Restart dev server: npm run dev" -ForegroundColor Cyan
Write-Host "Test card: 4242 4242 4242 4242" -ForegroundColor Gray
Write-Host "Bank (ACH): choose 'Bank transfer' on property page — Stripe collects account securely" -ForegroundColor Gray

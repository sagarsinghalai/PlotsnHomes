# Quick test inquiry + demo payment APIs
$base = "http://localhost:3001"
$prop = Invoke-RestMethod "$base/api/properties?perPage=1"
$id = $prop.properties[0].id
Write-Host "Property:" $prop.properties[0].symbol

$inquiry = @{
  propertyId = $id
  name = "Test User"
  email = "test@example.com"
  message = "This is a test inquiry message for PlotsnHomes."
} | ConvertTo-Json

$r1 = Invoke-WebRequest -Uri "$base/api/inquiries" -Method POST -Body $inquiry -ContentType "application/json" -UseBasicParsing
Write-Host "Inquiry:" $r1.StatusCode $r1.Content

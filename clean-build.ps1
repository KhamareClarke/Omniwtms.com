Write-Host "Cleaning build cache..." -ForegroundColor Yellow

# Remove Next.js cache
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "✓ Removed .next directory" -ForegroundColor Green
}

# Remove node_modules cache if it exists
if (Test-Path node_modules\.cache) {
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "✓ Removed node_modules cache" -ForegroundColor Green
}

Write-Host "`nBuilding project..." -ForegroundColor Yellow
npm run build

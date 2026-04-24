# Installation script for the test suite (PowerShell)

Write-Host "Installing test suite dependencies..." -ForegroundColor Cyan

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "Node.js version: $(node --version)" -ForegroundColor Green

# Install dependencies
Write-Host "`nInstalling npm packages..." -ForegroundColor Yellow
npm install

Write-Host "`nInstallation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To run the tests:" -ForegroundColor Cyan
Write-Host "  npm run test          - Run all tests" -ForegroundColor White
Write-Host "  npm run test:health   - Run health checks" -ForegroundColor White
Write-Host "  npm run test:business - Run business scenarios" -ForegroundColor White
Write-Host ""

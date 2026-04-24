# Hotel Microservices Integration Test Runner
# PowerShell script to run the complete test suite

param(
    [switch]$HealthOnly,
    [switch]$Business,
    [switch]$Verbose,
    [switch]$Build
)

$ErrorActionPreference = "Stop"

# Configuration
$projectRoot = "$(Get-Location)/.."
$infraDir = "$(Get-Location)"
$testsDir = "$(Get-Location)/tests"
$dockerComposeFile = "$infraDir/docker-compose.yml"

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Test-DockerRunning {
    try {
        $result = docker ps --format "{{.Names}}" 2>&1
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Test-ServicesHealthy {
    Write-Host "Checking service health..." -ForegroundColor Yellow
    
    $services = @{
        "User Service" = "http://localhost:8081"
        "Hotel Service" = "http://localhost:8084"
        "Media Service" = "http://localhost:8082"
        "Room Service" = "http://localhost:8085"
    }
    
    $healthy = $true
    
    foreach ($service in $services.GetEnumerator()) {
        try {
            $response = Invoke-WebRequest -Uri "$($service.Value)/health" -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "  ✓ $($service.Key)" -ForegroundColor Green
            } else {
                Write-Host "  ✗ $($service.Key) - Status: $($response.StatusCode)" -ForegroundColor Red
                $healthy = $false
            }
        } catch {
            Write-Host "  ✗ $($service.Key) - Not reachable" -ForegroundColor Red
            $healthy = $false
        }
    }
    
    return $healthy
}

function Start-Services {
    Write-Header "Starting Docker Services"
    
    if (!(Test-Path $dockerComposeFile)) {
        Write-Host "docker-compose.yml not found at $dockerComposeFile" -ForegroundColor Red
        exit 1
    }
    
    docker-compose -f $dockerComposeFile up -d --build
    
    Write-Host "Waiting for services to start..." -ForegroundColor Yellow
    $maxAttempts = 30
    $attempt = 0
    $healthy = $false
    
    while ($attempt -lt $maxAttempts -and !$healthy) {
        Start-Sleep -Seconds 5
        $attempt++
        Write-Host "  Attempt $attempt/$maxAttempts" -ForegroundColor Yellow
        $healthy = Test-ServicesHealthy
    }
    
    if (!$healthy) {
        Write-Host "Services failed to become healthy" -ForegroundColor Red
        docker-compose -f $dockerComposeFile logs
        exit 1
    }
    
    Write-Host "All services are healthy!" -ForegroundColor Green
}

function Stop-Services {
    Write-Header "Stopping Docker Services"
    docker-compose -f $dockerComposeFile down
}

function Run-Tests {
    Write-Header "Running Integration Tests"
    
    Set-Location $testsDir
    
    if (!(Test-Path "node_modules")) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    if ($HealthOnly) {
        Write-Host "Running health checks only..." -ForegroundColor Yellow
        npx tsx health-check.ts
    } elseif ($Business) {
        Write-Host "Running business scenarios..." -ForegroundColor Yellow
        npx tsx business-scenarios.ts
    } else {
        Write-Host "Running full test suite..." -ForegroundColor Yellow
        npx tsx e2e-test-suite.ts
    }
    
    $exitCode = $LASTEXITCODE
    
    Set-Location $infraDir
    
    return $exitCode
}

# Main execution
try {
    Write-Header "Hotel Microservices Integration Test Runner"
    
    # Check if Docker is running
    if (!(Test-DockerRunning)) {
        Write-Host "Docker is not running. Starting services..." -ForegroundColor Yellow
        Start-Services
    }
    
    # Check if services are healthy
    $servicesHealthy = Test-ServicesHealthy
    if (!$servicesHealthy) {
        Write-Host "Services are not healthy. Starting/restarting..." -ForegroundColor Yellow
        Start-Services
    }
    
    # Run tests
    $exitCode = Run-Tests
    
    if ($exitCode -ne 0) {
        Write-Host "Tests failed!" -ForegroundColor Red
        exit $exitCode
    }
    
    Write-Host "Tests completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

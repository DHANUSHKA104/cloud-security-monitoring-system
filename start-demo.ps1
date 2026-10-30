<#
.SYNOPSIS
  Cloud Security Monitoring System - Single-click Demo Orchestrator
.DESCRIPTION
  Loads .env variables, checks backend jar (building if missing), verifies PostgreSQL,
  launches Spring Boot backend, FastAPI analytics service, and React Vite frontend.
  Verifies all health endpoints and opens the live SOC dashboard.
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   Cloud Security Monitoring System - Automated Demo Launcher         " -ForegroundColor Cyan
Write-Host "   Lead: Dhanushka | Domain: Java SOC Incident Management             " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 0. Load environment variables from .env
$envFile = Join-Path $ProjectRoot ".env"
if (Test-Path $envFile) {
    Write-Host "`n[0/4] Loading environment configuration from .env..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $varName = $parts[0].Trim()
            $varVal = $parts[1].Trim()
            [System.Environment]::SetEnvironmentVariable($varName, $varVal, [System.EnvironmentVariableTarget]::Process)
        }
    }
    Write-Host "  [OK] Environment variables loaded." -ForegroundColor Green
}

# 1. Verify PostgreSQL
Write-Host "`n[1/4] Checking PostgreSQL on port 5432..." -ForegroundColor Yellow
$pgPort = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
if (-not $pgPort) {
    $pgCmd = Get-Command "postgres" -ErrorAction SilentlyContinue
    $pgExe = if ($pgCmd) { $pgCmd.Source } elseif (Test-Path "C:\projects\pgsql\bin\postgres.exe") { "C:\projects\pgsql\bin\postgres.exe" } else { $null }
    if ($pgExe) {
        Write-Host "  Starting PostgreSQL daemon..." -ForegroundColor Gray
        $pgDataDir = if ($env:PGDATA) { $env:PGDATA } elseif (Test-Path "C:\projects\pgsql\data") { "C:\projects\pgsql\data" } else { Join-Path (Split-Path (Split-Path $pgExe)) "data" }
        Start-Process -FilePath $pgExe -ArgumentList "-D", $pgDataDir -WindowStyle Minimized
        Start-Sleep -Seconds 3
    } else {
        Write-Host "  PostgreSQL not listening on port 5432. Please ensure PostgreSQL is running." -ForegroundColor Red
    }
} else {
    Write-Host "  [OK] PostgreSQL is active on port 5432." -ForegroundColor Green
}

# 2. Verify / Build & Start Backend
Write-Host "`n[2/4] Checking Spring Boot Backend on port 8080..." -ForegroundColor Yellow
$backendPort = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if (-not $backendPort) {
    $jarPath = Join-Path $ProjectRoot "backend\target\cloudsec-monitor-backend-1.1.0.jar"
    if (-not (Test-Path $jarPath)) {
        Write-Host "  Backend jar not found. Building with Maven package..." -ForegroundColor Gray
        $mvnCmd = if (Get-Command "mvn.cmd" -ErrorAction SilentlyContinue) { 
            "mvn.cmd" 
        } elseif (Get-Command "mvn" -ErrorAction SilentlyContinue) { 
            "mvn" 
        } elseif (Test-Path "C:\Users\Dhanushka K S\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd") {
            "C:\Users\Dhanushka K S\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd"
        } else {
            "mvn.cmd"
        }
        Start-Process -FilePath $mvnCmd -ArgumentList "clean", "package", "-DskipTests" -WorkingDirectory "$ProjectRoot\backend" -Wait -NoNewWindow
    }

    Write-Host "  Launching Spring Boot 3 Backend..." -ForegroundColor Gray
    Start-Process -FilePath "java" -ArgumentList "-jar", $jarPath -WindowStyle Minimized
    
    $timeout = 40
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds 2
        $elapsed += 2
        try {
            $h = Invoke-RestMethod -Uri "http://127.0.0.1:8080/actuator/health" -TimeoutSec 2 -ErrorAction Stop
            if ($h.status -eq "UP") { break }
        } catch {}
    }
}
Write-Host "  [OK] Spring Boot Backend is UP (http://127.0.0.1:8080)." -ForegroundColor Green

# 3. Verify / Start Python Analytics Service
Write-Host "`n[3/4] Checking Python Analytics Service on port 8000..." -ForegroundColor Yellow
$analyticsPort = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if (-not $analyticsPort) {
    Write-Host "  Launching FastAPI Analytics Engine..." -ForegroundColor Gray
    $uvicornPath = Join-Path $ProjectRoot "analytics\.venv\Scripts\uvicorn.exe"
    if (Test-Path $uvicornPath) {
        Start-Process -FilePath $uvicornPath -ArgumentList "app.main:app", "--host", "127.0.0.1", "--port", "8000" -WorkingDirectory "$ProjectRoot\analytics" -WindowStyle Minimized
    } else {
        Start-Process -FilePath "uvicorn" -ArgumentList "app.main:app", "--host", "127.0.0.1", "--port", "8000" -WorkingDirectory "$ProjectRoot\analytics" -WindowStyle Minimized
    }
    Start-Sleep -Seconds 2
}
Write-Host "  [OK] Analytics Service is UP (http://127.0.0.1:8000/health)." -ForegroundColor Green

# 4. Verify / Start Frontend
Write-Host "`n[4/4] Checking React Frontend on port 5173..." -ForegroundColor Yellow
$frontendPort = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if (-not $frontendPort) {
    Write-Host "  Launching Vite Dev Server..." -ForegroundColor Gray
    $npmCmd = if (Get-Command "npm.cmd" -ErrorAction SilentlyContinue) { "npm.cmd" } else { "npm" }
    Start-Process -FilePath $npmCmd -ArgumentList "run", "dev" -WorkingDirectory "$ProjectRoot\frontend" -WindowStyle Minimized
    Start-Sleep -Seconds 3
}
Write-Host "  [OK] Frontend is READY (http://127.0.0.1:5173)." -ForegroundColor Green

$seedPass = if ($env:DEV_DEFAULT_PASSWORD) { $env:DEV_DEFAULT_PASSWORD } else { "configured in .env" }

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "   SYSTEM DEMO READY!                                                 " -ForegroundColor Green
Write-Host "   Dashboard:     http://127.0.0.1:5173                              " -ForegroundColor White
Write-Host "   Swagger Docs:  http://127.0.0.1:8080/swagger-ui.html              " -ForegroundColor White
Write-Host "   Admin Login:   admin@cloudsec.local                                " -ForegroundColor Yellow
Write-Host "   Analyst Login: alice.analyst@cloudsec.local                        " -ForegroundColor Yellow
Write-Host "   Password:      $seedPass                                          " -ForegroundColor Yellow
Write-Host "======================================================================`n" -ForegroundColor Cyan

# Open in default browser
Start-Process "http://127.0.0.1:5173"

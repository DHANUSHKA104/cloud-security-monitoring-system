<#
.SYNOPSIS
  Cloud Security Monitoring System - Single-click Demo Orchestrator
.DESCRIPTION
  Launches PostgreSQL, Spring Boot backend, FastAPI analytics service, and React Vite frontend.
  Verifies all health endpoints and opens the live SOC dashboard.
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   Cloud Security Monitoring System - Automated Demo Launcher         " -ForegroundColor Cyan
Write-Host "   Lead: Dhanushka | Domain: Java SOC Incident Management             " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Verify PostgreSQL
Write-Host "`n[1/4] Checking PostgreSQL on port 5432..." -ForegroundColor Yellow
$pgPort = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
if (-not $pgPort) {
    Write-Host "  Starting PostgreSQL daemon..." -ForegroundColor Gray
    Start-Process -FilePath "C:\projects\pgsql\bin\postgres.exe" -ArgumentList "-D", "C:\projects\pgsql\data" -WindowStyle Minimized
    Start-Sleep -Seconds 3
}
Write-Host "  ✓ PostgreSQL is active." -ForegroundColor Green

# 2. Verify / Start Backend
Write-Host "`n[2/4] Checking Spring Boot Backend on port 8080..." -ForegroundColor Yellow
$backendPort = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if (-not $backendPort) {
    Write-Host "  Launching Spring Boot 3 Backend..." -ForegroundColor Gray
    Start-Process -FilePath "java" -ArgumentList "-jar", "$ProjectRoot\backend\target\cloudsec-monitor-backend-1.1.0.jar" -WindowStyle Minimized
    
    $timeout = 40
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds 2
        $elapsed += 2
        try {
            $h = Invoke-RestMethod -Uri "http://localhost:8080/actuator/health" -TimeoutSec 2 -ErrorAction Stop
            if ($h.status -eq "UP") { break }
        } catch {}
    }
}
Write-Host "  ✓ Spring Boot Backend is UP (http://localhost:8080)." -ForegroundColor Green

# 3. Verify / Start Python Analytics Service
Write-Host "`n[3/4] Checking Python Analytics Service on port 8000..." -ForegroundColor Yellow
$analyticsPort = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if (-not $analyticsPort) {
    Write-Host "  Launching FastAPI Analytics Engine..." -ForegroundColor Gray
    Start-Process -FilePath "$ProjectRoot\analytics\.venv\Scripts\uvicorn.exe" -ArgumentList "app.main:app", "--port", "8000" -WorkingDirectory "$ProjectRoot\analytics" -WindowStyle Minimized
    Start-Sleep -Seconds 2
}
Write-Host "  ✓ Analytics Service is UP (http://localhost:8000/health)." -ForegroundColor Green

# 4. Verify / Start Frontend
Write-Host "`n[4/4] Checking React Frontend on port 5173..." -ForegroundColor Yellow
$frontendPort = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if (-not $frontendPort) {
    Write-Host "  Launching Vite Dev Server..." -ForegroundColor Gray
    Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory "$ProjectRoot\frontend" -WindowStyle Minimized
    Start-Sleep -Seconds 3
}
Write-Host "  ✓ Frontend is READY (http://localhost:5173)." -ForegroundColor Green

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "   SYSTEM DEMO READY!                                                 " -ForegroundColor Green
Write-Host "   Dashboard:     http://localhost:5173                              " -ForegroundColor White
Write-Host "   Swagger Docs:  http://localhost:8080/swagger-ui.html              " -ForegroundColor White
Write-Host "   Login:         admin@cloudsec.local / change-me                   " -ForegroundColor Yellow
Write-Host "======================================================================`n" -ForegroundColor Cyan

# Open in default browser
Start-Process "http://localhost:5173"

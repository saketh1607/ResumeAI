# Fixes "backend" being a git submodule/file instead of a real folder on GitHub
# Run from project root: powershell -ExecutionPolicy Bypass -File scripts\fix-backend-on-github.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "Fixing backend folder for GitHub..." -ForegroundColor Cyan

# Nested .git makes GitHub treat backend as a submodule (broken link)
if (Test-Path "backend\.git") {
    Write-Host "Removing backend\.git (nested repo)..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "backend\.git"
}

# Remove broken gitlink from index
git rm -rf --cached backend 2>$null
if ($LASTEXITCODE -ne 0) { git rm --cached backend 2>$null }

# Re-add as normal directory
git add backend/

$staged = git diff --cached --name-only | Select-String "backend"
Write-Host "`nBackend files staged (sample):" -ForegroundColor Cyan
$staged | Select-Object -First 15

if (-not ($staged | Where-Object { $_ -eq "backend/requirements.txt" })) {
    Write-Host "ERROR: backend/requirements.txt not staged. Check backend folder exists." -ForegroundColor Red
    exit 1
}

git commit -m "Fix: add backend as folder (not submodule) for CI"
git push origin main

Write-Host "`nDone! Re-run GitHub Actions — backend job should pass." -ForegroundColor Green

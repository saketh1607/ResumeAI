# Safe push to GitHub — excludes .env, venv, node_modules
# Run: powershell -ExecutionPolicy Bypass -File scripts\push-safe.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "Project root: $Root" -ForegroundColor Cyan

if (Test-Path ".git") {
    Write-Host "Removing old .git folder (clears bad history)..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .git
}

git init
git add .

$staged = git diff --cached --name-only
$bad = $staged | Where-Object {
    $_ -match '(^|/|\\)\.env$' -or
    $_ -match 'venv' -or
    $_ -match 'node_modules' -or
    $_ -match '\.dll$'
}

if ($bad) {
    Write-Host "Unstaging forbidden files:" -ForegroundColor Yellow
    $bad | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Red
        git reset -- $_
    }
}

Write-Host "`nFiles to commit:" -ForegroundColor Cyan
git status --short

git commit -m "AI Resume Analyzer RAG - full stack project (Gemini + FAISS)"
git branch -M main

$remote = "https://github.com/Priyanshu-Patidar/AI-Resume-Analyzer-RAG.git"
git remote remove origin 2>$null
git remote add origin $remote

Write-Host "`nPushing to $remote ..." -ForegroundColor Cyan
git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccess! Repo updated." -ForegroundColor Green
} else {
    Write-Host "`nPush failed. Sign in to GitHub (PAT token) and run again." -ForegroundColor Red
}

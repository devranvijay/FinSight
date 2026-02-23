#!/usr/bin/env pwsh
# ────────────────────────────────────────────────────────────────────────────
# FinSight AI — GitHub Push Helper
# Usage: Right-click this file → "Run with PowerShell"
#        OR in PowerShell terminal: .\push_to_github.ps1
# ────────────────────────────────────────────────────────────────────────────

# ── STEP 1: FILL IN YOUR DETAILS ────────────────────────────────────────────
$GITHUB_USERNAME = "YOUR_GITHUB_USERNAME"       # e.g. "nirajsingh"
$REPO_NAME       = "FinSight"                   # name for the new GitHub repo
$REPO_DESC       = "FinSight AI — Intelligent Financial Decision Engine · Analytics · Forecasting · Risk Scoring"
$PRIVATE         = $false                       # $true for private repo
$GITHUB_TOKEN    = "YOUR_PERSONAL_ACCESS_TOKEN" # GitHub PAT with 'repo' scope
#   Get a PAT at: https://github.com/settings/tokens/new
#   Required scopes: repo (full control of private repositories)
# ────────────────────────────────────────────────────────────────────────────

if ($GITHUB_USERNAME -eq "YOUR_GITHUB_USERNAME" -or $GITHUB_TOKEN -eq "YOUR_PERSONAL_ACCESS_TOKEN") {
    Write-Host ""
    Write-Host "ERROR: Please edit this script and fill in:" -ForegroundColor Red
    Write-Host "  `$GITHUB_USERNAME — your GitHub username" -ForegroundColor Yellow
    Write-Host "  `$GITHUB_TOKEN    — a Personal Access Token from https://github.com/settings/tokens/new" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Token scopes needed: 'repo' (check the checkbox)" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# ── STEP 2: CREATE REPO VIA GITHUB API ──────────────────────────────────────
Write-Host ""
Write-Host "Creating GitHub repository '$REPO_NAME'..." -ForegroundColor Cyan

$headers = @{
    Authorization  = "Bearer $GITHUB_TOKEN"
    Accept         = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$body = @{
    name        = $REPO_NAME
    description = $REPO_DESC
    private     = $PRIVATE
    auto_init   = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" `
        -Method Post -Headers $headers -Body $body -ContentType "application/json"

    $repoUrl = $response.clone_url
    Write-Host "✅ Repository created: $repoUrl" -ForegroundColor Green
} catch {
    $errMsg = $_.Exception.Response
    if ($errMsg -match "422" -or $_.ToString() -match "name already exists") {
        Write-Host "⚠️  Repository '$REPO_NAME' already exists on your account." -ForegroundColor Yellow
        $repoUrl = "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
        Write-Host "   Using existing repo: $repoUrl" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to create repo: $_" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# ── STEP 3: FIND GIT EXECUTABLE ─────────────────────────────────────────────
$gitPaths = @(
    "C:\Program Files\Git\bin\git.exe",
    "C:\Program Files (x86)\Git\bin\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\bin\git.exe",
    "$env:ProgramFiles\Git\cmd\git.exe"
)
$gitExe = $null
foreach ($p in $gitPaths) {
    if (Test-Path $p) { $gitExe = $p; break }
}
if (!$gitExe) {
    try { $gitExe = (Get-Command git -ErrorAction Stop).Source }
    catch {}
}

if (!$gitExe) {
    Write-Host ""
    Write-Host "⚠️  Git not found! Install Git from https://git-scm.com/download/win" -ForegroundColor Red
    Write-Host ""
    Write-Host "After installing Git, run these commands in Git Bash:" -ForegroundColor Cyan
    Write-Host "  cd `"$PSScriptRoot`"" -ForegroundColor White
    Write-Host "  git init" -ForegroundColor White
    Write-Host "  git add ." -ForegroundColor White
    Write-Host "  git commit -m `"feat: initial release — FinSight AI v1.3.0`"" -ForegroundColor White
    Write-Host "  git remote add origin $repoUrl" -ForegroundColor White
    Write-Host "  git branch -M main" -ForegroundColor White
    Write-Host "  git push -u origin main" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Found git at: $gitExe" -ForegroundColor Green

# ── STEP 4: INIT & PUSH ─────────────────────────────────────────────────────
$projectDir = Split-Path -Parent $PSScriptRoot
if (!(Split-Path -Path $PSScriptRoot -Leaf) -eq "FinSight") {
    $projectDir = $PSScriptRoot
}

Set-Location $PSScriptRoot
Write-Host ""
Write-Host "Working in: $(Get-Location)" -ForegroundColor Cyan

# Configure git credential for this push (uses token in URL)
$remoteWithToken = "https://$GITHUB_USERNAME`:$GITHUB_TOKEN`@github.com/$GITHUB_USERNAME/$REPO_NAME.git"

& $gitExe init
& $gitExe add .
& $gitExe commit -m "feat: initial release — FinSight AI v1.3.0

- FastAPI backend with SQLite/PostgreSQL dual-mode
- React 19 frontend with dark mode UI
- AI forecasting, anomaly detection, risk scoring
- Multi-currency support (10 currencies)
- Excel + PDF data export
- JWT auth with RBAC
- Mobile-responsive layout
- Docker Compose deployment"

& $gitExe remote remove origin 2>$null
& $gitExe remote add origin $remoteWithToken
& $gitExe branch -M main
& $gitExe push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 SUCCESS! Your project is live at:" -ForegroundColor Green
    Write-Host "   https://github.com/$GITHUB_USERNAME/$REPO_NAME" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Push failed. Check your token permissions and try again." -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to close"

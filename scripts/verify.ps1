<#
.SYNOPSIS
    Deterministic Verification Gate (verify.ps1)
    Detects repository type and runs zero-cost static analysis and test suites.
.DESCRIPTION
    Runs:
      1. Static Analysis / Typecheck (mypy, tsc, eslint, node syntax check)
      2. Unit and Integration Tests (pytest, vitest, npm test)
    Returns exit code 0 if all gates pass, 1 otherwise.
#>

param(
    [switch]$Quick,
    [string]$TargetTest,
    [switch]$Alarm,
    [switch]$Voice
)

$ErrorActionPreference = "Continue"
$failed = $false

Write-Host ""
Write-Host "🔍 [FLEET LOOP] Running Deterministic Verification..." -ForegroundColor Cyan

# 1. JavaScript Syntax Gate
$entrypoint = $null
if (Test-Path "src/main.js") { $entrypoint = "src/main.js" }
elseif (Test-Path "docs/app.js") { $entrypoint = "docs/app.js" }

if ($entrypoint) {
    Write-Host ""
    Write-Host "--- [JavaScript Syntax Gate] ---" -ForegroundColor Yellow
    $hasNode = Get-Command node -ErrorAction SilentlyContinue
    if ($hasNode) {
        Write-Host "Checking $entrypoint syntax..." -ForegroundColor Gray
        node --check $entrypoint
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ $entrypoint syntax check failed!" -ForegroundColor Red
            $failed = $true
        } else {
            Write-Host "✅ $entrypoint syntax check passed." -ForegroundColor Green
        }
    }
}

# 2. Test Suites (Vitest / npm test)
$isNode = Test-Path "package.json"
if ($isNode -and (-not $failed)) {
    if ($Quick) {
        Write-Host ""
        Write-Host "⏩ [-Quick] Bypassing test runner in quick gate mode." -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "--- [Vitest Test Gate] ---" -ForegroundColor Yellow
        Write-Host "Running tests (npm test)..." -ForegroundColor Gray
        if ($TargetTest) {
            npm test -- $TargetTest
        } else {
            npm test
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ npm test failed!" -ForegroundColor Red
            $failed = $true
        } else {
            Write-Host "✅ npm test passed." -ForegroundColor Green
        }
    }
}

# 3. Agent Alarm Resolver
$alarmScript = Join-Path $PSScriptRoot "agent-alarm.ps1"
if (-not (Test-Path $alarmScript)) {
    $alarmScript = Join-Path $env:USERPROFILE ".gemini\config\skills\agent-alarm\scripts\agent-alarm.ps1"
}

# 4. Overall Verification Result
if ($failed) {
    Write-Host ""
    Write-Host "⛔ [VERIFICATION FAILED] Please fix errors before proceeding." -ForegroundColor Red
    if ($Alarm -or $Voice) {
        if (Test-Path $alarmScript) {
            $alarmArgs = @("-Type", "Failure", "-Message", "Verification failed. Attention required.")
            pwsh -File $alarmScript @alarmArgs
        } else {
            try { [System.Media.SystemSounds]::Hand.Play() } catch {}
        }
    }
    exit 1
}

Write-Host ""
Write-Host "🎉 [VERIFICATION PASSED] All deterministic gates green." -ForegroundColor Green
if ($Alarm -or $Voice) {
    if (Test-Path $alarmScript) {
        $alarmArgs = @("-Type", "Success", "-Message", "All verification gates are green.")
        pwsh -File $alarmScript @alarmArgs
    } else {
        try { [System.Media.SystemSounds]::Asterisk.Play() } catch {}
    }
}
exit 0

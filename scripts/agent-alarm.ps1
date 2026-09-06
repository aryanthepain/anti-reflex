<#
.SYNOPSIS
    Cross-platform Audio & Speech Notification Runner for Antigravity Agents.

.DESCRIPTION
    Plays audio chimes and speaks voice alerts upon task completion, verification success,
    or failure using native OS channels (PowerShell SystemSounds / Speech on Windows,
    afplay/say on macOS, paplay/spd-say on Linux).

.PARAMETER Type
    Event type: Success (default), Failure, Warning, or Info.

.PARAMETER Message
    Custom speech or display message.

.PARAMETER SoundOnly
    Play chime only without text-to-speech.

.PARAMETER VoiceOnly
    Speak message only without sound chime.

.EXAMPLE
    pwsh -File .\scripts\agent-alarm.ps1 -Type Success -Message "Task complete and all tests pass."
    pwsh -File .\scripts\agent-alarm.ps1 -Type Failure -Message "Verification failed. Attention required."
#>

[CmdletBinding()]
param(
    [ValidateSet("Success", "Failure", "Warning", "Info")]
    [string]$Type = "Success",

    [string]$Message = "",

    [switch]$SoundOnly,
    [switch]$VoiceOnly
)

# 1. Default Messages by Type
if ([string]::IsNullOrWhiteSpace($Message)) {
    switch ($Type) {
        "Success" { $Message = "Task completed successfully. All verification gates are green." }
        "Failure" { $Message = "Attention: Verification failed. Manual review required." }
        "Warning" { $Message = "Warning: Human checkpoint reached. Waiting for input." }
        "Info"    { $Message = "Antigravity task update." }
    }
}

Write-Host "🔔 [AGENT ALARM] Type: $Type | Message: $Message" -ForegroundColor $(
    switch ($Type) {
        "Success" { "Green" }
        "Failure" { "Red" }
        "Warning" { "Yellow" }
        Default   { "Cyan" }
    }
)

# 2. Native Sound Chime
if (-not $VoiceOnly) {
    try {
        if ($IsWindows -or $env:OS -match "Windows") {
            switch ($Type) {
                "Success" { [System.Media.SystemSounds]::Asterisk.Play() }
                "Failure" { [System.Media.SystemSounds]::Hand.Play() }
                "Warning" { [System.Media.SystemSounds]::Exclamation.Play() }
                Default   { [System.Media.SystemSounds]::Beep.Play() }
            }
        } elseif ($IsMacOS) {
            $soundFile = switch ($Type) {
                "Success" { "/System/Library/Sounds/Glass.aiff" }
                "Failure" { "/System/Library/Sounds/Basso.aiff" }
                Default   { "/System/Library/Sounds/Ping.aiff" }
            }
            if (Test-Path $soundFile) {
                Start-Process "afplay" -ArgumentList $soundFile -NoNewWindow
            }
        } elseif ($IsLinux) {
            $oga = switch ($Type) {
                "Success" { "/usr/share/sounds/freedesktop/stereo/complete.oga" }
                "Failure" { "/usr/share/sounds/freedesktop/stereo/dialog-error.oga" }
                Default   { "/usr/share/sounds/freedesktop/stereo/bell.oga" }
            }
            if (Get-Command paplay -ErrorAction SilentlyContinue -and (Test-Path $oga)) {
                Start-Process "paplay" -ArgumentList $oga -NoNewWindow
            } else {
                [Console]::Beep()
            }
        }
    } catch {
        # Fallback beep
        [Console]::Beep()
    }
}

# 3. Text-to-Speech Voice Notification
if (-not $SoundOnly -and -not [string]::IsNullOrWhiteSpace($Message)) {
    try {
        if ($IsWindows -or $env:OS -match "Windows") {
            # Try .NET SpeechSynthesizer first
            try {
                Add-Type -AssemblyName System.Speech -ErrorAction Stop
                $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
                $synth.Rate = 1
                $synth.Speak($Message)
            } catch {
                # Fallback to COM SAPI.SpVoice
                $voice = New-Object -ComObject SAPI.SpVoice
                $voice.Rate = 1
                [void]$voice.Speak($Message)
            }
        } elseif ($IsMacOS) {
            if (Get-Command say -ErrorAction SilentlyContinue) {
                Start-Process "say" -ArgumentList "`"$Message`"" -NoNewWindow
            }
        } elseif ($IsLinux) {
            if (Get-Command spd-say -ErrorAction SilentlyContinue) {
                Start-Process "spd-say" -ArgumentList "`"$Message`"" -NoNewWindow
            }
        }
    } catch {
        # Graceful silence if audio/speech device unavailable
    }
}

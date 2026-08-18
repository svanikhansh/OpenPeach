#Requires -Version 5.1
# Security note: review this script before executing it. It is fetched via
# HTTPS from GitHub; do not run scripts from untrusted sources.

Set-StrictMode -Version Latest

$Repo = "svanikhansh/OpenPeach"
$Package = "openpeach"

function Test-CommandExists {
  param([string]$Command)
  $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Install-FromNpm {
  Write-Host "Trying npm registry ($Package)..."
  npm install -g $Package
  return $LASTEXITCODE -eq 0
}

function Install-FromGitHubNpm {
  Write-Host "Trying GitHub via npm (github:$Repo)..."
  npm install -g "github:$Repo"
  return $LASTEXITCODE -eq 0
}

function Install-FromGitHubZip {
  Write-Host "Trying direct GitHub zip download..."
  $tmp = Join-Path $env:TEMP ("openpeach-install-" + [System.Guid]::NewGuid().ToString())
  New-Item -ItemType Directory -Path $tmp | Out-Null
  try {
    $zip = Join-Path $tmp "openpeach.zip"
    Invoke-WebRequest -Uri "https://github.com/$Repo/archive/refs/heads/main.zip" -OutFile $zip -UseBasicParsing
    Expand-Archive -Path $zip -DestinationPath $tmp -Force
    $extracted = Join-Path $tmp "OpenPeach-main"
    Push-Location $extracted
    try {
      npm install -g .
      return $LASTEXITCODE -eq 0
    } finally {
      Pop-Location
    }
  } finally {
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
  }
}

Write-Host "OpenPeach Installer"
Write-Host "===================="

if (-not (Test-CommandExists "node")) {
  Write-Host "Error: Node.js is required but not installed."
  Write-Host "Install Node.js >= 18 from https://nodejs.org/ and try again."
  exit 1
}

$nodeVersion = node -v
$nodeMajor = [int]($nodeVersion -replace '^v(\d+).*', '$1')
if ($nodeMajor -lt 18) {
  Write-Host "Error: Node.js >= 18 is required (found $nodeVersion)."
  exit 1
}

Write-Host "Node.js $nodeVersion detected."

if (-not (Test-CommandExists "npm")) {
  Write-Host "Error: npm is required but not installed."
  exit 1
}

$installed = $false
if (Install-FromNpm) { $installed = $true }
elseif (Install-FromGitHubNpm) { $installed = $true }
elseif (Install-FromGitHubZip) { $installed = $true }

if (-not $installed) {
  Write-Host ""
  Write-Host "Error: installation failed."
  Write-Host "Please check your network connection and try again, or install manually:"
  Write-Host "  npm install -g $Package"
  Write-Host "  npm install -g github:$Repo"
  exit 1
}

if (Test-CommandExists "openpeach") {
  Write-Host ""
  Write-Host "OpenPeach installed successfully."
  Write-Host "Run it with: openpeach"
} else {
  Write-Host ""
  Write-Host "Installation complete, but the 'openpeach' command is not in your PATH."
  Write-Host "You may need to reload your PowerShell session or add your global npm bin to PATH."
}

#Requires -Version 5.1
# Security note: review this script before executing it. It is fetched via
# HTTPS from GitHub; do not run scripts from untrusted sources.

Set-StrictMode -Version Latest

$Repo = "svanikhansh/OpenPeach"
$Package = "openpeach"
$PM = $null

function Test-CommandExists {
  param([string]$Command)
  $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Get-PackageManager {
  if (Test-CommandExists "npm") { return "npm" }
  if (Test-CommandExists "pnpm") { return "pnpm" }
  if (Test-CommandExists "yarn") { return "yarn" }
  return $null
}

function Install-Global {
  param([string]$Spec)
  if ($PM -eq "yarn") {
    $yarnMajor = (yarn --version) -replace '^(\d+).*', '$1'
    if ($yarnMajor -eq "1") {
      yarn global add $Spec
    } else {
      Write-Host "Error: Yarn $yarnMajor does not support global installation. Use npm or pnpm instead."
      return $false
    }
  } else {
    & $PM install -g $Spec
  }
  return $LASTEXITCODE -eq 0
}

function Install-FromRegistry {
  Write-Host "Trying registry ($Package) via $PM..."
  return Install-Global $Package
}

function Install-FromGitHubPm {
  Write-Host "Trying GitHub via $PM (github:$Repo)..."
  return Install-Global "github:$Repo"
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
      return Install-Global "."
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

$PM = Get-PackageManager
if ($null -eq $PM) {
  Write-Host "Error: npm, pnpm, or yarn is required but none were found."
  exit 1
}

Write-Host "Using package manager: $PM"

$installed = $false
if (Install-FromRegistry) { $installed = $true }
elseif (Install-FromGitHubPm) { $installed = $true }
elseif (Install-FromGitHubZip) { $installed = $true }

if (-not $installed) {
  Write-Host ""
  Write-Host "Error: installation failed."
  Write-Host "Please check your network connection and try again, or install manually:"
  Write-Host "  npm install -g $Package"
  Write-Host "  pnpm install -g $Package"
  Write-Host "  yarn global add $Package"
  Write-Host "  npm install -g github:$Repo"
  exit 1
}

if (Test-CommandExists "peach") {
  Write-Host ""
  Write-Host "OpenPeach installed successfully."
  Write-Host "Run it with: peach"
} else {
  Write-Host ""
  Write-Host "Installation complete, but the 'peach' command is not in your PATH."
  Write-Host "You may need to reload your PowerShell session or add your global npm bin to PATH."
}

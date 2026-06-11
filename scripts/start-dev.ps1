# Start Customer Hub (CTERA AI Hub) locally on http://localhost:3000
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Error "pnpm is required. Install: npm install -g pnpm"
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..."
  pnpm install
}

node scripts/ensure-env.mjs

Write-Host "Starting Customer Hub at http://localhost:3000"
pnpm dev

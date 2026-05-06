param(
  [string]$Domain = "arcade.costleyentertainment.com",
  [string]$AppDomain = "",
  [string]$ApiDomain = "",
  [string]$IdentityDomain = "",
  [string]$Email = "admin@costleyentertainment.com",
  [switch]$RefreshUpstream,
  [switch]$ForceSecrets
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$deployRoot = Join-Path $repoRoot "deploy\self-hosted-supabase"
$upstreamRoot = Join-Path $deployRoot "upstream"
$envPath = Join-Path $deployRoot ".env"

if (-not $AppDomain) {
  $AppDomain = $Domain
}
if (-not $ApiDomain) {
  $ApiDomain = "api.$Domain"
}
if (-not $IdentityDomain) {
  $IdentityDomain = "identity.$Domain"
}

New-Item -ItemType Directory -Path $deployRoot -Force | Out-Null

if ($RefreshUpstream -and (Test-Path -LiteralPath $upstreamRoot)) {
  $resolved = (Resolve-Path -LiteralPath $upstreamRoot).Path
  $expectedPrefix = (Resolve-Path -LiteralPath $deployRoot).Path
  if (-not $resolved.StartsWith($expectedPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove unexpected upstream path: $resolved"
  }
  Remove-Item -LiteralPath $upstreamRoot -Recurse -Force
}

if (-not (Test-Path -LiteralPath (Join-Path $upstreamRoot "docker-compose.yml"))) {
  $git = Get-Command git -ErrorAction SilentlyContinue
  if (-not $git) {
    throw "git is required to fetch the official Supabase Docker bundle."
  }

  $tmpRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("nexus-supabase-" + [System.Guid]::NewGuid().ToString("n"))
  git clone --depth 1 --filter=blob:none --sparse https://github.com/supabase/supabase $tmpRoot
  git -C $tmpRoot sparse-checkout set docker
  New-Item -ItemType Directory -Path $upstreamRoot -Force | Out-Null
  Copy-Item -Path (Join-Path $tmpRoot "docker\*") -Destination $upstreamRoot -Recurse -Force
  Remove-Item -LiteralPath $tmpRoot -Recurse -Force
}

$templatePath = Join-Path $upstreamRoot ".env.example"
$generatorArgs = @(
  "scripts/generate-self-hosted-supabase-env.mjs",
  "--template", $templatePath,
  "--out", $envPath,
  "--domain", $Domain,
  "--app-domain", $AppDomain,
  "--api-domain", $ApiDomain,
  "--identity-domain", $IdentityDomain,
  "--email", $Email
)
if ($ForceSecrets) {
  $generatorArgs += "--force-secrets"
}

node @generatorArgs

$composePath = Join-Path $upstreamRoot "docker-compose.yml"
$composeContent = Get-Content -LiteralPath $composePath -Raw
$composeContent = $composeContent `
  -replace '(?m)^(\s*)#(GOTRUE_JWT_KEYS:\s*\$\{JWT_KEYS:-\[\]\})', '$1$2' `
  -replace '(?m)^(\s*)#(API_JWT_JWKS:\s*\$\{JWT_JWKS:-\{"keys":\[\]\}\})', '$1$2' `
  -replace '(?m)^(\s*)#(JWT_JWKS:\s*\$\{JWT_JWKS:-\{"keys":\[\]\}\})', '$1$2'
Set-Content -LiteralPath $composePath -Value $composeContent

Write-Host "Self-hosted Supabase bundle is ready."
Write-Host "Generated env: deploy/self-hosted-supabase/.env"
Write-Host "Start production stack: npm run selfhost:up"
Write-Host "Validate startup security: npm run security:startup"

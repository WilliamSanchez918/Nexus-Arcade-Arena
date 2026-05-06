$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot ".env"
$envExamplePath = Join-Path $repoRoot ".env.example"

if (-not (Test-Path -LiteralPath $envPath)) {
  if (-not (Test-Path -LiteralPath $envExamplePath)) {
    throw ".env.example was not found."
  }
  Copy-Item -LiteralPath $envExamplePath -Destination $envPath
}

$statusOutput = & npx supabase status -o env
if ($LASTEXITCODE -ne 0) {
  throw "Supabase status failed. Run npm run supabase:start first."
}

$status = @{}
foreach ($line in $statusOutput) {
  if ($line -match "^([A-Z0-9_]+)=(.*)$") {
    $key = $Matches[1]
    $value = $Matches[2].Trim().Trim('"')
    $status[$key] = $value
  }
}

$apiUrl = $status["API_URL"]
$publishableKey = $status["PUBLISHABLE_KEY"]
$anonKey = $status["ANON_KEY"]
$clientKey = if ($publishableKey) { $publishableKey } else { $anonKey }
if (-not $apiUrl -or -not $clientKey) {
  throw "Supabase status did not include API_URL and a browser-safe client key."
}

$updates = [ordered]@{
  "IDENTITY_PROVIDER" = "supabase"
  "SUPABASE_PROJECT_URL" = $apiUrl
  "IDENTITY_ISSUER" = "$apiUrl/auth/v1"
  "IDENTITY_JWKS_URL" = "$apiUrl/auth/v1/.well-known/jwks.json"
  "IDENTITY_AUDIENCE" = "authenticated"
  "VITE_IDENTITY_PROVIDER" = "supabase"
  "VITE_SUPABASE_URL" = $apiUrl
  "VITE_SUPABASE_PUBLISHABLE_KEY" = $clientKey
  "VITE_SUPABASE_ANON_KEY" = if ($anonKey) { $anonKey } else { $clientKey }
}

$content = Get-Content -LiteralPath $envPath -Raw
foreach ($entry in $updates.GetEnumerator()) {
  $pattern = "(?m)^$([regex]::Escape($entry.Key))=.*$"
  $replacement = "$($entry.Key)=$($entry.Value)"
  if ($content -match $pattern) {
    $content = [regex]::Replace($content, $pattern, $replacement)
  } else {
    if (-not $content.EndsWith("`n")) {
      $content += "`n"
    }
    $content += "$replacement`n"
  }
}

Set-Content -LiteralPath $envPath -Value $content
Write-Host "Updated .env for local Supabase Auth at $apiUrl"

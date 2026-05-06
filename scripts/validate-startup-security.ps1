param(
  [string]$EnvFile = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = if ($EnvFile) { $EnvFile } else { Join-Path $repoRoot ".env" }
$supabaseConfigPath = Join-Path $repoRoot "supabase\config.toml"

function Read-DotEnv($path) {
  $values = @{}
  if (-not (Test-Path -LiteralPath $path)) {
    return $values
  }
  foreach ($line in Get-Content -LiteralPath $path) {
    if ($line -match "^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$") {
      $values[$Matches[1]] = $Matches[2].Trim().Trim('"')
    }
  }
  return $values
}

function Merge-ProcessEnv($values) {
  foreach ($key in @(
    "NODE_ENV",
    "DEPLOYMENT_ENVIRONMENT",
    "SUPABASE_DEPLOYMENT_MODE",
    "SUPABASE_SELF_HOSTED_ENV_FILE",
    "APP_BASE_URL",
    "API_BASE_URL",
    "IDENTITY_PROVIDER",
    "SUPABASE_PROJECT_URL",
    "IDENTITY_ISSUER",
    "IDENTITY_JWKS_URL",
    "IDENTITY_AUDIENCE",
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_ANON_KEY",
    "GAME_CALLBACK_SECRET",
    "PASSPORT_TOKEN_SECRET",
    "OAUTH_ISSUER",
    "EXPOSE_DEV_2FA_CODES",
    "OPERATOR_PIN"
  )) {
    $processValue = [Environment]::GetEnvironmentVariable($key)
    if ($processValue) {
      $values[$key] = $processValue
    }
  }
  return $values
}

function Require-Match($content, $pattern, $message) {
  if ($content -notmatch $pattern) {
    throw $message
  }
}

function Resolve-RepoPath($value) {
  if (-not $value) {
    return $value
  }
  if ([System.IO.Path]::IsPathRooted($value)) {
    return $value
  }
  return Join-Path $repoRoot $value
}

function Require-EnvValue($values, $key, $message) {
  if (-not $values[$key]) {
    throw $message
  }
}

function Require-Not-Insecure($values, $key, $message) {
  $value = $values[$key]
  if (-not $value -or $value -match "(your-|insecure|fake_|secret1234|replace-with|local-dev)") {
    throw $message
  }
}

function Is-LoopbackUrl($value) {
  if (-not $value) {
    return $false
  }
  try {
    $uri = [System.Uri]$value
    return @("localhost", "127.0.0.1", "::1") -contains $uri.Host -or $uri.Host.StartsWith("127.")
  } catch {
    return $false
  }
}

function Is-HttpsUrl($value) {
  if (-not $value) {
    return $false
  }
  try {
    $uri = [System.Uri]$value
    return $uri.Scheme -eq "https"
  } catch {
    return $false
  }
}

if (-not (Test-Path -LiteralPath $supabaseConfigPath)) {
  throw "supabase/config.toml was not found."
}

$supabaseConfig = Get-Content -LiteralPath $supabaseConfigPath -Raw
$envValues = Merge-ProcessEnv (Read-DotEnv $envPath)
$deploymentEnvironment = $envValues["DEPLOYMENT_ENVIRONMENT"]
if (-not $deploymentEnvironment) {
  $deploymentEnvironment = "local"
}
$isLocal = $deploymentEnvironment -eq "local"
$supabaseDeploymentMode = $envValues["SUPABASE_DEPLOYMENT_MODE"]
if (-not $supabaseDeploymentMode) {
  $supabaseDeploymentMode = if ($isLocal) { "local-cli" } else { "hosted" }
}

Require-Match $supabaseConfig '(?m)^project_id\s*=\s*"nexus-arcade-arena"\s*$' "Supabase project_id must be nexus-arcade-arena."
Require-Match $supabaseConfig '(?m)^enable_anonymous_sign_ins\s*=\s*false\s*$' "Supabase anonymous sign-ins must stay disabled."
Require-Match $supabaseConfig '(?m)^enable_refresh_token_rotation\s*=\s*true\s*$' "Supabase refresh token rotation must stay enabled."
Require-Match $supabaseConfig '(?m)^minimum_password_length\s*=\s*([8-9]|[1-9][0-9]+)\s*$' "Supabase minimum password length must be at least 8."
Require-Match $supabaseConfig '(?m)^password_requirements\s*=\s*"lower_upper_letters_digits_symbols"\s*$' "Supabase password requirements must require lower/upper/digit/symbol."
Require-Match $supabaseConfig '(?m)^secure_password_change\s*=\s*true\s*$' "Supabase secure password changes must stay enabled."

if (-not $isLocal) {
  if ($deploymentEnvironment -eq "production" -and $envValues["NODE_ENV"] -ne "production") {
    throw "NODE_ENV must be production when DEPLOYMENT_ENVIRONMENT=production."
  }
  if ($supabaseDeploymentMode -eq "local-cli") {
    throw "SUPABASE_DEPLOYMENT_MODE cannot be local-cli in $deploymentEnvironment."
  }
  if ($envValues["IDENTITY_PROVIDER"] -ne "supabase") {
    throw "IDENTITY_PROVIDER must be supabase in $deploymentEnvironment."
  }

  foreach ($key in @("APP_BASE_URL", "API_BASE_URL", "SUPABASE_PROJECT_URL", "IDENTITY_ISSUER", "IDENTITY_JWKS_URL", "VITE_SUPABASE_URL", "OAUTH_ISSUER")) {
    if (-not $envValues[$key]) {
      throw "$key must be set in $deploymentEnvironment."
    }
    if (Is-LoopbackUrl $envValues[$key]) {
      throw "$key cannot be loopback in $deploymentEnvironment."
    }
    if (-not (Is-HttpsUrl $envValues[$key])) {
      throw "$key must use HTTPS in $deploymentEnvironment."
    }
  }

  if ($envValues["IDENTITY_AUDIENCE"] -ne "authenticated") {
    throw "IDENTITY_AUDIENCE should be authenticated in $deploymentEnvironment."
  }
  if (-not $envValues["VITE_SUPABASE_PUBLISHABLE_KEY"] -and -not $envValues["VITE_SUPABASE_ANON_KEY"]) {
    throw "A browser-safe Supabase client key must be configured in $deploymentEnvironment."
  }
  foreach ($key in @("GAME_CALLBACK_SECRET", "PASSPORT_TOKEN_SECRET")) {
    $value = $envValues[$key]
    if (-not $value -or $value -match "^(replace-with|local-dev)") {
      throw "$key must be set to a non-development secret in $deploymentEnvironment."
    }
  }
  if ($envValues["EXPOSE_DEV_2FA_CODES"] -ne "false") {
    throw "EXPOSE_DEV_2FA_CODES must be false in $deploymentEnvironment."
  }
  if (-not $envValues["OPERATOR_PIN"] -or $envValues["OPERATOR_PIN"] -eq "000000") {
    throw "OPERATOR_PIN must be changed from the default in $deploymentEnvironment."
  }

  if ($supabaseDeploymentMode -eq "self-hosted") {
    $selfHostedEnvPath = $envValues["SUPABASE_SELF_HOSTED_ENV_FILE"]
    if (-not $selfHostedEnvPath) {
      $selfHostedEnvPath = "deploy\self-hosted-supabase\.env"
    }
    $selfHostedEnvPath = Resolve-RepoPath $selfHostedEnvPath
    if (-not (Test-Path -LiteralPath $selfHostedEnvPath)) {
      throw "Self-hosted Supabase env file was not found at $selfHostedEnvPath. Run npm run selfhost:supabase:bootstrap."
    }
    $selfHostedValues = Read-DotEnv $selfHostedEnvPath

    foreach ($key in @("SUPABASE_PUBLIC_URL", "API_EXTERNAL_URL", "SITE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "JWT_KEYS", "JWT_JWKS", "ANON_KEY_ASYMMETRIC", "SERVICE_ROLE_KEY_ASYMMETRIC")) {
      Require-EnvValue $selfHostedValues $key "$key must be present in the self-hosted Supabase env file."
    }
    foreach ($key in @("POSTGRES_PASSWORD", "JWT_SECRET", "DASHBOARD_PASSWORD", "SECRET_KEY_BASE", "VAULT_ENC_KEY", "PG_META_CRYPTO_KEY", "LOGFLARE_PUBLIC_ACCESS_TOKEN", "LOGFLARE_PRIVATE_ACCESS_TOKEN")) {
      Require-Not-Insecure $selfHostedValues $key "$key must be generated and non-default in the self-hosted Supabase env file."
    }
    if ($selfHostedValues["SUPABASE_PUBLIC_URL"] -ne $envValues["SUPABASE_PROJECT_URL"]) {
      throw "SUPABASE_PUBLIC_URL must match SUPABASE_PROJECT_URL for self-hosted deployments."
    }
    if ($selfHostedValues["API_EXTERNAL_URL"] -ne $envValues["SUPABASE_PROJECT_URL"]) {
      throw "API_EXTERNAL_URL must match SUPABASE_PROJECT_URL for self-hosted deployments."
    }
    if ($selfHostedValues["SITE_URL"] -ne $envValues["APP_BASE_URL"]) {
      throw "SITE_URL must match APP_BASE_URL for self-hosted deployments."
    }
    if ($selfHostedValues["ENABLE_EMAIL_AUTOCONFIRM"] -ne "false") {
      throw "ENABLE_EMAIL_AUTOCONFIRM must be false in self-hosted production."
    }
    if ($selfHostedValues["ENABLE_ANONYMOUS_USERS"] -ne "false") {
      throw "ENABLE_ANONYMOUS_USERS must be false in self-hosted production."
    }
    if ($selfHostedValues["STUDIO_DEFAULT_PROJECT"] -ne "Nexus Identity") {
      throw "STUDIO_DEFAULT_PROJECT should be Nexus Identity for self-hosted production."
    }
    if ($deploymentEnvironment -eq "production") {
      if (-not $selfHostedValues["SMTP_HOST"] -or $selfHostedValues["SMTP_HOST"] -eq "supabase-mail" -or $selfHostedValues["SMTP_HOST"] -match "fake") {
        throw "Production self-hosted Supabase requires a real SMTP_HOST for auth email confirmation."
      }
      if (-not $selfHostedValues["SMTP_PASS"] -or $selfHostedValues["SMTP_PASS"] -match "fake") {
        throw "Production self-hosted Supabase requires a real SMTP_PASS for auth email confirmation."
      }
    }
  }
}

if ($isLocal) {
  $statusOutput = & npx supabase status -o env
  if ($LASTEXITCODE -ne 0) {
    throw "Supabase status failed. Run npm run supabase:setup before startup validation."
  }

  $status = @{}
  foreach ($line in $statusOutput) {
    if ($line -match "^([A-Z0-9_]+)=(.*)$") {
      $status[$Matches[1]] = $Matches[2].Trim().Trim('"')
    }
  }

  if (-not $status["API_URL"] -or -not ($status["PUBLISHABLE_KEY"] -or $status["ANON_KEY"])) {
    throw "Supabase status did not return API_URL and a browser-safe client key."
  }

  if ($envValues["IDENTITY_PROVIDER"] -ne "supabase") {
    throw ".env must use IDENTITY_PROVIDER=supabase after local Supabase setup."
  }
  if ($envValues["SUPABASE_PROJECT_URL"] -ne $status["API_URL"]) {
    throw ".env SUPABASE_PROJECT_URL does not match the running local Supabase API URL."
  }
  if ($envValues["VITE_SUPABASE_URL"] -ne $status["API_URL"]) {
    throw ".env VITE_SUPABASE_URL does not match the running local Supabase API URL."
  }
  if (-not $envValues["VITE_SUPABASE_PUBLISHABLE_KEY"] -and -not $envValues["VITE_SUPABASE_ANON_KEY"]) {
    throw ".env must include a browser-safe Supabase client key."
  }
  $jwksUrl = "$($status["API_URL"])/auth/v1/.well-known/jwks.json"
} else {
  $jwksUrl = $envValues["IDENTITY_JWKS_URL"]
}

$jwks = Invoke-RestMethod -Uri $jwksUrl -TimeoutSec 10
if (-not $jwks.keys -or $jwks.keys.Count -lt 1) {
  throw "Supabase Auth JWKS did not return a signing key."
}

Write-Host "Startup security validation passed for Nexus Arcade Arena."
Write-Host "Supabase project_id is nexus-arcade-arena. Local Studio may still show /project/default; that is Supabase Studio's local route."
if ($isLocal) {
  Write-Host "Local mode keeps email confirmation disabled for fast development login. Non-local validation requires confirmation and non-loopback URLs."
} elseif ($supabaseDeploymentMode -eq "self-hosted") {
  Write-Host "$deploymentEnvironment self-hosted mode requires HTTPS, generated Supabase keys, JWKS availability, non-development secrets, SMTP, and hidden dev 2FA codes."
} else {
  Write-Host "$deploymentEnvironment mode requires HTTPS, email confirmation, JWKS availability, non-development secrets, and hidden dev 2FA codes."
}

param(
  [switch]$StartApps
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

if (-not (Test-Path -LiteralPath (Join-Path $repoRoot "node_modules"))) {
  Write-Host "Installing Node dependencies"
  npm install
}

$envPath = Join-Path $repoRoot ".env"
$envExamplePath = Join-Path $repoRoot ".env.example"
if (-not (Test-Path -LiteralPath $envPath) -and (Test-Path -LiteralPath $envExamplePath)) {
  Write-Host "Creating .env from .env.example"
  Copy-Item -LiteralPath $envExamplePath -Destination $envPath
}

if ((Test-Path -LiteralPath $envPath) -and (Test-Path -LiteralPath $envExamplePath)) {
  $envContent = Get-Content -LiteralPath $envPath -Raw
  $missingEnvLines = @()
  foreach ($line in Get-Content -LiteralPath $envExamplePath) {
    if ($line -match "^\s*([A-Za-z_][A-Za-z0-9_]*)=") {
      $key = $Matches[1]
      if ($envContent -notmatch "(?m)^$([regex]::Escape($key))=") {
        $missingEnvLines += $line
      }
    }
  }
  if ($missingEnvLines.Count -gt 0) {
    Write-Host "Appending missing .env keys from .env.example"
    Add-Content -LiteralPath $envPath -Value ""
    Add-Content -LiteralPath $envPath -Value $missingEnvLines
  }
}

npm run setup:nexus-relay-assets
npm run supabase:setup
npm run security:startup

$godotCommand = Get-Command godot -ErrorAction SilentlyContinue
$wingetGodot = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Links\godot_console.exe"
if ($godotCommand) {
  $godotExecutable = $godotCommand.Source
  $godotVersion = & $godotExecutable --version
  Write-Host "Godot available on PATH: $godotVersion"
} elseif (Test-Path -LiteralPath $wingetGodot) {
  $godotExecutable = $wingetGodot
  $godotVersion = & $godotExecutable --version
  Write-Host "Godot available through WinGet link: $godotVersion"
} else {
  $godotExecutable = $null
  Write-Warning "Godot was not found on PATH. Install Godot 4.x or set GODOT_COMMAND_PATH before launching Nexus Relay from source."
}

if ($godotExecutable) {
  Write-Host "Importing Nexus Relay Godot assets"
  & $godotExecutable --headless --path (Join-Path $repoRoot "games\nexus-relay") --import --quit
}

npm run mongo:up

if ($StartApps) {
  $escapedRoot = $repoRoot.Replace("'", "''")
  $previewCommand = "Set-Location -LiteralPath '$escapedRoot'; npm run preview"
  $hubCommand = "Set-Location -LiteralPath '$escapedRoot'; npm run preview:hub"

  Write-Host "Starting Nexus web/API preview services"
  Start-Process -FilePath "powershell" -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $previewCommand) -WindowStyle Hidden
  Start-Sleep -Seconds 6
  Write-Host "Starting Nexus Arcade Hub"
  Start-Process -FilePath "powershell" -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $hubCommand) -WindowStyle Hidden
} else {
  Write-Host "First run setup complete. Use 'npm run first-run:start' to launch the preview services and Hub."
}

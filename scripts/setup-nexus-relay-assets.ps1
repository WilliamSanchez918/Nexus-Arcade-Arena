param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$downloadDir = Join-Path $repoRoot ".runtime\asset-downloads"
$projectRoot = Join-Path $repoRoot "games\nexus-relay"
$assetRoot = Join-Path $repoRoot "games\nexus-relay\assets"
$ambientDir = Join-Path $downloadDir "ambientcg"
$quaterniusDir = Join-Path $downloadDir "ultimate_space_kit-glb"

New-Item -ItemType Directory -Force -Path $downloadDir | Out-Null
New-Item -ItemType Directory -Force -Path $ambientDir | Out-Null
New-Item -ItemType Directory -Force -Path $quaterniusDir | Out-Null
New-Item -ItemType Directory -Force -Path $assetRoot | Out-Null

$archives = @(
  @{
    Name = "SpaceShooterRedux.zip"
    Url = "https://opengameart.org/sites/default/files/SpaceShooterRedux.zip"
    Extract = "SpaceShooterRedux"
  },
  @{
    Name = "kenney_rtssci-fi.zip"
    Url = "https://opengameart.org/sites/default/files/kenney_rtssci-fi.zip"
    Extract = "kenney_rtssci-fi"
  },
  @{
    Name = "kenney_interface-sounds.zip"
    Url = "https://kenney.nl/media/pages/assets/interface-sounds/d23a84242e-1677589452/kenney_interface-sounds.zip"
    Extract = "kenney_interface-sounds"
  },
  @{
    Name = "kenney_modular-space-kit_1.0.zip"
    Url = "https://opengameart.org/sites/default/files/kenney_modular-space-kit_1.0.zip"
    Extract = "Models"
  }
)

foreach ($archive in $archives) {
  $archivePath = Join-Path $downloadDir $archive.Name
  $extractPath = Join-Path $downloadDir $archive.Extract

  if ($Force -or -not (Test-Path -LiteralPath $archivePath)) {
    Write-Host "Downloading $($archive.Name)"
    Invoke-WebRequest -Uri $archive.Url -OutFile $archivePath
  }

  if ($Force -and (Test-Path -LiteralPath $extractPath)) {
    Remove-Item -LiteralPath $extractPath -Recurse -Force
  }

  if (-not (Test-Path -LiteralPath $extractPath)) {
    Write-Host "Extracting $($archive.Name)"
    Expand-Archive -LiteralPath $archivePath -DestinationPath $downloadDir -Force
  }
}

$ambientAssets = @(
  "MetalPlates006",
  "Metal031",
  "DiamondPlate005D"
)

foreach ($assetId in $ambientAssets) {
  $archivePath = Join-Path $ambientDir "$($assetId)_1K-JPG.zip"
  $extractPath = Join-Path $ambientDir $assetId
  if ($Force -or -not (Test-Path -LiteralPath $archivePath)) {
    Write-Host "Downloading $assetId PBR textures"
    Invoke-WebRequest -Uri "https://ambientcg.com/get?file=$($assetId)_1K-JPG.zip" -OutFile $archivePath
  }
  if ($Force -and (Test-Path -LiteralPath $extractPath)) {
    Remove-Item -LiteralPath $extractPath -Recurse -Force
  }
  if (-not (Test-Path -LiteralPath $extractPath)) {
    New-Item -ItemType Directory -Force -Path $extractPath | Out-Null
    Expand-Archive -LiteralPath $archivePath -DestinationPath $extractPath -Force
  }
}

$floorPanelAssetId = "MetalPlates006_2K"
$floorPanelArchive = Join-Path $ambientDir "MetalPlates006_2K-JPG.zip"
$floorPanelExtract = Join-Path $ambientDir $floorPanelAssetId
if ($Force -or -not (Test-Path -LiteralPath $floorPanelArchive)) {
  Write-Host "Downloading MetalPlates006 2K floor panel textures"
  Invoke-WebRequest -Uri "https://ambientcg.com/get?file=MetalPlates006_2K-JPG.zip" -OutFile $floorPanelArchive
}
if ($Force -and (Test-Path -LiteralPath $floorPanelExtract)) {
  Remove-Item -LiteralPath $floorPanelExtract -Recurse -Force
}
if (-not (Test-Path -LiteralPath $floorPanelExtract)) {
  New-Item -ItemType Directory -Force -Path $floorPanelExtract | Out-Null
  Expand-Archive -LiteralPath $floorPanelArchive -DestinationPath $floorPanelExtract -Force
}

$characterArchive = Join-Path $downloadDir "kenney_animated-characters-protagonists.zip"
$characterExtract = Join-Path $downloadDir "kenney_animated-characters-protagonists"
if ($Force -or -not (Test-Path -LiteralPath $characterArchive)) {
  Write-Host "Downloading Kenney Animated Characters Protagonists"
  Invoke-WebRequest -Uri "https://kenney.nl/media/pages/assets/animated-characters-protagonists/857f73b6e7-1774773108/kenney_animated-characters-protagonists.zip" -OutFile $characterArchive
}
if ($Force -and (Test-Path -LiteralPath $characterExtract)) {
  Remove-Item -LiteralPath $characterExtract -Recurse -Force
}
if (-not (Test-Path -LiteralPath $characterExtract)) {
  New-Item -ItemType Directory -Force -Path $characterExtract | Out-Null
  Expand-Archive -LiteralPath $characterArchive -DestinationPath $characterExtract -Force
}

$godotStoreDir = Join-Path $downloadDir "godot-store"
New-Item -ItemType Directory -Force -Path $godotStoreDir | Out-Null

$quaterniusAnimationArchive = Join-Path $godotStoreDir "Universal_Animation_LibraryStandard.zip"
$quaterniusAnimationExtract = Join-Path $godotStoreDir "Universal_Animation_LibraryStandard"
if ($Force -or -not (Test-Path -LiteralPath $quaterniusAnimationArchive)) {
  Write-Host "Downloading Quaternius Universal Animation Library"
  Invoke-WebRequest -Uri "https://store.godotengine.org/asset/quaternius/universal-animation-library/download/44/" -OutFile $quaterniusAnimationArchive -MaximumRedirection 5
}
if ($Force -and (Test-Path -LiteralPath $quaterniusAnimationExtract)) {
  Remove-Item -LiteralPath $quaterniusAnimationExtract -Recurse -Force
}
if (-not (Test-Path -LiteralPath $quaterniusAnimationExtract)) {
  New-Item -ItemType Directory -Force -Path $quaterniusAnimationExtract | Out-Null
  Expand-Archive -LiteralPath $quaterniusAnimationArchive -DestinationPath $quaterniusAnimationExtract -Force
}

$tomalityArchive = Join-Path $godotStoreDir "tomality_LOOPS.zip"
$tomalityExtract = Join-Path $godotStoreDir "tomality_LOOPS"
if ($Force -or -not (Test-Path -LiteralPath $tomalityArchive)) {
  Write-Host "Downloading Tomality free music sampler"
  Invoke-WebRequest -Uri "https://store.godotengine.org/asset/tomality/tomality-s-free-music-pack-sampler/download/1262/" -OutFile $tomalityArchive -MaximumRedirection 5
}
if ($Force -and (Test-Path -LiteralPath $tomalityExtract)) {
  Remove-Item -LiteralPath $tomalityExtract -Recurse -Force
}
if (-not (Test-Path -LiteralPath $tomalityExtract)) {
  New-Item -ItemType Directory -Force -Path $tomalityExtract | Out-Null
  Expand-Archive -LiteralPath $tomalityArchive -DestinationPath $tomalityExtract -Force
}

$godotAiArchive = Join-Path $godotStoreDir "godot-ai-plugin-4.zip"
$godotAiExtract = Join-Path $godotStoreDir "godot-ai-plugin-4"
if ($Force -or -not (Test-Path -LiteralPath $godotAiArchive)) {
  Write-Host "Downloading Godot AI editor utility"
  Invoke-WebRequest -Uri "https://store.godotengine.org/asset/dlight/godot-ai/download/1247/" -OutFile $godotAiArchive -MaximumRedirection 5
}
if ($Force -and (Test-Path -LiteralPath $godotAiExtract)) {
  Remove-Item -LiteralPath $godotAiExtract -Recurse -Force
}
if (-not (Test-Path -LiteralPath $godotAiExtract)) {
  New-Item -ItemType Directory -Force -Path $godotAiExtract | Out-Null
  Expand-Archive -LiteralPath $godotAiArchive -DestinationPath $godotAiExtract -Force
}

$sceneManagerArchive = Join-Path $godotStoreDir "Scene-Manager-1.2.0-source.zip"
$sceneManagerExtract = Join-Path $godotStoreDir "Scene-Manager-1.2.0-source"
$sceneManagerLicense = Join-Path $godotStoreDir "scene-manager_LICENSE.txt"
if ($Force -or -not (Test-Path -LiteralPath $sceneManagerArchive)) {
  Write-Host "Downloading Scene Manager transition utility"
  Invoke-WebRequest -Uri "https://github.com/glass-brick/Scene-Manager/archive/refs/tags/v1.2.0.zip" -OutFile $sceneManagerArchive -MaximumRedirection 5
}
if ($Force -and (Test-Path -LiteralPath $sceneManagerExtract)) {
  Remove-Item -LiteralPath $sceneManagerExtract -Recurse -Force
}
if (-not (Test-Path -LiteralPath $sceneManagerExtract)) {
  New-Item -ItemType Directory -Force -Path $sceneManagerExtract | Out-Null
  Expand-Archive -LiteralPath $sceneManagerArchive -DestinationPath $sceneManagerExtract -Force
}
if ($Force -or -not (Test-Path -LiteralPath $sceneManagerLicense)) {
  Invoke-WebRequest -Uri "https://raw.githubusercontent.com/glass-brick/Scene-Manager/main/LICENSE" -OutFile $sceneManagerLicense -MaximumRedirection 5
}

$quaterniusArchive = Join-Path $downloadDir "ultimate_space_kit-glb.zip"
if ($Force -or -not (Test-Path -LiteralPath $quaterniusArchive)) {
  Write-Host "Downloading Quaternius Ultimate Space Kit GLBs"
  Invoke-WebRequest -Uri "https://opengameart.org/sites/default/files/ultimate_space_kit-glb.zip" -OutFile $quaterniusArchive
}
if ($Force -and (Test-Path -LiteralPath $quaterniusDir)) {
  Remove-Item -LiteralPath $quaterniusDir -Recurse -Force
  New-Item -ItemType Directory -Force -Path $quaterniusDir | Out-Null
}
if (-not (Get-ChildItem -LiteralPath $quaterniusDir -File -Filter "*.glb" -ErrorAction SilentlyContinue | Select-Object -First 1)) {
  Expand-Archive -LiteralPath $quaterniusArchive -DestinationPath $quaterniusDir -Force
}

function Copy-Asset {
  param(
    [Parameter(Mandatory = $true)][string]$SourceRelative,
    [Parameter(Mandatory = $true)][string]$TargetRelative
  )

  $source = Join-Path $downloadDir $SourceRelative
  $target = Join-Path $assetRoot $TargetRelative
  if (-not (Test-Path -LiteralPath $source)) {
    throw "Missing source asset: $source"
  }

  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
  Copy-Item -LiteralPath $source -Destination $target -Force
}

function Copy-AssetDirectory {
  param(
    [Parameter(Mandatory = $true)][string]$SourceRelative,
    [Parameter(Mandatory = $true)][string]$TargetRelative
  )

  $source = Join-Path $downloadDir $SourceRelative
  $target = Join-Path $assetRoot $TargetRelative
  if (-not (Test-Path -LiteralPath $source)) {
    throw "Missing source asset directory: $source"
  }

  if (Test-Path -LiteralPath $target) {
    Remove-Item -LiteralPath $target -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
  Copy-Item -LiteralPath $source -Destination $target -Recurse -Force
}

function Copy-ProjectDirectory {
  param(
    [Parameter(Mandatory = $true)][string]$SourceRelative,
    [Parameter(Mandatory = $true)][string]$TargetRelative
  )

  $source = Join-Path $downloadDir $SourceRelative
  $target = Join-Path $projectRoot $TargetRelative
  if (-not (Test-Path -LiteralPath $source)) {
    throw "Missing source project directory: $source"
  }

  if (Test-Path -LiteralPath $target) {
    Remove-Item -LiteralPath $target -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
  Copy-Item -LiteralPath $source -Destination $target -Recurse -Force
}

function Copy-AmbientMap {
  param(
    [Parameter(Mandatory = $true)][string]$AssetId,
    [Parameter(Mandatory = $true)][string]$Suffix
  )

  $source = Get-ChildItem -LiteralPath (Join-Path $ambientDir $AssetId) -File -Filter "*_$Suffix.jpg" -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $source) {
    return
  }

  $targetDir = Join-Path $assetRoot "ambientcg\$AssetId"
  New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
  Copy-Item -LiteralPath $source.FullName -Destination $targetDir -Force
}

function Copy-QuaterniusModel {
  param(
    [Parameter(Mandatory = $true)][string]$FileName
  )

  $source = Join-Path $quaterniusDir $FileName
  if (-not (Test-Path -LiteralPath $source)) {
    throw "Missing Quaternius model: $source"
  }

  $targetDir = Join-Path $assetRoot "quaternius\ultimate-space-kit\models"
  New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
  Copy-Item -LiteralPath $source -Destination (Join-Path $targetDir $FileName) -Force
}

1..24 | ForEach-Object {
  $id = "{0:d2}" -f $_
  Copy-Asset "kenney_rtssci-fi\PNG\Default size\Tile\scifiTile_$id.png" "kenney\sci-fi-rts\tiles\scifiTile_$id.png"
}

1..12 | ForEach-Object {
  $id = "{0:d2}" -f $_
  Copy-Asset "kenney_rtssci-fi\PNG\Default size\Environment\scifiEnvironment_$id.png" "kenney\sci-fi-rts\environment\scifiEnvironment_$id.png"
  Copy-Asset "kenney_rtssci-fi\PNG\Default size\Unit\scifiUnit_$id.png" "kenney\sci-fi-rts\units\scifiUnit_$id.png"
}

1..10 | ForEach-Object {
  $id = "{0:d2}" -f $_
  Copy-Asset "kenney_rtssci-fi\PNG\Default size\Structure\scifiStructure_$id.png" "kenney\sci-fi-rts\structures\scifiStructure_$id.png"
}

@("fire00.png", "fire01.png", "fire02.png", "fire03.png", "shield1.png", "shield2.png", "shield3.png", "speed.png", "star1.png", "star2.png", "star3.png") | ForEach-Object {
  Copy-Asset "SpaceShooterRedux\PNG\Effects\$_" "kenney\space-shooter\effects\$_"
}

@("enemyBlue1.png", "enemyBlue2.png", "enemyRed1.png", "enemyGreen1.png") | ForEach-Object {
  Copy-Asset "SpaceShooterRedux\PNG\Enemies\$_" "kenney\space-shooter\enemies\$_"
}

@("beam0.png", "beam1.png", "beam2.png", "beamLong1.png", "turretBase_big.png", "turretBase_small.png") | ForEach-Object {
  Copy-Asset "SpaceShooterRedux\PNG\Parts\$_" "kenney\space-shooter\parts\$_"
}

@("click_001.ogg", "select_001.ogg", "confirmation_001.ogg", "error_001.ogg", "switch_001.ogg", "glitch_001.ogg", "drop_001.ogg") | ForEach-Object {
  Copy-Asset "kenney_interface-sounds\Audio\$_" "kenney\interface-sounds\$_"
}

@("room-small.glb", "room-wide.glb", "corridor.glb", "corridor-corner.glb", "corridor-wide.glb", "gate.glb", "gate-lasers.glb", "cables.glb", "stairs.glb", "template-floor-big.glb") | ForEach-Object {
  Copy-Asset "Models\GLB format\$_" "kenney\modular-space-kit\models\$_"
}

Copy-Asset "Models\GLB format\Textures\colormap.png" "kenney\modular-space-kit\models\Textures\colormap.png"

Copy-Asset "kenney_animated-characters-protagonists\Model\characterMedium.fbx" "kenney\animated-characters-protagonists\Model\characterMedium.fbx"
@("idle.fbx", "jump.fbx", "run.fbx") | ForEach-Object {
  Copy-Asset "kenney_animated-characters-protagonists\Animations\$_" "kenney\animated-characters-protagonists\Animations\$_"
}
@("cyborgFemaleA.png", "criminalMaleA.png", "skaterFemaleA.png", "skaterMaleA.png") | ForEach-Object {
  Copy-Asset "kenney_animated-characters-protagonists\Skins\$_" "kenney\animated-characters-protagonists\Skins\$_"
}

Copy-Asset "godot-store\tomality_LOOPS\LOOPS\SPINNER\Spinner LOOP 1.ogg" "music\tomality\spinner_loop_1.ogg"
Copy-Asset "godot-store\tomality_LOOPS\LOOPS\OVERTIME\Overtime LOOP 2.ogg" "music\tomality\overtime_loop_2.ogg"
Copy-ProjectDirectory "godot-store\godot-ai-plugin-4\addons\godot_ai" "addons\godot_ai"
Copy-ProjectDirectory "godot-store\Scene-Manager-1.2.0-source\Scene-Manager-1.2.0\addons\scene_manager" "addons\scene_manager"

foreach ($assetId in $ambientAssets) {
  @("Color", "NormalGL", "Roughness", "Metalness", "AmbientOcclusion") | ForEach-Object {
    Copy-AmbientMap $assetId $_
  }
}

@("Color", "NormalGL", "Roughness", "Metalness") | ForEach-Object {
  Copy-AmbientMap $floorPanelAssetId $_
}

@(
  "Astronaut.glb",
  "Mech.glb",
  "Enemy Flying.glb",
  "Enemy Small.glb",
  "Pickup Crate.glb",
  "Pickup Key Card.glb",
  "Pickup Sphere.glb",
  "Pickup Thunder.glb",
  "Round Rover.glb",
  "Rover.glb",
  "Base Large.glb",
  "Building L.glb",
  "Connector.glb",
  "Geodesic Dome.glb",
  "Metal Support.glb",
  "Ramp.glb",
  "Solar Panel.glb",
  "Roof Radar.glb",
  "Spaceship.glb"
) | ForEach-Object {
  Copy-QuaterniusModel $_
}

Copy-Asset "kenney_rtssci-fi\License.txt" "licenses\kenney_sci-fi-rts_LICENSE.txt"
Copy-Asset "SpaceShooterRedux\license.txt" "licenses\kenney_space-shooter-redux_LICENSE.txt"
Copy-Asset "kenney_interface-sounds\License.txt" "licenses\kenney_interface-sounds_LICENSE.txt"
Copy-Asset "License.txt" "licenses\kenney_modular-space-kit_LICENSE.txt"
Copy-Asset "kenney_animated-characters-protagonists\License.txt" "licenses\kenney_animated-characters-protagonists_LICENSE.txt"
Copy-Asset "godot-store\tomality_LOOPS\LOOPS\LICENSE.txt" "licenses\tomality-free-music-pack-sampler_LICENSE.txt"
Copy-Asset "godot-store\Universal_Animation_LibraryStandard\Animation Library[Standard]\License.txt" "licenses\quaternius_universal-animation-library_LICENSE.txt"
Copy-Asset "godot-store\godot-ai-plugin-4\addons\godot_ai\LICENSE" "licenses\godot-ai-plugin_LICENSE.txt"
Copy-Asset "godot-store\scene-manager_LICENSE.txt" "licenses\scene-manager_LICENSE.txt"

$licenseDir = Join-Path $assetRoot "licenses"
New-Item -ItemType Directory -Force -Path $licenseDir | Out-Null
@(
  "Quaternius Ultimate Space Kit",
  "Source: https://quaternius.com/packs/ultimatespacekit.html",
  "Mirror used by setup script: https://opengameart.org/content/ultimate-space-kit-by-quaternius",
  "License: Creative Commons CC0 1.0 Universal"
) | Set-Content -LiteralPath (Join-Path $licenseDir "quaternius_ultimate-space-kit_LICENSE.txt") -Encoding UTF8

Write-Host "Nexus Relay assets are ready in $assetRoot"

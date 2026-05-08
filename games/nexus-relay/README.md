# Nexus Relay 3D

Godot 4 source project for the adaptive 3D mission reboot.

## Run In Editor

1. Install Godot 4.x.
2. Open this folder: `games/nexus-relay`.
3. Run `scenes/main.tscn`.

## Cabinet Handoff

The Hub launches an exported executable with:

```text
--nexus-session-payload <jsonPath> --nexus-result-callback <localUrl>
```

The Godot runtime reads the Nexus launch payload, uses the `players[]` Player Passport data for names and avatar colors, and posts a signed `GameResultPayload` back to the Nexus Hub callback URL using `NEXUS_GAME_CALLBACK_SECRET`. It does not call Supabase or any database directly.

For normal development, the Hub can launch this source project directly if Godot is installed and available as `godot`.

## Assets And Generation

Runtime assets live in `assets/kenney`, `assets/quaternius`, `assets/kaykit`, `assets/ambientcg`, and `assets/music`; all copied packs are documented by `assets/manifest/nexus_relay_assets.json`. The repo keeps only the curated 3D modules, skinned operator FBX, GLB/gltf props, PBR textures, sprites, sounds, and selected music loops used by the Godot runtime; source archives are downloaded into the ignored `.runtime` folder. Floor panels use curated 2K ambientCG maps while smaller surfaces stay at 1K.

Refresh the asset set from the repo root with:

```powershell
npm run setup:nexus-relay-assets
```

The arena is procedurally seeded from the launch payload's site, cabinet, and session IDs. Generated content now uses a fixed mission route layered into the seeded arena: ordered power cells, Alpha-to-Omega override terminals, extraction anchors, station module dressing, imported 3D prop placement, PBR floor variants, energy supply caches, hazard zones, collision proxies, and sentry patrols. Player movement is camera-relative in 3D space with accelerated velocity, imported idle/run animation clips, movement glow, and a close follow camera that stays inside the arena and widens only when P2 joins.

The HUD includes a compact objective storyboard and objective toast events. It updates mission instructions for solo versus linked co-op routes without covering the center of the playfield.

## Scene Flow

The project vendors Glass Brick Scene Manager under `addons/scene_manager` and registers its `SceneManager` autoload for shader fades. Runtime flow is driven by `scripts/relay_game.gd`: attract demo, join window, mission briefing, active play, intermission, and results. The attract and intermission states run procedural camera and operator demo movement so the cabinet has motion between playable phases instead of sitting on a static menu.

## Join Flow

P1 is ready by default. P2 can press Enter during the countdown to join, or is included automatically when the Hub launches with a signed-in P2 profile. The join screen shows a centered deployment overlay with the countdown, P1/P2 readiness, and whether each joined operator is using Nexus Passport or Guest Mode. When the countdown ends, the missions switch to solo or linked co-op rules for that run.

For production cabinet launch, export the project and set:

```powershell
GODOT_NEXUS_RELAY_PATH=E:\path\to\NexusRelay.exe
```

If no export path is configured, the Hub uses the local simulator so the Player Passport flow can still be tested without Godot installed.

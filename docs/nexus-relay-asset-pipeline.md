# Nexus Relay Asset Pipeline

Nexus Relay uses a small curated CC0 asset set checked into `games/nexus-relay/assets`. The source archives stay in `.runtime/asset-downloads`, which is ignored by Git, so repo clones get only the runtime assets the Godot project actually loads.

## Sources

- Kenney Modular Space Kit: `https://kenney.nl/assets/modular-space-kit`, Creative Commons CC0. Used for the 3D station modules, corridors, gates, cables, and stairs.
- Kenney Animated Characters Protagonists: `https://kenney.nl/assets/animated-characters-protagonists`, Creative Commons CC0. Used for the skinned operator body mesh, Passport body-skin mapping, and idle/run/jump animation playback.
- Quaternius Universal Animation Library: `https://store.godotengine.org/asset/quaternius/universal-animation-library/`, Creative Commons CC0. Downloaded by setup as a reference retargeting library; the large source GLB remains in `.runtime` instead of the curated runtime folder.
- Quaternius Ultimate Space Kit: `https://quaternius.com/packs/ultimatespacekit.html`, Creative Commons CC0. Used for flying seekers, pushable cargo, mission pickups, extraction props, and station dressing GLBs.
- ambientCG PBR materials: `https://ambientcg.com/`, Creative Commons CC0. Used for higher-detail metal flooring, panel walls, prop materials, and exosuit surfaces. Floor panels use the curated 2K `MetalPlates006` maps; smaller props continue to use 1K maps to keep file sizes controlled.
- Tomality Free Music Pack Sampler: `https://store.godotengine.org/asset/tomality/tomality-s-free-music-pack-sampler/`, royalty-free for game use. Two OGG loops are copied into the runtime music folder.
- Godot AI: `https://store.godotengine.org/asset/dlight/godot-ai/`, MIT license. Installed under `games/nexus-relay/addons/godot_ai` as an optional editor utility, not as gameplay runtime code.
- Kenney Sci-Fi RTS: `https://kenney.nl/assets/sci-fi-rts`, Creative Commons CC0. Kept as a 2D fallback pool for future billboards, minimaps, and UI-facing mission art.
- Kenney Space Shooter Redux: `https://opengameart.org/content/space-shooter-redux`, Creative Commons CC0. Kept as a 2D fallback pool for future billboard FX and HUD accents.
- Kenney Interface Sounds: `https://kenney.nl/assets/interface-sounds`, Creative Commons CC0. Used for pickup, completion, damage, and hazard feedback.

Each copied pack has a local license file under `games/nexus-relay/assets/licenses` and a manifest entry in `games/nexus-relay/assets/manifest/nexus_relay_assets.json`.

## Refresh Workflow

Run this from the repo root to rebuild the curated asset folder from source archives:

```powershell
npm run setup:nexus-relay-assets
```

The script downloads missing archives into `.runtime/asset-downloads`, extracts them, then copies only the selected sprites, sound effects, and license files into the Godot project. Use `-Force` directly on the script when the local download cache should be refreshed:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-nexus-relay-assets.ps1 -Force
```

## Procedural Generation Model

`games/nexus-relay/scripts/relay_game.gd` seeds its `RandomNumberGenerator` from `siteId:cabinetId:gameSessionId`. That keeps a session deterministic while still making every cabinet session feel distinct.

Generated content currently includes:

- 3D station floor cells and low-poly prop scatter.
- Modular space-kit room, corridor, gate, cable, and stair dressing.
- Kenney skinned 3D operator bodies driven by Player Passport body and equipment IDs, plus Quaternius imported 3D seekers, pickups, pushable cargo, and large station props.
- PBR diamond-plate and metal-panel materials applied to procedural meshes and imported modules.
- Higher-resolution 2K floor panel maps with subdued normal strength, larger UV scale, and non-emissive seams so tiles read as solid metal panels instead of noisy glowing grids.
- Static collision proxy volumes for perimeter walls, large station modules, and selected procedural props.
- Power-cell, security-gate, and extraction-hold anchors.
- Supply-cache anchors that reward route awareness and keep low-energy runs recoverable.
- Hazard zones that drain player energy and team score.
- Sentry patrol homes, chase steering state, imported model variants, and colors.
- Pushable cargo props with simple floor physics for blocking, steering, and improvising around seekers.

This keeps the mission contract stable while avoiding fixed side-by-side scroller layouts. Future gameplay assets should extend the manifest first, then load through `ASSET_ROOT` constants in the Godot script.

## Adaptive Player Flow

Nexus Relay now starts with a join countdown. P1 is ready by default. P2 can join during the countdown by pressing Enter, or P2 is auto-included when the Hub payload contains a signed-in second Player Passport profile.

When the countdown expires, the gameplay route is locked for that run:

- Solo route: one operator can complete every mission, with fewer seekers, fewer hazards, and one-player extraction-hold rules.
- Linked route: two operators get extra cells, extra seekers, and an extraction hold that requires every joined player.

The result payload reports `mode: "solo"` or `mode: "co-op"` based on the joined player count, not just the cabinet's attract-screen state.

## Movement And Camera

Movement is camera-relative, accelerated, and decelerated in 3D world space. P1 uses WASD and P2 uses arrow keys, but input is converted through the active camera's forward/right vectors before velocity is applied. Solo play uses a close P1 follow camera with movement look-ahead and in-arena camera clamping so the camera does not spawn behind walls. Linked co-op widens the same camera around the midpoint so both operators stay visible without falling back to a flat overhead board.

Player movement now resolves against registered static collision proxies, imported seeker bodies, and pushable cargo props. The procedural objective spawner queries the same proxy list so cells, gate switches, hazards, sentries, and cargo avoid being placed inside walls or large station props.

## Lighting And Storyboard

The scene uses a cinematic lighting stack: filmic tonemapping, glow, SSAO, SSIL, directional key/rim lights, spotlights, and localized fill lights. Keep new lighting additions purposeful and named; repeated decorative lights should be limited because the project uses Forward Plus rendering.

The HUD includes a compact objective storyboard, transient story toast, and a centered completion banner for mission state changes. Visual bursts, screen flashes, and sound effects are tied to pickups, damage, gate triggers, and extraction so gameplay feedback matches the story beat.

## First Run

For a clean machine, use:

```powershell
npm run first-run
```

That installs Node dependencies if needed, creates `.env` from `.env.example` if missing, appends newly introduced `.env.example` keys without overwriting local values, refreshes the Nexus Relay assets, imports Godot asset metadata when Godot is available, checks for `godot` on PATH, and starts MongoDB through Docker Compose.

To start the preview services and Hub after setup:

```powershell
npm run first-run:start
```

The Hub can launch Nexus Relay from source through Godot when `godot` is on PATH. Production cabinets should still point `GODOT_NEXUS_RELAY_PATH` at an exported executable.

## Repo Rules

- Keep source archives and bulk downloads in `.runtime`, not Git.
- Keep the curated runtime files small and directly referenced by the game.
- Add or update license files when adding a new pack.
- Update `nexus_relay_assets.json` before using new assets from code.
- Run `npm run repo:large-files` before committing.

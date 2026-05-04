# Nexus Arcade Arena

Fresh scaffold for Nexus Arcade Hub and Nexus Player Passport.

## What is included

- `apps/api` - Express, MongoDB/Mongoose, Socket.IO, Player Passport APIs.
- `apps/web` - Vite React phone/profile/operator web app.
- `apps/hub` - Electron + Vite React cabinet Hub.
- `packages/shared` - integration contracts, DTO validation, XP rules, and game payload schemas (`nexus-arcade-shared`).
- `tools/game-simulator` - Godot-compatible CLI simulator for local game contract tests.
- `apps/rush-run` - first playable browser version of Rush Run using the same Player Passport launch/result contract.
- `docs` - pilot checklist and integration notes.

## Quick start

```powershell
npm install
copy .env.example .env
npm run mongo:up
npm run dev
```

The API defaults to `http://localhost:3000`, the phone/operator web app to `http://localhost:5173`, the Hub renderer to `http://localhost:5174`, and Rush Run to `http://localhost:5175`.

## Rush Run / Godot handoff

Set `GODOT_RUSH_RUN_PATH` to the exported Rush Run executable. The Hub passes:

```text
--nexus-session-payload <jsonPath> --nexus-result-callback <localUrl>
```

If no executable path is configured, service tests use `tools/game-simulator` to validate the same contract without Godot installed.

## Player Passport integration boundary

Other systems should integrate through `packages/shared` schemas and the `/api/player`, `/api/arcade`, `/api/auth`, `/oauth`, and `/api/leaderboards` APIs. Cabinet-specific behavior stays in `apps/hub`; reusable identity, avatar, progression, session, auth-client, token, and leaderboard contracts live in shared/API code.

OAuth-style endpoints:

- `GET /.well-known/oauth-authorization-server`
- `POST /api/auth/clients`
- `GET /oauth/authorize`
- `POST /oauth/token`
- `POST /oauth/introspect`

## Repository hygiene

Keep source, contracts, tests, docs, and small hand-authored assets in Git. Do not commit generated builds, runtime queues, local databases, Godot exports, installers, archives, videos, audio, or large raw art files.

Before committing:

```powershell
npm test
npm run build
git status --short
```

Large release artifacts should be attached to GitHub Releases or stored in external asset storage. If a binary asset must become part of the source tree, add a short note explaining why and keep it small enough for normal clone/pull workflows.

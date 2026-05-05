# Testing And Previews

## Fast Verification

Run these before committing routine changes:

```powershell
npm test
npm run build
npm audit --omit=dev
npm run repo:large-files
```

## Docker-backed Integration Test

Use this when MongoDB is already available on `27017`:

```powershell
npm run mongo:up
npm run test:integration
```

The integration test uses `mongodb://127.0.0.1:27017/nexus_arcade_test`, drops that database before and after the run, and exercises:

- Player Passport dev login
- OAuth client registration
- Authorization-code/PKCE token exchange
- Token introspection
- Cabinet QR pairing and P1 claim
- Nexus Relay game session start/end
- XP award and leaderboard persistence

For the full check:

```powershell
npm run verify:docker
```

`verify:docker` starts a separate Docker Compose project on host port `27018`, so it can run even if another MongoDB is already using `27017`.

## Local Preview

The normal dev stack still uses the default API port `3000`:

```powershell
npm run dev
```

If another Costley app is already using `3000`, use the preview stack instead. It starts the API on `3100` and web on `5173`:

```powershell
npm run preview
```

Then check:

- API: `http://127.0.0.1:3100/healthz`
- Player/operator web: `http://127.0.0.1:5173/`

Run the HTTP smoke check while previews are running:

```powershell
npm run preview:smoke
```

The Electron Hub can be previewed separately after the API is available. Configure `GODOT_NEXUS_RELAY_PATH` to launch a Godot export; otherwise the Hub uses the local simulator:

```powershell
npm run preview:hub
```

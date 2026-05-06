# Player Passport Integration Notes

Player Passport is the integration boundary for identity, avatar, progression, game results, and leaderboard data. External systems should not couple directly to Hub internals.

## Nexus-owned identity decision

Player Passport identity is not kiosk-local. A player must be able to walk up to any cabinet and receive the same avatar, XP, stats, rewards, and new-site bonuses, so the source of truth for login and player state must live in the Nexus platform.

The updated standard is that Nexus is the player-facing identity provider and account authority. Supabase Auth is the backing auth service for user creation, login, JWT issuance, and optional Supabase Postgres/RLS enforcement. It should not be described as an unrelated enterprise cloud identity provider in the same sense as Auth0, Okta, or an SSO rollout across many third-party applications.

The important V1 distinction is central online identity versus kiosk-local identity. Cabinets may cache display data and queue game results, but they must not store passwords, long-lived player auth tokens, or authoritative profile state.

Recommended V1 stack:

- Player login/auth: Nexus Player Passport accounts backed by [Supabase Auth](https://supabase.com/docs/guides/auth).
- Player proof of identity: Supabase Auth session JWT verified by the Nexus API.
- Passwordless phone flow: Supabase magic link or OTP, which supports email passwordless login with one-time links or codes.
- Player Passport profile/game API: Nexus Node/Express API.
- Profile, avatar, XP, stats, achievements, sessions, and leaderboards: Nexus application data in Supabase Postgres or MongoDB Atlas. If Supabase Postgres becomes the global data layer, use RLS as the database authorization guard for exposed tables.
- Cabinet runtime cache: SQLite, LevelDB, or local JSON/JSONL for resilience only.
- Enterprise SSO/OIDC: optional later integration behind Nexus account linking, not required for V1 player identity.

Deployment standard:

- Local Supabase CLI: development and testing only.
- Hosted Supabase project: preferred pilot path when we want lower R&D and managed operations.
- Self-hosted Supabase: implemented production path for Nexus-owned infrastructure when we need all identity/database services to run under our domain and server control.
- Kiosk-local database: cache and queue only; never the source of truth for account identity or cross-cabinet progression.

Startup security standard:

- `supabase/config.toml` must keep `project_id = "nexus-arcade-arena"`. Local Supabase Studio may still route through `/project/default`; that is a Studio local route, not the Nexus project identity.
- `npm run first-run` starts local Supabase, writes the Supabase env values into `.env`, and runs `npm run security:startup`.
- `npm run security:startup` validates the Supabase Auth hardening baseline, JWKS availability, and Nexus `.env` alignment without printing secrets.
- Local development keeps email confirmation disabled so the current email/password dev flow can return a session immediately.
- Staging/production validation does not depend on local `supabase status`; it validates the configured hosted or self-hosted JWKS URL directly.
- Staging/production startup validation requires Supabase-backed Nexus identity, HTTPS URLs, email confirmation, non-loopback URLs, non-development secrets, hidden dev 2FA codes, and a non-default operator PIN.
- `npm run start:secure` runs startup validation before starting the API process.
- `.env.production.example` is the production auth baseline template. It intentionally uses placeholders and must never be copied into production without real secrets and hosted/self-hosted Supabase URLs.
- `npm run selfhost:supabase:bootstrap` fetches the official Supabase Docker bundle into `deploy/self-hosted-supabase/upstream`, generates `deploy/self-hosted-supabase/.env`, and configures Nexus/Supabase URLs for the chosen domains.
- `npm run selfhost:up` starts self-hosted Supabase, Nexus API, Nexus web, MongoDB, and Caddy in one Docker Compose project.

Self-hosted domain layout:

- `https://<NEXUS_APP_DOMAIN>` - Nexus Player Passport web app and QR claim surface.
- `https://<NEXUS_API_DOMAIN>` - Nexus API, OAuth, game-session, and Passport endpoints.
- `https://<NEXUS_IDENTITY_DOMAIN>` - self-hosted Supabase Kong gateway, Auth, REST, Storage, Realtime, and Studio.

MongoDB can remain useful for application data, but MongoDB by itself is not the identity provider. MongoDB Atlas App Services auth/user management should not be used as the V1 identity backbone because App Services has reached end-of-life status and its authentication/user-management path is deprecated.

The intended architecture is:

```text
Player phone
  -> Nexus Player Passport web claim page
  -> Supabase Auth user creation/login
  -> Supabase Auth JWT + verified user id
  -> Nexus Player Passport API
  -> global profile/game database
  -> cabinet-scoped player session payload
  -> Nexus Arcade Hub on cabinet
  -> local cache + queued game results
  -> Godot games
```

## Stable contract package

Use `nexus-arcade-shared` for:

- `AvatarManifestSchema`
- `CosmeticCatalogItemSchema`
- `PlayerAvatarInventorySchema`
- `PublicPlayerSchema`
- `CabinetLoginSessionSchema`
- `GameLaunchPayloadSchema`
- `GameResultPayloadSchema`
- `CabinetHeartbeatSchema`
- `PlayerPassportIntegrationEventSchema`

The package is intentionally framework-neutral except for `nexus-arcade-shared/crypto`, which is Node-only and handles local game callback signatures.

## Public API boundaries

Primary external surfaces:

- `/api/player/*` for profile, avatar, inventory, equipment, stats, achievements, and online QR session claims.
- `/api/arcade/*` for cabinet sessions, active players, game sessions, and heartbeats.
- `/api/auth/clients` for registering Passport-consuming OAuth/auth applications during V1 development.
- `/oauth/authorize`, `/oauth/token`, and `/oauth/introspect` for authorization-code/PKCE style integrations.
- `/api/leaderboards/:gameId` for ranked score views.
- `/api/operator/passport-events` for recent integration events during pilot operations.

Cabinet screens receive only public player data: player ID, display name, avatar manifest, level, and active slot/session state. Email, phone, password, and long-lived auth tokens are not displayed or stored by the Hub.

## Game integration boundary

Games are Nexus clients, not Supabase clients. They must not import Supabase SDKs, ship Supabase publishable or anon keys, call Supabase REST/PostgREST/Realtime endpoints, or depend on Supabase RLS policies directly.

The supported game-facing paths are:

- Cabinet-launched games receive a Nexus `GameLaunchPayload` from the Hub.
- Cabinet-launched games submit signed `GameResultPayload` records to the Hub callback URL; the Hub forwards or queues them for the Nexus API.
- Browser or partner games that need profile/avatar/state access use Nexus Passport OAuth/API scopes, then call Nexus endpoints such as `GET /api/passport/me`.
- Games consume runtime avatar manifests and public session data from Nexus contracts only.

Supabase Auth JWTs are internal player proof between the Nexus web/phone surfaces and the Nexus API. Supabase Postgres/RLS, if adopted, is an internal Nexus data enforcement layer. Games should never have to know which auth or database backend Nexus uses.

## Corrected QR pairing rule

QR login is online-only in V1. The QR code contains only a short-lived cabinet pairing session ID:

```text
https://arcade.costleyentertainment.com/play/claim?session=abc123
```

The QR must never contain a player token, refresh token, or reusable auth credential. The QR can provide an all-in-one player experience by opening a Nexus claim URL where the phone can create an account, sign in through Supabase Auth, receive a JWT, and then make the authenticated Nexus API call to claim P1 or P2. The QR itself remains only a cabinet pairing pointer.

The API verifies the Supabase JWT, loads the Player Passport profile, claims P1 or P2, and sends the cabinet only a scoped display/session payload.

Online claim flow:

1. Cabinet requests a cabinet login session from Nexus API.
2. API creates a short-lived `CabinetLoginSession`.
3. Cabinet displays `/play/claim?session=<id>` as the QR.
4. Player scans the QR with their phone.
5. Phone opens the Nexus claim page.
6. Phone creates a Nexus Player Passport account or signs in through Supabase Auth.
7. Phone claims P1 or P2 against the Nexus API with the Supabase JWT.
8. API verifies the authenticated player, loads Player Passport profile/avatar/XP, and marks the session claimed.
9. Cabinet receives display name, avatar manifest, level, player slot, and cabinet-scoped session data.

## Offline rules

V1 Player Passport requires internet for new QR login. Offline mode is intentionally narrow:

- Fully online: QR login, Player Passport profile, avatar, XP, achievements, leaderboards, telemetry, score sync, and new-site rewards work normally.
- Internet drops after a player is already logged in: the current cabinet session may continue for a short grace window; the cabinet may keep avatar/display name visible, finish the game, save the result locally, mark it `pendingSync`, and upload it when online returns.
- Cabinet is offline before login: no new Nexus Player Passport login. Allow guest play, local guest score, post-game claim code/QR for later sync, and an offline-pending local leaderboard only.
- Local Wi-Fi bridge mode: deferred until a later Nexus Edge Node or edge identity design exists. It can help with setup, diagnostics, local claim pages, and future local multiplayer pairing, but it is not V1 identity.

Not allowed offline in V1:

- New Nexus Player Passport login.
- Confirmed XP awards to an online Player Passport profile.
- Global leaderboard updates.
- New-site visit rewards.
- Long-lived auth tokens stored on the cabinet.

## Supabase-backed Nexus identity mapping

Supabase Auth is the recommended backing auth service because it handles authentication, supports password, magic link, OTP, social login, SSO if needed later, and JWT-backed requests. Nexus remains the player-facing account provider and stores the application profile separately unless we move the profile model into Supabase Postgres.

If Supabase Postgres becomes the global data layer, RLS policies should use `auth.uid()` plus Nexus-owned profile/entitlement tables for authorization. Do not rely on mutable user metadata for critical authorization decisions.

```json
{
  "playerId": "nexus_player_123",
  "authProvider": "supabase",
  "authUserId": "uuid-from-supabase",
  "displayName": "NOVA_RACER",
  "avatar": {
    "avatarId": "racer_03",
    "primaryColor": "#00E5FF",
    "secondaryColor": "#FF2ED1",
    "frameId": "electric_pulse"
  },
  "xp": 1250,
  "level": 7
}
```

Cabinet cache stores only runtime display data with a short expiry:

```json
{
  "playerId": "nexus_player_123",
  "displayName": "NOVA_RACER",
  "avatar": {},
  "level": 7,
  "lastValidatedAt": "2026-05-01T19:00:00Z",
  "expiresAt": "2026-05-02T19:00:00Z"
}
```

## Local Supabase development

The repo includes a local Supabase CLI project under `supabase/`. Use it to test the Nexus-owned identity path without needing a hosted Supabase project:

```powershell
npm run supabase:setup
npm run dev:supabase
```

`npm run supabase:setup` starts the local Supabase Docker stack, reads `supabase status -o env`, and updates `.env` with:

- `IDENTITY_PROVIDER=supabase`
- `SUPABASE_PROJECT_URL=http://127.0.0.1:54321`
- `IDENTITY_ISSUER=http://127.0.0.1:54321/auth/v1`
- `IDENTITY_JWKS_URL=http://127.0.0.1:54321/auth/v1/.well-known/jwks.json`
- `VITE_IDENTITY_PROVIDER=supabase`
- `VITE_SUPABASE_URL=http://127.0.0.1:54321`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<local publishable key>`
- `VITE_SUPABASE_ANON_KEY=<local anon key fallback>`

When these values are active, the web login form uses Supabase email/password auth as the Nexus account login backend. The browser receives the Supabase session, sends the access token to `POST /api/player/auth/session`, and the Nexus API verifies the JWT through the configured JWKS URL before creating or loading the linked Player Passport profile. This is the local equivalent of the intended hosted Nexus identity flow.

## Current local auth rule

The current local `POST /api/player/dev-login` and `POST /api/player/dev-login/verify-2fa` flow is a development stand-in for Nexus account login. It creates or loads a dev profile, returns a short-lived 2FA challenge, and then returns the local player token used by QR claim, profile, OAuth authorize, and game-session flows. Production V1 should use Supabase JWT verification as the proof-of-identity path.

Operator console access uses `POST /api/operator/login` followed by `POST /api/operator/verify-2fa`. Operator sessions are required for `/api/operator/*` operational data and `/api/auth/clients` OAuth-client management. Local development can expose the 6-digit code in the response with `EXPOSE_DEV_2FA_CODES=true`; shared or production-like environments should disable that and connect an email/SMS/authenticator delivery adapter.

Operator configuration lives behind the same operator 2FA session. `GET /api/operator/config` returns the active pilot settings and `PATCH /api/operator/config` updates site defaults, Nexus identity backend settings, 2FA TTL/attempt policy, operator session length, QR session TTL, and OAuth issuer. The API keeps player 2FA, operator 2FA, and OAuth client management protection enabled regardless of configuration edits.

## Avatar service rule

The `AvatarManifestSchema` is the persisted game-facing shape. It contains stable color masks, body morphology, equipped cosmetic IDs, pose, animation set, and add-on references. Games should consume the manifest as read-only input and map supported slots to their own render layer, sprite rig, or 3D rig.

The catalog and inventory APIs separate available cosmetics from owned cosmetics:

- `GET /api/player/avatar/catalog` returns active catalog items with slot, rarity, compatibility, unlock metadata, and 2D/3D asset references.
- `GET /api/player/me/inventory` returns owned items and the current equipment map.
- `PATCH /api/player/me/equipment` equips one owned item to one slot and updates the public avatar manifest.
- `PATCH /api/player/me/avatar` updates freeform manifest fields such as color masks and avatar ID.

External OAuth/auth applications should request `passport:avatar:read` when they need the current manifest. They should not infer player inventory from cabinet session payloads.

## Game result rule

Games submit signed results to the Nexus Hub callback URL. The Hub verifies the signature, forwards the result to the Nexus API, and queues it locally when offline. The API treats `idempotencyKey` as the duplicate-protection key. Games do not write scores, XP, stats, achievements, or leaderboard rows directly to Supabase or any other database.

## OAuth/Auth application rule

External auth apps should register with Nexus, request only the scopes they need, and exchange authorization codes for short-lived Passport access tokens issued by Nexus. Supabase JWTs are the internal player proof used by Nexus; external games and partner apps should integrate through the Nexus Passport OAuth/API contract. Token consumers should call `/oauth/introspect` when they need fresh profile/avatar/session metadata instead of storing cabinet or player internals.

The V1 authorization endpoint is split into a browser consent surface and a direct API surface:

- Browser users are sent to `/oauth/authorize` on the web app. The screen shows the registered client, redirect URI, and requested Passport scopes before the player approves the request.
- The web app forwards approved requests to the API `/oauth/authorize` endpoint with the local V1 player token. The API issues a one-time authorization code and redirects to the registered callback URI.
- `GET /oauth/authorize/summary` returns the client and scope metadata used by the consent screen.

Supported scopes:

- `passport:profile:read` - display name, player ID, status, level, and profile timestamps.
- `passport:avatar:read` - versioned runtime avatar manifest for 2D and 3D renderers.
- `passport:stats:read` - per-game play counts, scores, wins, losses, and last-played timestamps.
- `passport:achievements:read` - achievement unlocks derived from game stats.
- `passport:leaderboard:read` - leaderboard entries associated with the player.
- `passport:session:write` - cabinet/session write operations for trusted arcade clients.

Access tokens can be used against `GET /api/passport/me` with `Authorization: Bearer <token>`. The response is scope-filtered, so an app with only `passport:profile:read` does not receive avatar, stats, achievements, or leaderboard data.

## Runtime avatar manifest

Games should consume `exportAvatarRuntimeManifest()` from `nexus-arcade-shared`, `launchPayload.players[].avatarRuntime`, or the `passport.avatar` object returned by the Nexus endpoint `GET /api/passport/me`. The runtime manifest is versioned as `nexus-avatar-manifest/v1` and contains:

- `colors` - primary, secondary, and accent color masks.
- `morphology` - body type, body ID, and head ID.
- `equipment` - stable cosmetic IDs for supported avatar slots.
- `animation` - pose, emote, and animation set IDs.
- `rendering` - optional 3D rig hints, including the shared animated-character rig and Godot model/skin paths used by Nexus Relay.
- `addons` - enabled add-ons only.
- `compatibility` - supported slots and render targets.

2D games can map the same equipment IDs to sprite layers; 3D games can map them to rig attachments or GLB parts. The manifest is read-only game input and should not be mutated by a game runtime.

Nexus Relay receives this same contract in `launchPayload.players[].avatarRuntime` with `target: "3d"`. The API still includes the public `player.avatar` manifest for backward compatibility, but game renderers should prefer `avatarRuntime` and fall back to `exportAvatarRuntimeManifest(player.avatar)` only when replaying older payloads.

For `nexus_relay`, Player Passport body IDs map to the Godot-ready Kenney animated-character rig:

- `body_neon_hero` and `body_android_prime` use the cyborg skin.
- `body_street_legend` and `body_guardian_frame` use the criminal skin.
- `body_runner_core` and `body_synth_athlete` use the skater skins.

The Godot runtime then layers supported equipment IDs such as helmet, visor, outfit, boots, back gear, trail, and aura onto that imported rig so the in-game operator reflects the same Player Passport profile choices.

Signed Nexus Relay results include avatar contract telemetry in each player result, which gives pilot operators a stable way to confirm which avatar manifest version, equipment IDs, and emote set were used for a submitted score.

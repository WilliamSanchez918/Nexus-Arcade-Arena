# Player Passport Integration Notes

Player Passport is the integration boundary for identity, avatar, progression, game results, and leaderboard data. External systems should not couple directly to Hub internals.

## Cloud-first identity decision

Player Passport identity is not kiosk-local. A player must be able to walk up to any cabinet and receive the same avatar, XP, stats, rewards, and new-site bonuses, so the source of truth for login must live in a managed cloud identity provider. Cabinets may cache display data and queue game results, but they must not store passwords, long-lived player auth tokens, or authoritative profile state.

Recommended V1 stack:

- Player login/auth: [Supabase Auth](https://supabase.com/docs/guides/auth) or another managed auth provider.
- Passwordless phone flow: Supabase magic link or OTP, which supports email passwordless login with one-time links or codes.
- Player Passport profile/game API: Nexus Node/Express API.
- Profile, avatar, XP, stats, achievements, sessions, and leaderboards: cloud application database, either Supabase Postgres or MongoDB Atlas.
- Cabinet runtime cache: SQLite, LevelDB, or local JSON/JSONL for resilience only.

MongoDB can remain useful for application data, but MongoDB by itself is not the identity provider. MongoDB Atlas App Services auth/user management should not be used as the V1 identity backbone because App Services has reached end-of-life status and its authentication/user-management path is deprecated.

The intended architecture is:

```text
Player phone
  -> Supabase Auth / managed cloud identity
  -> verified user id / JWT
  -> Nexus Player Passport API
  -> cloud profile/game database
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

## Corrected QR pairing rule

QR login is online-only in V1. The QR code contains only a short-lived cabinet pairing session ID:

```text
https://arcade.costleyentertainment.com/play/claim?session=abc123
```

The QR must never contain a player token, refresh token, or reusable auth credential. The phone authenticates with Supabase Auth or the configured managed provider, then calls the Nexus API with the provider-issued user proof. The API verifies that user, loads the Player Passport profile, claims P1 or P2, and sends the cabinet only a scoped display/session payload.

Online claim flow:

1. Cabinet requests a cabinet login session from Nexus API.
2. API creates a short-lived `CabinetLoginSession`.
3. Cabinet displays `/play/claim?session=<id>` as the QR.
4. Player scans the QR with their phone.
5. Phone authenticates through Supabase Auth or the configured provider.
6. Phone claims P1 or P2 against the Nexus API.
7. API verifies the authenticated player, loads Player Passport profile/avatar/XP, and marks the session claimed.
8. Cabinet receives display name, avatar manifest, level, player slot, and cabinet-scoped session data.

## Offline rules

V1 Player Passport requires internet for new QR login. Offline mode is intentionally narrow:

- Fully online: QR login, Player Passport profile, avatar, XP, achievements, leaderboards, telemetry, score sync, and new-site rewards work normally.
- Internet drops after a player is already logged in: the current cabinet session may continue for a short grace window; the cabinet may keep avatar/display name visible, finish the game, save the result locally, mark it `pendingSync`, and upload it when online returns.
- Cabinet is offline before login: no cloud Player Passport login. Allow guest play, local guest score, post-game claim code/QR for later sync, and an offline-pending local leaderboard only.
- Local Wi-Fi bridge mode: deferred until a later Nexus Edge Node or edge identity design exists. It can help with setup, diagnostics, local claim pages, and future local multiplayer pairing, but it is not V1 identity.

Not allowed offline in V1:

- New cloud profile login.
- Confirmed XP awards to a cloud profile.
- Global leaderboard updates.
- New-site visit rewards.
- Long-lived auth tokens stored on the cabinet.

## Supabase identity mapping

Supabase Auth is the recommended managed identity provider because it handles authentication and authorization, supports password, magic link, OTP, social login, SSO, and JWT-backed requests. Nexus stores the application profile separately:

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

The repo includes a local Supabase CLI project under `supabase/`. Use it to test the cloud-first identity path without needing a hosted Supabase project:

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
- `VITE_SUPABASE_ANON_KEY=<local anon key>`

When these values are active, the web login form uses Supabase email/password auth. The browser receives the Supabase session, sends the access token to `POST /api/player/auth/session`, and the Nexus API verifies the JWT through the configured JWKS URL before creating or loading the linked Player Passport profile. This is the local equivalent of the intended hosted cloud identity flow.

## Current local auth rule

The current local `POST /api/player/dev-login` and `POST /api/player/dev-login/verify-2fa` flow is a development stand-in for the managed cloud auth provider. It creates or loads a dev profile, returns a short-lived 2FA challenge, and then returns the local player token used by QR claim, profile, OAuth authorize, and game-session flows. Production V1 should replace that local player-token proof with Supabase JWT verification or another managed-provider JWT verification path.

Operator console access uses `POST /api/operator/login` followed by `POST /api/operator/verify-2fa`. Operator sessions are required for `/api/operator/*` operational data and `/api/auth/clients` OAuth-client management. Local development can expose the 6-digit code in the response with `EXPOSE_DEV_2FA_CODES=true`; shared or production-like environments should disable that and connect an email/SMS/authenticator delivery adapter.

Operator configuration lives behind the same operator 2FA session. `GET /api/operator/config` returns the active pilot settings and `PATCH /api/operator/config` updates site defaults, cloud identity provider settings, 2FA TTL/attempt policy, operator session length, QR session TTL, and OAuth issuer. The API keeps player 2FA, operator 2FA, and OAuth client management protection enabled regardless of configuration edits.

## Avatar service rule

The `AvatarManifestSchema` is the persisted game-facing shape. It contains stable color masks, body morphology, equipped cosmetic IDs, pose, animation set, and add-on references. Games should consume the manifest as read-only input and map supported slots to their own render layer, sprite rig, or 3D rig.

The catalog and inventory APIs separate available cosmetics from owned cosmetics:

- `GET /api/player/avatar/catalog` returns active catalog items with slot, rarity, compatibility, unlock metadata, and 2D/3D asset references.
- `GET /api/player/me/inventory` returns owned items and the current equipment map.
- `PATCH /api/player/me/equipment` equips one owned item to one slot and updates the public avatar manifest.
- `PATCH /api/player/me/avatar` updates freeform manifest fields such as color masks and avatar ID.

External OAuth/auth applications should request `passport:avatar:read` when they need the current manifest. They should not infer player inventory from cabinet session payloads.

## Game result rule

Games submit signed results to the Hub callback URL. The Hub verifies the signature, forwards the result to the API, and queues it locally when offline. The API treats `idempotencyKey` as the duplicate-protection key.

## OAuth/Auth application rule

External auth apps should register a client, request only the scopes they need, and exchange authorization codes for short-lived Passport access tokens. Token consumers should call `/oauth/introspect` when they need fresh profile/avatar/session metadata instead of storing cabinet or player internals.

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

Games should consume `exportAvatarRuntimeManifest()` from `nexus-arcade-shared` or the `passport.avatar` object returned by `GET /api/passport/me`. The runtime manifest is versioned as `nexus-avatar-manifest/v1` and contains:

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

# Player Passport Integration Notes

Player Passport is the integration boundary for identity, avatar, progression, game results, and leaderboard data. External systems should not couple directly to Hub internals.

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

- `/api/player/*` for profile, avatar, inventory, equipment, stats, achievements, and QR claims.
- `/api/arcade/*` for cabinet sessions, active players, game sessions, and heartbeats.
- `/api/auth/clients` for registering Passport-consuming OAuth/auth applications during V1 development.
- `/oauth/authorize`, `/oauth/token`, and `/oauth/introspect` for authorization-code/PKCE style integrations.
- `/api/leaderboards/:gameId` for ranked score views.
- `/api/operator/passport-events` for recent integration events during pilot operations.

Cabinet screens receive only public player data: player ID, display name, avatar manifest, level, and active slot/session state. Email, phone, password, and long-lived auth tokens are not displayed or stored by the Hub.

## 2FA rule

Player Passport profile login and operator login are challenge-first flows in V1. `POST /api/player/dev-login` creates or loads the dev profile and returns a short-lived 2FA challenge. `POST /api/player/dev-login/verify-2fa` consumes the challenge and returns the player token used by QR claim, profile, OAuth authorize, and game-session flows.

Operator console access uses `POST /api/operator/login` followed by `POST /api/operator/verify-2fa`. Operator sessions are required for `/api/operator/*` operational data and `/api/auth/clients` OAuth-client management. Local development can expose the 6-digit code in the response with `EXPOSE_DEV_2FA_CODES=true`; shared or production-like environments should disable that and connect an email/SMS/authenticator delivery adapter.

Operator configuration lives behind the same operator 2FA session. `GET /api/operator/config` returns the active pilot settings and `PATCH /api/operator/config` updates site defaults, 2FA TTL/attempt policy, operator session length, QR token TTL, and OAuth issuer. The API keeps player 2FA, operator 2FA, and OAuth client management protection enabled regardless of configuration edits.

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
- `addons` - enabled add-ons only.
- `compatibility` - supported slots and render targets.

2D games can map the same equipment IDs to sprite layers; 3D games can map them to rig attachments or GLB parts. The manifest is read-only game input and should not be mutated by a game runtime.

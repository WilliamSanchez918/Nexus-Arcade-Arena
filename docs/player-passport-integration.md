# Player Passport Integration Notes

Player Passport is the integration boundary for identity, avatar, progression, game results, and leaderboard data. External systems should not couple directly to Hub internals.

## Stable contract package

Use `nexus-arcade-shared` for:

- `AvatarManifestSchema`
- `PublicPlayerSchema`
- `CabinetLoginSessionSchema`
- `GameLaunchPayloadSchema`
- `GameResultPayloadSchema`
- `CabinetHeartbeatSchema`
- `PlayerPassportIntegrationEventSchema`

The package is intentionally framework-neutral except for `nexus-arcade-shared/crypto`, which is Node-only and handles local game callback signatures.

## Public API boundaries

Primary external surfaces:

- `/api/player/*` for profile, avatar, stats, achievements, and QR claims.
- `/api/arcade/*` for cabinet sessions, active players, game sessions, and heartbeats.
- `/api/auth/clients` for registering Passport-consuming OAuth/auth applications during V1 development.
- `/oauth/authorize`, `/oauth/token`, and `/oauth/introspect` for authorization-code/PKCE style integrations.
- `/api/leaderboards/:gameId` for ranked score views.
- `/api/operator/passport-events` for recent integration events during pilot operations.

Cabinet screens receive only public player data: player ID, display name, avatar manifest, level, and active slot/session state. Email, phone, password, and long-lived auth tokens are not displayed or stored by the Hub.

## Game result rule

Games submit signed results to the Hub callback URL. The Hub verifies the signature, forwards the result to the API, and queues it locally when offline. The API treats `idempotencyKey` as the duplicate-protection key.

## OAuth/Auth application rule

External auth apps should register a client, request only the scopes they need, and exchange authorization codes for short-lived Passport access tokens. Token consumers should call `/oauth/introspect` when they need fresh profile/avatar/session metadata instead of storing cabinet or player internals.

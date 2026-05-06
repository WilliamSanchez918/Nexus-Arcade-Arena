# Pilot Acceptance Checklist

## Cabinet startup

- Cabinet boots directly to Nexus Arcade Hub in portrait orientation.
- Attract mode shows QR login, guest readiness, and Nexus Relay launch.
- Operator menu opens without leaving kiosk flow.
- First-run startup stands up local Supabase before Nexus apps.
- Startup security validation passes and confirms Supabase project ID, auth hardening, JWKS, and `.env` alignment.
- Non-local API startup refuses insecure auth config: local-dev provider, loopback URLs, non-HTTPS identity URLs, default secrets, exposed dev 2FA codes, or default operator PIN.
- Production launch uses `npm run start:secure` or an equivalent entrypoint that runs startup security validation first.
- Self-hosted production bootstrap creates `deploy/self-hosted-supabase/.env` from the official Supabase Docker bundle without committing secrets.
- Production Compose starts self-hosted Supabase, Nexus API, Nexus web, MongoDB, and Caddy in the same project.

## Player Passport

- Phone can create/load a dev Player Passport.
- QR code uses `/play/claim?session=<sessionId>` and does not contain a player token, refresh token, or reusable credential.
- QR session expires and cannot be reused after claim.
- New QR Player Passport login requires online access to the Nexus identity/API path.
- Player can claim P1 or P2.
- Cabinet shows only display name, avatar, level, and slot.
- Email/phone/password are never shown on the public cabinet display.
- Cabinet does not store passwords or long-lived player auth tokens.

## Nexus Relay Contract

- Hub starts a `GameSession` before launch.
- Hub writes the normalized launch payload to JSON.
- Hub launches the configured Godot export with payload and callback arguments.
- Game returns a signed result with idempotency key, nonce, scores, telemetry, and duration.
- Nexus API persists result, XP, stats, achievements, and leaderboard entries.
- Games do not call Supabase directly or ship Supabase client keys.
- Automated tests fail if game runtime code imports Supabase or calls Supabase REST/Auth/Realtime endpoints.

## Offline and operations

- If internet drops after a player is already logged in, the active session can continue for a limited grace window and the result is marked `pendingSync`.
- If the cabinet is offline before login, only guest play is available; no new Nexus Player Passport login is shown as available.
- Offline guest scores can be saved locally and exposed with a post-game claim code/QR for later sync.
- Signed game results are appended to the local JSONL queue when sync fails.
- Operator can flush the queue after network recovery.
- Operator can reset P1/P2 slots.
- Heartbeats include cabinet ID, site ID, app state, version, and uptime.
- Remote operator view shows cabinet state and recent Player Passport integration events.
- Local leaderboards clearly mark offline-pending entries until the cloud sync confirms them.

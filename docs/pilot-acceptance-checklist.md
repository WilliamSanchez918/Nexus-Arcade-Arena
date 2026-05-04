# Pilot Acceptance Checklist

## Cabinet startup

- Cabinet boots directly to Nexus Arcade Hub in portrait orientation.
- Attract mode shows QR login, guest readiness, and Rush Run launch.
- Operator menu opens without leaving kiosk flow.

## Player Passport

- Phone can create/load a dev Player Passport.
- QR login token expires and cannot be reused after claim.
- Player can claim P1 or P2.
- Cabinet shows only display name, avatar, level, and slot.
- Email/phone/password are never shown on the public cabinet display.

## Rush Run contract

- Hub starts a `GameSession` before launch.
- Hub writes the normalized launch payload to JSON.
- Hub launches the configured Godot export with payload and callback arguments.
- Game returns a signed result with idempotency key, nonce, scores, telemetry, and duration.
- API persists result, XP, stats, achievements, and leaderboard entries.

## Offline and operations

- Guest play remains available if API is unavailable.
- Signed game results are appended to the local JSONL queue when sync fails.
- Operator can flush the queue after network recovery.
- Operator can reset P1/P2 slots.
- Heartbeats include cabinet ID, site ID, app state, version, and uptime.
- Remote operator view shows cabinet state and recent Player Passport integration events.

# Production Auth Readiness

Nexus is the player-facing identity provider. Supabase Auth is the backing service for account creation, login, JWT issuance, and optional Supabase Postgres/RLS enforcement.

## Required Production Posture

- Use hosted Supabase or a hardened self-hosted Supabase deployment, not the local Supabase CLI stack.
- For Nexus-owned infrastructure, use `npm run selfhost:supabase:bootstrap` to materialize the official Supabase Docker bundle and generate `deploy/self-hosted-supabase/.env`.
- Run the self-hosted Supabase stack, Nexus API, Nexus web app, MongoDB, and Caddy in the same Docker Compose project with `npm run selfhost:up`.
- Keep games behind Nexus. Games must not use Supabase keys, SDKs, REST, Realtime, or RLS directly.
- Use HTTPS for `APP_BASE_URL`, `API_BASE_URL`, `SUPABASE_PROJECT_URL`, `IDENTITY_ISSUER`, `IDENTITY_JWKS_URL`, `VITE_SUPABASE_URL`, and `OAUTH_ISSUER`.
- Require email confirmation outside local development.
- Keep anonymous sign-ins disabled.
- Keep refresh-token rotation enabled.
- Require passwords with lower/upper/digit/symbol and at least 8 characters.
- Use real non-development values for `GAME_CALLBACK_SECRET`, `PASSPORT_TOKEN_SECRET`, and `OPERATOR_PIN`.
- Set `EXPOSE_DEV_2FA_CODES=false`.
- Do not expose Supabase Studio publicly unless it is behind the chosen production access controls.
- For self-hosted Supabase, DNS for the app, API, and identity domains must point to the Docker host before Caddy can issue TLS certificates.
- For self-hosted Supabase production auth, configure real SMTP. The generated local mail container is not acceptable for live player accounts.

## Repo Controls

- `npm run security:startup` validates Supabase config, Nexus env alignment, JWKS availability, and production auth hardening.
- `npm run selfhost:supabase:bootstrap` fetches the official Supabase Docker deployment files into an ignored `upstream` directory and writes a generated, ignored self-hosted `.env`.
- `npm run selfhost:up` starts Supabase and Nexus services together under the production Compose file.
- `npm run selfhost:validate` validates the generated self-hosted env and reachable Auth JWKS after DNS/TLS is live.
- `npm run start:secure` runs validation before starting the API.
- The API process also runs a runtime security guard and refuses non-local startup when auth is not production-ready.
- `.env.production.example` documents the required production variables without committing real secrets.

## Intentional Local Difference

Local development keeps email confirmation disabled so developers can create test users and immediately receive a Supabase session. This is allowed only when `DEPLOYMENT_ENVIRONMENT=local`.

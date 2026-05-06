# Self-Hosted Supabase Deployment

This directory is the production self-host path for Nexus Arcade Arena.

Nexus remains the player-facing identity provider. Supabase Auth is self-hosted inside the same Docker Compose project and exposed through the Nexus-owned identity domain.

## One-Time Bootstrap

```powershell
npm run selfhost:supabase:bootstrap -- `
  -Domain arcade.costleyentertainment.com `
  -ApiDomain api.arcade.costleyentertainment.com `
  -IdentityDomain identity.arcade.costleyentertainment.com `
  -Email admin@costleyentertainment.com
```

The bootstrapper copies the official Supabase Docker bundle into `deploy/self-hosted-supabase/upstream`, creates `deploy/self-hosted-supabase/.env`, generates Supabase/Nexus secrets, and configures public URLs for your domains.

The generated `.env` is intentionally ignored by Git.

## Start Production Stack

```powershell
npm run selfhost:up
```

This starts the official Supabase Docker services plus:

- `nexus-api`
- `nexus-web`
- `nexus-mongo`
- `nexus-caddy`

Caddy exposes:

- `https://<NEXUS_APP_DOMAIN>` -> Nexus Player Passport web app
- `https://<NEXUS_API_DOMAIN>` -> Nexus API
- `https://<NEXUS_IDENTITY_DOMAIN>` -> self-hosted Supabase Kong gateway and Studio

## Security Expectations

- DNS for all three domains must point to the Docker host before Caddy can issue certificates.
- Do not expose Supabase Studio without the generated dashboard password and your production network controls.
- Use a real SMTP provider before enabling production player email confirmation.
- Keep the generated `.env` in a secrets manager or protected deploy host, not in Git.
- Run `npm run selfhost:validate` after DNS/TLS and the Supabase gateway are reachable.

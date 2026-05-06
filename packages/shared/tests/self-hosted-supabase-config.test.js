import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSelfHostedEnv } from '../../../scripts/generate-self-hosted-supabase-env.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('self-hosted production compose wires Nexus services to Supabase Kong', async () => {
  const compose = await readFile(path.join(repoRoot, 'docker-compose.production.yml'), 'utf8');
  const caddyfile = await readFile(path.join(repoRoot, 'deploy/self-hosted-supabase/Caddyfile'), 'utf8');

  assert.match(compose, /nexus-api:/);
  assert.match(compose, /nexus-web:/);
  assert.match(compose, /nexus-mongo:/);
  assert.match(compose, /nexus-caddy:/);
  assert.match(compose, /SUPABASE_DEPLOYMENT_MODE:\s+self-hosted/);
  assert.match(compose, /https:\/\/\$\{NEXUS_IDENTITY_DOMAIN\}\/auth\/v1/);
  assert.match(caddyfile, /reverse_proxy kong:8000/);
  assert.match(caddyfile, /reverse_proxy nexus-api:3000/);
  assert.match(caddyfile, /reverse_proxy nexus-web:80/);
});

test('self-hosted Supabase env generator creates Nexus domain auth settings', () => {
  const envText = buildSelfHostedEnv({
    templateContent: [
      'POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password',
      'JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long',
      'ANON_KEY=',
      'SERVICE_ROLE_KEY=',
      'SUPABASE_PUBLISHABLE_KEY=',
      'SUPABASE_SECRET_KEY=',
      'JWT_KEYS=',
      'JWT_JWKS=',
      'DASHBOARD_PASSWORD=this_password_is_insecure_and_should_be_updated',
      'SUPABASE_PUBLIC_URL=http://localhost:8000',
      'API_EXTERNAL_URL=http://localhost:8000',
      'SITE_URL=http://localhost:3000'
    ].join('\n'),
    domain: 'arcade.example.test',
    apiDomain: 'api.arcade.example.test',
    identityDomain: 'identity.arcade.example.test',
    email: 'admin@example.test'
  });

  const values = Object.fromEntries(envText.trim().split(/\n/).map((line) => {
    const index = line.indexOf('=');
    return [line.slice(0, index), line.slice(index + 1)];
  }));

  assert.equal(values.SUPABASE_DEPLOYMENT_MODE, 'self-hosted');
  assert.equal(values.SUPABASE_PUBLIC_URL, 'https://identity.arcade.example.test');
  assert.equal(values.API_EXTERNAL_URL, 'https://identity.arcade.example.test');
  assert.equal(values.SITE_URL, 'https://arcade.example.test');
  assert.equal(values.API_BASE_URL, 'https://api.arcade.example.test');
  assert.equal(values.IDENTITY_JWKS_URL, 'https://identity.arcade.example.test/auth/v1/.well-known/jwks.json');
  assert.match(values.SUPABASE_PUBLISHABLE_KEY, /^sb_publishable_/);
  assert.match(values.SUPABASE_SECRET_KEY, /^sb_secret_/);
  assert.equal(JSON.parse(values.JWT_JWKS).keys.length, 2);
  assert.equal(values.ENABLE_EMAIL_AUTOCONFIRM, 'false');
  assert.equal(values.ENABLE_ANONYMOUS_USERS, 'false');
  assert.doesNotMatch(values.POSTGRES_PASSWORD, /your-super-secret/);
});

import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { connectDb, disconnectDb } from '../db.js';
import { sha256Base64Url } from '../services/tokenService.js';
import { signGameResult } from '../../../../packages/shared/src/crypto.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexus_arcade_test';
let server;
let baseUrl;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    ...options,
    headers: {
      'content-type': 'application/json',
      ...options.headers
    }
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

before(async () => {
  await connectDb(mongoUri);
  await mongoose.connection.dropDatabase();
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await disconnectDb();
  await new Promise((resolve) => server.close(resolve));
});

test('Player Passport pilot flow works against Mongo', async () => {
  const login = await request('/api/player/dev-login', {
    method: 'POST',
    body: JSON.stringify({ displayName: 'Preview Pilot', email: 'pilot@example.test' })
  });
  assert.equal(login.response.status, 201);
  const playerId = login.body.playerToken;
  assert.ok(playerId);

  const catalog = await request('/api/player/avatar/catalog');
  assert.equal(catalog.response.status, 200);
  assert.ok(catalog.body.items.some((item) => item.cosmeticId === 'back_boost_pack'));

  const inventory = await request('/api/player/me/inventory', {
    headers: { 'x-player-id': playerId }
  });
  assert.equal(inventory.response.status, 200);
  assert.equal(inventory.body.inventory.equipped.body, 'body_runner_core');
  assert.equal(inventory.body.inventory.equipped.trail, 'trail_neon');

  const lockedEquip = await request('/api/player/me/equipment', {
    method: 'PATCH',
    headers: { 'x-player-id': playerId },
    body: JSON.stringify({ slot: 'back', cosmeticId: 'back_boost_pack' })
  });
  assert.equal(lockedEquip.response.status, 403);

  const starterEquip = await request('/api/player/me/equipment', {
    method: 'PATCH',
    headers: { 'x-player-id': playerId },
    body: JSON.stringify({ slot: 'visor', cosmeticId: 'visor_clear' })
  });
  assert.equal(starterEquip.response.status, 200);
  assert.equal(starterEquip.body.player.avatar.visorId, 'visor_clear');

  const client = await request('/api/auth/clients', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Preview Auth App',
      redirectUris: ['http://localhost:9999/callback'],
      allowedScopes: ['passport:profile:read', 'passport:avatar:read', 'passport:stats:read'],
      type: 'public'
    })
  });
  assert.equal(client.response.status, 201);
  const clientId = client.body.client.clientId;
  const codeVerifier = 'preview-pkce-verifier-12345678901234567890';
  const authorizeUrl = new URL('/oauth/authorize', baseUrl);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', 'http://localhost:9999/callback');
  authorizeUrl.searchParams.set('scope', 'passport:profile:read passport:avatar:read');
  authorizeUrl.searchParams.set('code_challenge', sha256Base64Url(codeVerifier));
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('player_token', playerId);
  const authorizeResponse = await fetch(authorizeUrl, { redirect: 'manual' });
  assert.equal(authorizeResponse.status, 302);
  const redirect = new URL(authorizeResponse.headers.get('location'));
  const code = redirect.searchParams.get('code');
  assert.ok(code);

  const token = await request('/oauth/token', {
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'http://localhost:9999/callback',
      client_id: clientId,
      code_verifier: codeVerifier
    })
  });
  assert.equal(token.response.status, 200);
  assert.equal(token.body.passport_profile.displayName, 'Preview Pilot');
  assert.equal(token.body.token_type, 'Bearer');

  const introspection = await request('/oauth/introspect', {
    method: 'POST',
    body: JSON.stringify({ token: token.body.access_token })
  });
  assert.equal(introspection.body.active, true);
  assert.equal(introspection.body.sub, playerId);

  const pairing = await request('/api/arcade/cabinet-login', {
    method: 'POST',
    body: JSON.stringify({ cabinetId: 'PREVIEW-CAB', siteId: 'HQ', desiredSlot: 'P1' })
  });
  assert.equal(pairing.response.status, 201, JSON.stringify(pairing.body));
  const pairingToken = new URL(pairing.body.qrUrl).searchParams.get('token');
  const claim = await request('/api/player/claim-cabinet-session', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: pairing.body.sessionId,
      token: pairingToken,
      playerId,
      desiredSlot: 'P1'
    })
  });
  assert.equal(claim.response.status, 200);
  assert.equal(claim.body.playerSlot, 'P1');

  const start = await request('/api/arcade/game-session/start', {
    method: 'POST',
    body: JSON.stringify({
      cabinetId: 'PREVIEW-CAB',
      siteId: 'HQ',
      gameId: 'rush_run',
      mode: 'solo',
      players: [{ slot: 'P1', playerId }]
    })
  });
  assert.equal(start.response.status, 201);

  const startedAt = new Date(Date.now() - 45_000).toISOString();
  const endedAt = new Date().toISOString();
  const unsignedResult = {
    idempotencyKey: 'preview-integration-result-0001',
    cabinetId: 'PREVIEW-CAB',
    siteId: 'HQ',
    gameId: 'rush_run',
    gameSessionId: start.body.gameSessionId,
    mode: 'solo',
    startedAt,
    endedAt,
    durationSeconds: 45,
    players: [{ slot: 'P1', playerId, displayName: 'Preview Pilot', score: 4800, result: 'win', telemetry: { boosts: 4 } }],
    telemetry: { source: 'integration-test' },
    nonce: 'preview-nonce-0001'
  };
  const end = await request('/api/arcade/game-session/end', {
    method: 'POST',
    body: JSON.stringify({
      ...unsignedResult,
      signature: signGameResult(unsignedResult, process.env.GAME_CALLBACK_SECRET || 'local-dev-game-callback-secret')
    })
  });
  assert.equal(end.response.status, 200);
  assert.equal(end.body.awards[0].playerId, playerId);
  assert.ok(end.body.awards[0].xpAwarded > 0);

  const leaderboard = await request('/api/leaderboards/rush_run?scope=global&limit=5');
  assert.equal(leaderboard.response.status, 200);
  assert.equal(leaderboard.body.entries[0].displayName, 'Preview Pilot');
  assert.equal(leaderboard.body.entries[0].score, 4800);
});

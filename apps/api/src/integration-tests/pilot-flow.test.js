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
  assert.equal(login.response.status, 202);
  assert.equal(login.body.requiresTwoFactor, true);
  assert.ok(login.body.challengeId);

  const verifiedLogin = await request('/api/player/dev-login/verify-2fa', {
    method: 'POST',
    body: JSON.stringify({ challengeId: login.body.challengeId, code: login.body.devCode })
  });
  assert.equal(verifiedLogin.response.status, 200);
  const playerId = verifiedLogin.body.playerToken;
  assert.ok(playerId);

  const operatorBlocked = await request('/api/operator/cabinets');
  assert.equal(operatorBlocked.response.status, 401);

  const operatorStart = await request('/api/operator/login', {
    method: 'POST',
    body: JSON.stringify({ operatorId: 'operator', pin: '000000' })
  });
  assert.equal(operatorStart.response.status, 202);
  const operatorVerify = await request('/api/operator/verify-2fa', {
    method: 'POST',
    body: JSON.stringify({ challengeId: operatorStart.body.challengeId, code: operatorStart.body.devCode })
  });
  assert.equal(operatorVerify.response.status, 200);
  const operatorHeaders = { 'x-operator-token': operatorVerify.body.operatorToken };

  const currentConfig = await request('/api/operator/config', { headers: operatorHeaders });
  assert.equal(currentConfig.response.status, 200);
  assert.equal(currentConfig.body.config.security.playerTwoFactorRequired, true);

  const updatedConfig = await request('/api/operator/config', {
    method: 'PATCH',
    headers: operatorHeaders,
    body: JSON.stringify({
      security: { twoFactorTtlSeconds: 120, twoFactorMaxAttempts: 3 },
      qr: { qrTokenTtlSeconds: 120 },
      general: { appBaseUrl: baseUrl }
    })
  });
  assert.equal(updatedConfig.response.status, 200);
  assert.equal(updatedConfig.body.config.security.operatorTwoFactorRequired, true);
  assert.equal(updatedConfig.body.config.security.twoFactorMaxAttempts, 3);

  const catalog = await request('/api/player/avatar/catalog');
  assert.equal(catalog.response.status, 200);
  assert.ok(catalog.body.items.some((item) => item.cosmeticId === 'back_boost_pack'));

  const inventory = await request('/api/player/me/inventory', {
    headers: { 'x-player-id': playerId }
  });
  assert.equal(inventory.response.status, 200);
  assert.equal(inventory.body.inventory.equipped.body, 'body_neon_hero');
  assert.equal(inventory.body.inventory.equipped.hair, 'hair_glowhawk');
  assert.equal(inventory.body.inventory.equipped.boots, 'boots_grid_runners');
  assert.equal(inventory.body.inventory.equipped.trail, 'trail_neon');

  const lockedEquip = await request('/api/player/me/equipment', {
    method: 'PATCH',
    headers: { 'x-player-id': playerId },
    body: JSON.stringify({ slot: 'helmet', cosmeticId: 'helmet_champion_crown' })
  });
  assert.equal(lockedEquip.response.status, 403);

  const bodyEquip = await request('/api/player/me/equipment', {
    method: 'PATCH',
    headers: { 'x-player-id': playerId },
    body: JSON.stringify({ slot: 'body', cosmeticId: 'body_street_legend' })
  });
  assert.equal(bodyEquip.response.status, 200);
  assert.equal(bodyEquip.body.player.avatar.bodyId, 'body_street_legend');
  assert.equal(bodyEquip.body.player.avatar.bodyType, 'street');

  const bootsEquip = await request('/api/player/me/equipment', {
    method: 'PATCH',
    headers: { 'x-player-id': playerId },
    body: JSON.stringify({ slot: 'boots', cosmeticId: 'boots_combat_neon' })
  });
  assert.equal(bootsEquip.response.status, 200);
  assert.equal(bootsEquip.body.player.avatar.bootsId, 'boots_combat_neon');

  const starterEquip = await request('/api/player/me/equipment', {
    method: 'PATCH',
    headers: { 'x-player-id': playerId },
    body: JSON.stringify({ slot: 'visor', cosmeticId: 'visor_clear' })
  });
  assert.equal(starterEquip.response.status, 200);
  assert.equal(starterEquip.body.player.avatar.visorId, 'visor_clear');

  const client = await request('/api/auth/clients', {
    method: 'POST',
    headers: operatorHeaders,
    body: JSON.stringify({
      name: 'Preview Auth App',
      redirectUris: ['http://localhost:9999/callback'],
      allowedScopes: [
        'passport:profile:read',
        'passport:avatar:read',
        'passport:stats:read',
        'passport:achievements:read',
        'passport:leaderboard:read'
      ],
      type: 'public'
    })
  });
  assert.equal(client.response.status, 201);
  const clientId = client.body.client.clientId;
  const summaryUrl = new URL('/oauth/authorize/summary', baseUrl);
  summaryUrl.searchParams.set('response_type', 'code');
  summaryUrl.searchParams.set('client_id', clientId);
  summaryUrl.searchParams.set('redirect_uri', 'http://localhost:9999/callback');
  summaryUrl.searchParams.set('scope', 'passport:profile:read passport:avatar:read passport:leaderboard:read');
  const authorizeSummary = await request(`${summaryUrl.pathname}${summaryUrl.search}`);
  assert.equal(authorizeSummary.response.status, 200);
  assert.equal(authorizeSummary.body.client.name, 'Preview Auth App');
  assert.deepEqual(authorizeSummary.body.requestedScopes.map((scope) => scope.scope), [
    'passport:profile:read',
    'passport:avatar:read',
    'passport:leaderboard:read'
  ]);

  const codeVerifier = 'preview-pkce-verifier-12345678901234567890';
  const authorizeUrl = new URL('/oauth/authorize', baseUrl);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', 'http://localhost:9999/callback');
  authorizeUrl.searchParams.set('scope', 'passport:profile:read passport:avatar:read passport:stats:read passport:achievements:read passport:leaderboard:read');
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
  assert.equal(token.body.passport.profile.displayName, 'Preview Pilot');
  assert.equal(token.body.passport.avatar.manifestVersion, 'nexus-avatar-manifest/v1');
  assert.equal(token.body.token_type, 'Bearer');

  const introspection = await request('/oauth/introspect', {
    method: 'POST',
    body: JSON.stringify({ token: token.body.access_token })
  });
  assert.equal(introspection.body.active, true);
  assert.equal(introspection.body.sub, playerId);
  assert.equal(introspection.body.passport.profile.playerId, playerId);

  const profileOnlyAuthorizeUrl = new URL('/oauth/authorize', baseUrl);
  profileOnlyAuthorizeUrl.searchParams.set('response_type', 'code');
  profileOnlyAuthorizeUrl.searchParams.set('client_id', clientId);
  profileOnlyAuthorizeUrl.searchParams.set('redirect_uri', 'http://localhost:9999/callback');
  profileOnlyAuthorizeUrl.searchParams.set('scope', 'passport:profile:read');
  profileOnlyAuthorizeUrl.searchParams.set('player_token', playerId);
  const profileOnlyAuthorizeResponse = await fetch(profileOnlyAuthorizeUrl, { redirect: 'manual' });
  assert.equal(profileOnlyAuthorizeResponse.status, 302);
  const profileOnlyCode = new URL(profileOnlyAuthorizeResponse.headers.get('location')).searchParams.get('code');
  const profileOnlyToken = await request('/oauth/token', {
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: profileOnlyCode,
      redirect_uri: 'http://localhost:9999/callback',
      client_id: clientId
    })
  });
  const profileOnlyPassport = await request('/api/passport/me', {
    headers: { authorization: `Bearer ${profileOnlyToken.body.access_token}` }
  });
  assert.equal(profileOnlyPassport.response.status, 200);
  assert.equal(profileOnlyPassport.body.profile.displayName, 'Preview Pilot');
  assert.equal(Object.hasOwn(profileOnlyPassport.body, 'avatar'), false);
  assert.equal(Object.hasOwn(profileOnlyPassport.body, 'stats'), false);

  const pairing = await request('/api/arcade/cabinet-login', {
    method: 'POST',
    body: JSON.stringify({ cabinetId: 'PREVIEW-CAB', siteId: 'HQ', desiredSlot: 'P1' })
  });
  assert.equal(pairing.response.status, 201, JSON.stringify(pairing.body));
  const pairingTtlSeconds = (Date.parse(pairing.body.expiresAt) - Date.now()) / 1000;
  assert.ok(pairingTtlSeconds <= 125);
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
  assert.equal(start.body.launchPayload.players[0].avatarRuntime.manifestVersion, 'nexus-avatar-manifest/v1');
  assert.equal(start.body.launchPayload.players[0].avatarRuntime.equipment.body, 'body_street_legend');

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

  const passportResource = await request('/api/passport/me', {
    headers: { authorization: `Bearer ${token.body.access_token}` }
  });
  assert.equal(passportResource.response.status, 200);
  assert.equal(passportResource.body.avatar.equipment.body, 'body_street_legend');
  assert.equal(passportResource.body.stats[0].gameId, 'rush_run');
  assert.equal(passportResource.body.stats[0].bestScore, 4800);
  assert.equal(passportResource.body.leaderboards[0].score, 4800);
});

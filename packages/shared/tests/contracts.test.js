import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AvatarManifestSchema,
  CabinetLoginSessionSchema,
  GameLaunchPayloadSchema,
  GameResultPayloadSchema,
  guestPlayer,
  levelFromXp,
  normalizeDisplayName,
  OAuthAuthorizeRequestSchema,
  PassportAuthClientSchema,
  PlayerPassportIntegrationEventSchema,
  TwoFactorChallengeResponseSchema
} from '../src/index.js';
import { signGameResult, verifyGameResultSignature } from '../src/crypto.js';

test('avatar manifests provide V1 defaults', () => {
  const avatar = AvatarManifestSchema.parse({});
  assert.equal(avatar.avatarId, 'default_neon_01');
  assert.equal(avatar.primaryColor, '#00E5FF');
  assert.equal(avatar.bodyId, 'body_neon_hero');
  assert.equal(avatar.hairId, 'hair_glowhawk');
  assert.equal(avatar.bootsId, 'boots_grid_runners');
  assert.equal(avatar.trailId, 'trail_neon');
  assert.equal(avatar.emoteId, 'emote_wave');
  assert.equal(avatar.addons.length, 0);
});

test('game launch payload validates the Godot handoff contract', () => {
  const payload = GameLaunchPayloadSchema.parse({
    cabinetId: 'NEXUS-CAB-001',
    siteId: 'COSTLEY-HQ',
    gameId: 'nexus_relay',
    gameSessionId: 'session-1',
    mode: 'versus',
    issuedAt: new Date().toISOString(),
    players: [guestPlayer('P1')]
  });

  assert.equal(payload.players[0].displayName, 'GUEST');
  assert.equal(payload.players[0].avatarRuntime.manifestVersion, 'nexus-avatar-manifest/v1');
  assert.equal(payload.players[0].avatarRuntime.target, '2d');
});

test('cabinet login sessions can include QR deployment warnings', () => {
  const session = CabinetLoginSessionSchema.parse({
    sessionId: 'session-1',
    cabinetId: 'NEXUS-CAB-001',
    siteId: 'COSTLEY-HQ',
    status: 'pending',
    desiredSlot: 'auto',
    expiresAt: new Date().toISOString(),
    qrUrl: 'https://arcade.costleyentertainment.com/play/claim?session=session-1',
    qrWarnings: ['Loopback URL']
  });

  assert.equal(session.qrWarnings.length, 1);
  assert.equal(session.requiresOnlineIdentity, true);
  assert.equal(new URL(session.qrUrl).searchParams.has('token'), false);
});

test('game result signature is stable and excludes the signature field', () => {
  const payload = GameResultPayloadSchema.parse({
    idempotencyKey: 'idem-123456',
    cabinetId: 'NEXUS-CAB-001',
    siteId: 'COSTLEY-HQ',
    gameId: 'nexus_relay',
    gameSessionId: 'session-1',
    mode: 'solo',
    startedAt: new Date(Date.now() - 1000).toISOString(),
    endedAt: new Date().toISOString(),
    durationSeconds: 1,
    players: [{ slot: 'P1', playerId: 'guest', score: 1200 }],
    telemetry: { boosts: 2 },
    nonce: 'nonce-123456'
  });

  const signature = signGameResult(payload, 'secret');
  assert.equal(verifyGameResultSignature({ ...payload, signature }, 'secret'), true);
});

test('passport integration events are explicit contract messages', () => {
  const event = PlayerPassportIntegrationEventSchema.parse({
    type: 'player.game.completed',
    occurredAt: new Date().toISOString(),
    playerId: 'player-1',
    payload: { score: 100 }
  });

  assert.equal(event.type, 'player.game.completed');
});

test('display name normalization and level math are deterministic', () => {
  assert.equal(normalizeDisplayName('  Nova    Racer  '), 'Nova Racer');
  assert.equal(levelFromXp(0), 1);
  assert.equal(levelFromXp(900), 4);
});

test('Passport OAuth client and authorize requests validate integration boundaries', () => {
  const client = PassportAuthClientSchema.parse({
    clientId: 'client_demo_123',
    name: 'Demo Auth App',
    redirectUris: ['https://auth.example.test/callback'],
    allowedScopes: ['passport:profile:read', 'passport:avatar:read'],
    type: 'public'
  });
  const request = OAuthAuthorizeRequestSchema.parse({
    response_type: 'code',
    client_id: client.clientId,
    redirect_uri: client.redirectUris[0],
    scope: 'passport:profile:read passport:avatar:read',
    code_challenge: 'abcdefghijklmnopqrstuvwxyz1234567890',
    code_challenge_method: 'S256'
  });

  assert.equal(request.client_id, client.clientId);
});

test('2FA challenge responses expose delivery without issuing a login token', () => {
  const challenge = TwoFactorChallengeResponseSchema.parse({
    requiresTwoFactor: true,
    challengeId: 'mfa_demo_challenge_123',
    purpose: 'player_login',
    delivery: { type: 'local', destination: 'local dev challenge' },
    expiresAt: new Date().toISOString(),
    devCode: '123456'
  });

  assert.equal(challenge.requiresTwoFactor, true);
  assert.equal(challenge.devCode, '123456');
});

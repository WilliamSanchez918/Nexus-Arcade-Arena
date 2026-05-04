import test from 'node:test';
import assert from 'node:assert/strict';
import { hashToken, safeEqualHash, generatePairingCode } from '../services/tokenService.js';
import { createApp } from '../app.js';
import {
  normalizeScopes,
  verifyPassportAccessTokenClaims,
  verifyPkce,
  signPassportAccessTokenClaims
} from '../services/oauthService.js';
import {
  avatarCatalogItems,
  defaultEquippedFromAvatar
} from '../services/avatarCatalogService.js';
import {
  generateTwoFactorCode,
  maskDestination
} from '../services/twoFactorService.js';
import { defaultOperatorConfig } from '../services/operatorConfigService.js';

test('token hashes compare safely', () => {
  const hash = hashToken('abc', 'pepper');
  assert.equal(safeEqualHash(hash, hashToken('abc', 'pepper')), true);
  assert.equal(safeEqualHash(hash, hashToken('def', 'pepper')), false);
});

test('pairing codes avoid ambiguous characters and use requested length', () => {
  const code = generatePairingCode(8);
  assert.equal(code.length, 8);
  assert.equal(/[IO10]/.test(code), false);
});

test('app exposes health route without database coupling', async () => {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/healthz`);
  server.close();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test('OAuth scope and PKCE helpers are deterministic', () => {
  assert.deepEqual(normalizeScopes('passport:profile:read passport:avatar:read passport:profile:read'), [
    'passport:profile:read',
    'passport:avatar:read'
  ]);
  assert.equal(verifyPkce({ verifier: 'abc', challenge: 'abc', method: 'plain' }), true);
});

test('Passport access token claims are HMAC signed', () => {
  const token = signPassportAccessTokenClaims({
    iss: 'test',
    sub: 'player-1',
    aud: 'client-1',
    scope: 'passport:profile:read',
    exp: Math.floor(Date.now() / 1000) + 60
  });
  const claims = verifyPassportAccessTokenClaims(token);
  assert.equal(claims.sub, 'player-1');
});

test('avatar catalog exposes starter equipment for game-safe manifests', () => {
  const equipped = defaultEquippedFromAvatar();
  const catalogIds = new Set(avatarCatalogItems.map((item) => item.cosmeticId));

  assert.equal(equipped.body, 'body_neon_hero');
  assert.equal(equipped.hair, 'hair_glowhawk');
  assert.equal(equipped.boots, 'boots_grid_runners');
  assert.equal(equipped.badge, 'badge_rookie');
  assert.equal(equipped.emote, 'emote_wave');
  assert.equal(catalogIds.has(equipped.helmet), true);
  assert.equal(catalogIds.has('back_boost_pack'), true);
  assert.equal(catalogIds.has('body_street_legend'), true);
  assert.equal(catalogIds.has('hair_midnight_curls'), true);
  assert.equal(catalogIds.has('hair_classic_mullet'), true);
  assert.equal(catalogIds.has('hair_feathered_mullet'), true);
  assert.equal(catalogIds.has('hair_side_part'), true);
  assert.equal(catalogIds.has('helmet_vector'), true);
  assert.equal(catalogIds.has('helmet_mtb_fullface'), true);
  assert.equal(catalogIds.has('helmet_skate_shell'), true);
  assert.equal(catalogIds.has('helmet_moto_fullface'), true);
  assert.equal(catalogIds.has('helmet_football_cage'), true);
  assert.equal(catalogIds.has('helmet_tactical_visor'), true);
  assert.equal(catalogIds.has('frame_vector_vip'), true);
  assert.equal(catalogIds.has('emote_air_guitar'), true);
  assert.equal(catalogIds.has('emote_high_score'), true);
  assert.equal(catalogIds.has('boots_hover_soles'), true);
});

test('two-factor helpers generate six-digit codes and masked delivery hints', () => {
  assert.match(generateTwoFactorCode(), /^\d{6}$/);
  assert.deepEqual(maskDestination({ email: 'pilot@example.test' }), {
    type: 'email',
    destination: 'pi***@example.test'
  });
  assert.deepEqual(maskDestination({ phone: '(918) 555-0199' }), {
    type: 'sms',
    destination: '***-0199'
  });
});

test('operator configuration defaults keep 2FA enforcement enabled', () => {
  const defaults = defaultOperatorConfig();
  assert.equal(defaults.security.playerTwoFactorRequired, true);
  assert.equal(defaults.security.operatorTwoFactorRequired, true);
  assert.equal(defaults.security.clientManagementRequiresOperator2fa, true);
  assert.ok(defaults.qr.qrTokenTtlSeconds >= 60);
});

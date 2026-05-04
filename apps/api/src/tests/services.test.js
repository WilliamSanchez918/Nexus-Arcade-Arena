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

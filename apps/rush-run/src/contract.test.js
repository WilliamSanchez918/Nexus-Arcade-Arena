import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalJson,
  demoLaunchPayload
} from './contract.js';

test('canonical JSON sorts object keys and omits signatures', () => {
  assert.equal(canonicalJson({ b: 2, signature: 'skip', a: 1 }), '{"a":1,"b":2}');
});

test('demo launch payload is a valid Rush Run game contract', () => {
  const payload = demoLaunchPayload();
  assert.equal(payload.gameId, 'rush_run');
  assert.equal(payload.players[0].slot, 'P1');
});

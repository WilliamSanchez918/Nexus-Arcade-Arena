import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalJson,
  buildSignedResult,
  demoLaunchPayload
} from './contract.js';
import {
  avatarTelemetry,
  runtimeAvatarForPlayer
} from './avatarContract.js';
import {
  exportAvatarRuntimeManifest,
  defaultAvatar
} from '../../../packages/shared/src/index.js';
import {
  HAZARD_TYPES,
  RUNNER_TUNING
} from './gameTuning.js';

test('canonical JSON sorts object keys and omits signatures', () => {
  assert.equal(canonicalJson({ b: 2, signature: 'skip', a: 1 }), '{"a":1,"b":2}');
});

test('demo launch payload is a valid Rush Run game contract', () => {
  const payload = demoLaunchPayload();
  assert.equal(payload.gameId, 'rush_run');
  assert.equal(payload.players[0].slot, 'P1');
  assert.equal(payload.players[0].avatarRuntime.manifestVersion, 'nexus-avatar-manifest/v1');
});

test('Rush Run consumes avatarRuntime before legacy avatar fields', () => {
  const player = {
    displayName: 'Nova',
    avatar: { ...defaultAvatar, primaryColor: '#111111' },
    avatarRuntime: exportAvatarRuntimeManifest({ ...defaultAvatar, primaryColor: '#25FF9A', bodyType: 'runner' }, { target: '2d' })
  };
  const runtime = runtimeAvatarForPlayer(player);

  assert.equal(runtime.colors.primary, '#25FF9A');
  assert.equal(runtime.morphology.bodyType, 'runner');
  assert.equal(runtime.target, '2d');
});

test('Rush Run result telemetry includes avatar contract details', async () => {
  const launchPayload = demoLaunchPayload();
  const runtime = runtimeAvatarForPlayer(launchPayload.players[0]);
  const result = await buildSignedResult({
    launchPayload,
    score: 1200,
    durationSeconds: 12,
    boosts: 2,
    collisions: 0,
    avatar: avatarTelemetry(runtime),
    callbackSecret: 'secret'
  });

  assert.equal(result.telemetry.avatar.manifestVersion, 'nexus-avatar-manifest/v1');
  assert.equal(result.players[0].telemetry.avatar.avatarId, 'guest_bot');
  assert.ok(result.signature);
});

test('Rush Run movement tuning exposes arcade verbs', () => {
  assert.ok(RUNNER_TUNING.moveSpeed > 300);
  assert.ok(RUNNER_TUNING.dashSpeed > RUNNER_TUNING.moveSpeed * 1.8);
  assert.ok(RUNNER_TUNING.jumpBufferMs > 0);
  assert.equal(new Set(HAZARD_TYPES.map((hazard) => hazard.telegraph)).size, HAZARD_TYPES.length);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDisplayName } from '../../../packages/shared/src/index.js';

test('web app uses shared display-name normalization', () => {
  assert.equal(normalizeDisplayName('  Arcade    Pilot  '), 'Arcade Pilot');
});

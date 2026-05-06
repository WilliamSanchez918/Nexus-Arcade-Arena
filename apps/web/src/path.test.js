import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDisplayName } from '../../../packages/shared/src/index.js';
import { supabaseClientKeyFromEnv } from './supabaseConfig.js';

test('web app uses shared display-name normalization', () => {
  assert.equal(normalizeDisplayName('  Arcade    Pilot  '), 'Arcade Pilot');
});

test('supabase client config prefers current publishable key name', () => {
  assert.equal(supabaseClientKeyFromEnv({
    VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable',
    VITE_SUPABASE_ANON_KEY: 'anon'
  }), 'publishable');
  assert.equal(supabaseClientKeyFromEnv({
    VITE_SUPABASE_ANON_KEY: 'anon'
  }), 'anon');
});

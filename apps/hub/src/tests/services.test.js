import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildLaunchCommand, buildWebGameUrl } from '../services/gameLauncher.js';
import {
  enqueueSyncItem,
  flushSyncQueue,
  readSyncQueue
} from '../services/syncQueue.js';

test('Godot command includes payload and callback arguments', () => {
  const command = buildLaunchCommand({
    executablePath: 'C:/Games/RushRun/RushRun.exe',
    payloadPath: 'C:/tmp/session.json',
    callbackUrl: 'http://127.0.0.1:43871/nexus/game-result'
  });

  assert.equal(command.usingSimulator, false);
  assert.equal(command.command, 'C:/Games/RushRun/RushRun.exe');
  assert.deepEqual(command.args, [
    '--nexus-session-payload',
    'C:/tmp/session.json',
    '--nexus-result-callback',
    'http://127.0.0.1:43871/nexus/game-result'
  ]);
});

test('simulator fallback uses node when no Godot export is configured', () => {
  const command = buildLaunchCommand({
    executablePath: '',
    payloadPath: 'payload.json',
    callbackUrl: 'http://callback'
  });
  assert.equal(command.usingSimulator, true);
  assert.equal(command.command, process.execPath);
  assert.equal(command.args.includes('--nexus-session-payload'), true);
});

test('web game URL embeds launch payload and callback details', () => {
  const url = buildWebGameUrl({
    webUrl: 'http://127.0.0.1:5175',
    callbackUrl: 'http://127.0.0.1:43871/nexus/game-result',
    callbackSecret: 'secret',
    launchPayload: {
      cabinetId: 'CAB',
      siteId: 'SITE',
      gameId: 'rush_run',
      gameSessionId: 'SESSION',
      mode: 'solo',
      issuedAt: new Date().toISOString(),
      players: [{
        slot: 'P1',
        playerId: 'guest',
        displayName: 'GUEST',
        avatar: {},
        level: 1,
        isGuest: true
      }]
    }
  });
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get('callback'), 'http://127.0.0.1:43871/nexus/game-result');
  assert.equal(parsed.searchParams.get('callbackSecret'), 'secret');
  assert.ok(parsed.searchParams.get('payload'));
});

test('sync queue retries failed records and removes successful records', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexus-sync-'));
  const queuePath = path.join(dir, 'queue.jsonl');
  await enqueueSyncItem(queuePath, { idempotencyKey: 'one', type: 'game-result', payload: { ok: true } });
  await enqueueSyncItem(queuePath, { idempotencyKey: 'two', type: 'game-result', payload: { ok: false } });

  const result = await flushSyncQueue({
    queuePath,
    send: async (record) => {
      if (!record.payload.ok) {
        throw new Error('offline');
      }
    }
  });

  assert.equal(result.synced.length, 1);
  assert.equal(result.remaining.length, 1);
  const remaining = await readSyncQueue(queuePath);
  assert.equal(remaining[0].idempotencyKey, 'two');
  assert.equal(remaining[0].attempts, 1);
});

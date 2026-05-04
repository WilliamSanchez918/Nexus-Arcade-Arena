#!/usr/bin/env node
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { GameLaunchPayloadSchema, GameResultPayloadSchema } from '../../packages/shared/src/index.js';
import { signGameResult } from '../../packages/shared/src/crypto.js';

function argValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const payloadPath = argValue('--nexus-session-payload');
  const callbackUrl = argValue('--nexus-result-callback');
  const secret = process.env.NEXUS_GAME_CALLBACK_SECRET;

  if (!payloadPath || !callbackUrl) {
    throw new Error('Expected --nexus-session-payload and --nexus-result-callback');
  }

  const launchPayload = GameLaunchPayloadSchema.parse(JSON.parse(await fs.readFile(payloadPath, 'utf8')));
  const startedAt = new Date();
  const endedAt = new Date(startedAt.getTime() + 45_000);
  const unsignedResult = GameResultPayloadSchema.parse({
    idempotencyKey: crypto.randomUUID(),
    cabinetId: launchPayload.cabinetId,
    siteId: launchPayload.siteId,
    gameId: launchPayload.gameId,
    gameSessionId: launchPayload.gameSessionId,
    mode: launchPayload.mode,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationSeconds: 45,
    players: launchPayload.players.map((player, index) => ({
      slot: player.slot,
      playerId: player.playerId,
      displayName: player.displayName,
      score: 1500 + index * 750,
      result: index === 0 ? 'win' : 'finished',
      telemetry: { boosts: 3 + index, collisions: index }
    })),
    telemetry: { simulator: true, build: 'local' },
    nonce: crypto.randomUUID()
  });
  const signedResult = {
    ...unsignedResult,
    signature: signGameResult(unsignedResult, secret)
  };

  const response = await fetch(callbackUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(signedResult)
  });
  if (!response.ok) {
    throw new Error(`Callback failed with ${response.status}: ${await response.text()}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

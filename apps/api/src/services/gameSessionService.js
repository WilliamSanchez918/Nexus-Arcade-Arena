import {
  exportAvatarRuntimeManifest,
  GameLaunchPayloadSchema,
  GameResultPayloadSchema,
  guestPlayer
} from '../../../../packages/shared/src/index.js';
import { verifyGameResultSignature } from '../../../../packages/shared/src/crypto.js';
import {
  GameSession,
  PlayerProfile
} from '../models/index.js';
import { config } from '../config.js';
import { applyProgressionForResult } from './progressionService.js';
import { toPublicPlayer } from './passportService.js';
import { publishIntegrationEvent } from './integrationEventService.js';

async function hydrateLaunchPlayer(input) {
  if (!input?.playerId || input.playerId === 'guest') {
    return guestPlayer(input?.slot || 'P1');
  }
  const profile = await PlayerProfile.findById(input.playerId);
  if (!profile) {
    return guestPlayer(input.slot || 'P1');
  }
  return {
    ...toPublicPlayer(profile),
    playerId: String(profile._id),
    slot: input.slot,
    avatarRuntime: exportAvatarRuntimeManifest(profile.avatar, { target: '2d' })
  };
}

export async function startGameSession(input, io) {
  const players = await Promise.all((input.players || [guestPlayer('P1')]).map(hydrateLaunchPlayer));
  const gameSession = await GameSession.create({
    cabinetId: input.cabinetId,
    siteId: input.siteId,
    gameId: input.gameId || 'rush_run',
    mode: input.mode || (players.length > 1 ? 'versus' : 'solo'),
    startedAt: new Date(),
    players: players.map((player) => ({
      playerId: player.isGuest ? undefined : player.playerId,
      slot: player.slot,
      displayName: player.displayName,
      avatarSnapshot: player.avatar,
      level: player.level,
      isGuest: player.isGuest
    }))
  });

  const launchPayload = GameLaunchPayloadSchema.parse({
    cabinetId: gameSession.cabinetId,
    siteId: gameSession.siteId,
    gameId: gameSession.gameId,
    gameSessionId: String(gameSession._id),
    mode: gameSession.mode,
    players,
    issuedAt: new Date().toISOString(),
    callbackSecretId: 'local-v1'
  });

  io?.to?.(`cabinet:${gameSession.cabinetId}`)?.emit('cabinet.game.start', launchPayload);
  return { gameSession, launchPayload };
}

export async function endGameSession(input, io) {
  const resultPayload = GameResultPayloadSchema.parse(input);
  if (resultPayload.signature && !verifyGameResultSignature(resultPayload, config.gameCallbackSecret)) {
    const error = new Error('Invalid game result signature');
    error.statusCode = 401;
    throw error;
  }

  const existing = await GameSession.findOne({ idempotencyKey: resultPayload.idempotencyKey });
  if (existing) {
    return { gameSession: existing, awards: [], idempotent: true };
  }

  const gameSession = await GameSession.findById(resultPayload.gameSessionId);
  if (!gameSession) {
    const error = new Error('Game session not found');
    error.statusCode = 404;
    throw error;
  }

  gameSession.status = 'completed';
  gameSession.endedAt = new Date(resultPayload.endedAt);
  gameSession.idempotencyKey = resultPayload.idempotencyKey;
  gameSession.telemetry = {
    durationSeconds: resultPayload.durationSeconds,
    errors: resultPayload.telemetry?.errors || [],
    raw: resultPayload.telemetry || {}
  };
  gameSession.players = gameSession.players.map((player) => {
    const result = resultPayload.players.find((candidate) => candidate.slot === player.slot);
    if (!result) {
      return player;
    }
    player.score = result.score;
    player.result = result.result;
    return player;
  });
  await gameSession.save();

  const awards = await applyProgressionForResult({ gameSession, resultPayload });
  io?.to?.(`cabinet:${gameSession.cabinetId}`)?.emit('cabinet.game.end', {
    gameSessionId: String(gameSession._id),
    awards
  });

  for (const award of awards) {
    publishIntegrationEvent(io, {
      type: 'player.game.completed',
      playerId: award.playerId,
      cabinetId: gameSession.cabinetId,
      gameId: gameSession.gameId,
      payload: {
        gameSessionId: String(gameSession._id),
        xpAwarded: award.xpAwarded,
        level: award.level,
        bestScore: award.bestScore
      }
    });
  }

  return { gameSession, awards, idempotent: false };
}

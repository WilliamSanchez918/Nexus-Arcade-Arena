import express from 'express';
import {
  findOrCreateDevProfile,
  getPlayerProfile,
  redactPlayerProfile,
  updatePlayerAvatar
} from '../services/passportService.js';
import { claimCabinetLoginSession } from '../services/qrPairingService.js';
import { publishIntegrationEvent } from '../services/integrationEventService.js';

export const playerRouter = express.Router();

function getPlayerId(req) {
  return req.header('x-player-id') || req.body.playerId || req.query.playerId;
}

playerRouter.post('/dev-login', async (req, res, next) => {
  try {
    const profile = await findOrCreateDevProfile(req.body);
    publishIntegrationEvent(req.app.locals.io, {
      type: 'player.created',
      playerId: String(profile._id),
      payload: { displayName: profile.displayName }
    });
    res.status(201).json({
      playerToken: String(profile._id),
      ...redactPlayerProfile(profile)
    });
  } catch (error) {
    next(error);
  }
});

playerRouter.post('/claim-cabinet-session', async (req, res, next) => {
  try {
    res.json(await claimCabinetLoginSession(req.body, req.app.locals.io));
  } catch (error) {
    next(error);
  }
});

playerRouter.get('/me', async (req, res, next) => {
  try {
    const profile = await getPlayerProfile(getPlayerId(req));
    res.json(redactPlayerProfile(profile));
  } catch (error) {
    next(error);
  }
});

playerRouter.patch('/me/avatar', async (req, res, next) => {
  try {
    const profile = await updatePlayerAvatar(getPlayerId(req), req.body.avatar || req.body);
    publishIntegrationEvent(req.app.locals.io, {
      type: 'player.updated',
      playerId: String(profile._id),
      payload: { avatar: profile.avatar }
    });
    req.app.locals.io?.emit?.('player.profile.updated', {
      playerId: String(profile._id),
      avatar: profile.avatar
    });
    res.json(redactPlayerProfile(profile));
  } catch (error) {
    next(error);
  }
});

playerRouter.get('/me/stats', async (req, res, next) => {
  try {
    const { PlayerGameStats } = await import('../models/index.js');
    const stats = await PlayerGameStats.find({ playerId: getPlayerId(req) }).lean();
    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

playerRouter.get('/me/achievements', async (req, res, next) => {
  try {
    const { PlayerGameStats } = await import('../models/index.js');
    const stats = await PlayerGameStats.find({ playerId: getPlayerId(req) }).lean();
    const achievements = stats.flatMap((entry) => entry.achievements.map((achievement) => ({
      gameId: entry.gameId,
      ...achievement
    })));
    res.json({ achievements });
  } catch (error) {
    next(error);
  }
});

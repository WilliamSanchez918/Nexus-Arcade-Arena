import express from 'express';
import {
  findOrCreateDevProfile,
  getPlayerProfile,
  redactPlayerProfile,
  updatePlayerAvatar
} from '../services/passportService.js';
import { claimCabinetLoginSession } from '../services/qrPairingService.js';
import { publishIntegrationEvent } from '../services/integrationEventService.js';
import {
  equipPlayerCosmetic,
  getAvatarCatalog,
  getPlayerAvatarInventory
} from '../services/avatarCatalogService.js';
import {
  createTwoFactorChallenge,
  verifyTwoFactorChallenge
} from '../services/twoFactorService.js';
import {
  hasBearerToken,
  playerProfileForManagedIdentityRequest,
  playerProfileWithManagedIdentityForRequest
} from '../services/managedIdentityService.js';

export const playerRouter = express.Router();

function getLocalPlayerId(req) {
  return req.header('x-player-id') || req.body.playerId || req.query.playerId;
}

async function getPlayerId(req) {
  if (hasBearerToken(req)) {
    const profile = await playerProfileForManagedIdentityRequest(req, {
      displayName: req.body.displayName
    });
    return String(profile._id);
  }
  return getLocalPlayerId(req);
}

playerRouter.post('/dev-login', async (req, res, next) => {
  try {
    const profile = await findOrCreateDevProfile(req.body);
    const challenge = await createTwoFactorChallenge({
      purpose: 'player_login',
      subjectId: profile._id,
      subjectDisplayName: profile.displayName,
      email: req.body.email,
      phone: req.body.phone,
      metadata: { displayName: profile.displayName }
    });
    res.status(202).json(challenge);
  } catch (error) {
    next(error);
  }
});

playerRouter.post('/dev-login/verify-2fa', async (req, res, next) => {
  try {
    const challenge = await verifyTwoFactorChallenge({
      challengeId: req.body.challengeId,
      code: req.body.code,
      purpose: 'player_login'
    });
    const profile = await getPlayerProfile(challenge.subjectId);
    publishIntegrationEvent(req.app.locals.io, {
      type: 'player.updated',
      playerId: String(profile._id),
      payload: { displayName: profile.displayName, twoFactorVerified: true }
    });
    res.json({
      playerToken: String(profile._id),
      ...redactPlayerProfile(profile)
    });
  } catch (error) {
    next(error);
  }
});

playerRouter.post('/claim-cabinet-session', async (req, res, next) => {
  try {
    res.json(await claimCabinetLoginSession({
      ...req.body,
      playerId: await getPlayerId(req)
    }, req.app.locals.io));
  } catch (error) {
    next(error);
  }
});

playerRouter.post('/auth/session', async (req, res, next) => {
  try {
    const { identity, profile } = await playerProfileWithManagedIdentityForRequest(req, {
      displayName: req.body.displayName
    });
    publishIntegrationEvent(req.app.locals.io, {
      type: 'player.updated',
      playerId: String(profile._id),
      payload: {
        displayName: profile.displayName,
        managedIdentityVerified: true,
        authProvider: identity.authProvider
      }
    });
    res.json({
      playerToken: String(profile._id),
      authProvider: identity.authProvider,
      ...redactPlayerProfile(profile)
    });
  } catch (error) {
    next(error);
  }
});

playerRouter.get('/me', async (req, res, next) => {
  try {
    const profile = await getPlayerProfile(await getPlayerId(req));
    res.json(redactPlayerProfile(profile));
  } catch (error) {
    next(error);
  }
});

playerRouter.get('/avatar/catalog', async (_req, res, next) => {
  try {
    res.json(await getAvatarCatalog());
  } catch (error) {
    next(error);
  }
});

playerRouter.get('/me/inventory', async (req, res, next) => {
  try {
    res.json({ inventory: await getPlayerAvatarInventory(await getPlayerId(req)) });
  } catch (error) {
    next(error);
  }
});

playerRouter.patch('/me/avatar', async (req, res, next) => {
  try {
    const profile = await updatePlayerAvatar(await getPlayerId(req), req.body.avatar || req.body);
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

playerRouter.patch('/me/equipment', async (req, res, next) => {
  try {
    const result = await equipPlayerCosmetic(await getPlayerId(req), req.body);
    publishIntegrationEvent(req.app.locals.io, {
      type: 'player.updated',
      playerId: String(result.profile._id),
      payload: { avatar: result.profile.avatar, equipped: result.inventory.equipped }
    });
    req.app.locals.io?.emit?.('player.profile.updated', {
      playerId: String(result.profile._id),
      avatar: result.profile.avatar
    });
    res.json({
      ...redactPlayerProfile(result.profile),
      inventory: result.inventory
    });
  } catch (error) {
    next(error);
  }
});

playerRouter.get('/me/stats', async (req, res, next) => {
  try {
    const { PlayerGameStats } = await import('../models/index.js');
    const stats = await PlayerGameStats.find({ playerId: await getPlayerId(req) }).lean();
    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

playerRouter.get('/me/achievements', async (req, res, next) => {
  try {
    const { PlayerGameStats } = await import('../models/index.js');
    const stats = await PlayerGameStats.find({ playerId: await getPlayerId(req) }).lean();
    const achievements = stats.flatMap((entry) => entry.achievements.map((achievement) => ({
      gameId: entry.gameId,
      ...achievement
    })));
    res.json({ achievements });
  } catch (error) {
    next(error);
  }
});

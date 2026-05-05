import express from 'express';
import {
  claimCabinetLoginSession,
  createCabinetLoginSession,
  getActivePlayers,
  getCabinetLoginStatus,
  logoutCabinetPlayer
} from '../services/qrPairingService.js';
import { startGameSession, endGameSession } from '../services/gameSessionService.js';
import { recordHeartbeat } from '../services/heartbeatService.js';
import {
  hasBearerToken,
  playerProfileForManagedIdentityRequest
} from '../services/managedIdentityService.js';

export const arcadeRouter = express.Router();

arcadeRouter.post('/cabinet-login', async (req, res, next) => {
  try {
    const { response } = await createCabinetLoginSession(req.body);
    req.app.locals.io?.to?.(`cabinet:${response.cabinetId}`)?.emit('cabinet.login.created', response);
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

arcadeRouter.get('/cabinet-login/:sessionId/status', async (req, res, next) => {
  try {
    res.json(await getCabinetLoginStatus(req.params.sessionId));
  } catch (error) {
    next(error);
  }
});

arcadeRouter.post('/game-session/start', async (req, res, next) => {
  try {
    const { gameSession, launchPayload } = await startGameSession(req.body, req.app.locals.io);
    res.status(201).json({
      gameSessionId: String(gameSession._id),
      launchPayload
    });
  } catch (error) {
    next(error);
  }
});

arcadeRouter.post('/game-session/end', async (req, res, next) => {
  try {
    const { gameSession, awards, idempotent } = await endGameSession(req.body, req.app.locals.io);
    res.json({
      gameSessionId: String(gameSession._id),
      status: gameSession.status,
      idempotent,
      awards
    });
  } catch (error) {
    next(error);
  }
});

arcadeRouter.get('/cabinet/:cabinetId/active-players', async (req, res, next) => {
  try {
    res.json(await getActivePlayers(req.params.cabinetId));
  } catch (error) {
    next(error);
  }
});

arcadeRouter.post('/cabinet/:cabinetId/logout-player', async (req, res, next) => {
  try {
    res.json(await logoutCabinetPlayer({
      cabinetId: req.params.cabinetId,
      slot: req.body.slot
    }, req.app.locals.io));
  } catch (error) {
    next(error);
  }
});

arcadeRouter.post('/cabinet/:cabinetId/heartbeat', async (req, res, next) => {
  try {
    res.json(await recordHeartbeat({
      ...req.body,
      cabinetId: req.params.cabinetId
    }, req.app.locals.io));
  } catch (error) {
    next(error);
  }
});

arcadeRouter.post('/player/claim-cabinet-session', async (req, res, next) => {
  try {
    const managedProfile = hasBearerToken(req)
      ? await playerProfileForManagedIdentityRequest(req, { displayName: req.body.displayName })
      : null;
    res.json(await claimCabinetLoginSession({
      ...req.body,
      playerId: managedProfile ? String(managedProfile._id) : req.header('x-player-id') || req.body.playerId
    }, req.app.locals.io));
  } catch (error) {
    next(error);
  }
});

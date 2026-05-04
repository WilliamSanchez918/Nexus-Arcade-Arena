import express from 'express';
import { Cabinet } from '../models/index.js';
import { listRecentIntegrationEvents } from '../services/integrationEventService.js';
import {
  requireOperatorSession,
  startOperatorLogin,
  verifyOperatorLogin
} from '../services/operatorAuthService.js';

export const operatorRouter = express.Router();

operatorRouter.post('/login', async (req, res, next) => {
  try {
    res.status(202).json(await startOperatorLogin(req.body));
  } catch (error) {
    next(error);
  }
});

operatorRouter.post('/verify-2fa', async (req, res, next) => {
  try {
    res.json(await verifyOperatorLogin(req.body));
  } catch (error) {
    next(error);
  }
});

operatorRouter.use(requireOperatorSession);

operatorRouter.get('/cabinets', async (_req, res, next) => {
  try {
    const cabinets = await Cabinet.find({}).sort({ updatedAt: -1 }).limit(100).lean();
    res.json({
      cabinets: cabinets.map((cabinet) => ({
        cabinetId: cabinet.cabinetId,
        siteId: cabinet.siteId,
        status: cabinet.status,
        lastHeartbeatAt: cabinet.lastHeartbeatAt,
        lastState: cabinet.lastState,
        appVersion: cabinet.appVersion,
        activePlayers: cabinet.activePlayers || []
      }))
    });
  } catch (error) {
    next(error);
  }
});

operatorRouter.get('/passport-events', (req, res) => {
  res.json({ events: listRecentIntegrationEvents(Number(req.query.limit || 100)) });
});

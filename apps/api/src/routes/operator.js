import express from 'express';
import { Cabinet } from '../models/index.js';
import { listRecentIntegrationEvents } from '../services/integrationEventService.js';

export const operatorRouter = express.Router();

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

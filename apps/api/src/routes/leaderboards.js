import express from 'express';
import { listLeaderboard } from '../services/leaderboardService.js';

export const leaderboardsRouter = express.Router();

leaderboardsRouter.get('/:gameId', async (req, res, next) => {
  try {
    res.json({
      gameId: req.params.gameId,
      entries: await listLeaderboard({
        gameId: req.params.gameId,
        scope: req.query.scope || 'global',
        siteId: req.query.siteId,
        season: req.query.season || 'all-time',
        limit: req.query.limit
      })
    });
  } catch (error) {
    next(error);
  }
});

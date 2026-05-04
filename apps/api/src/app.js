import express from 'express';
import cors from 'cors';
import { arcadeRouter } from './routes/arcade.js';
import { playerRouter } from './routes/player.js';
import { leaderboardsRouter } from './routes/leaderboards.js';
import { operatorRouter } from './routes/operator.js';
import { authClientRouter, oauthRouter } from './routes/oauth.js';
import { passportRouter } from './routes/passport.js';
import { oauthMetadata } from './services/oauthService.js';

export function createApp({ io } = {}) {
  const app = express();
  app.locals.io = io;

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/healthz', (_req, res) => res.json({ ok: true }));
  app.get('/ready', (_req, res) => res.json({ ok: true }));
  app.get('/.well-known/oauth-authorization-server', (_req, res) => res.json(oauthMetadata()));

  app.use('/api/arcade', arcadeRouter);
  app.use('/api/player', playerRouter);
  app.use('/api/leaderboards', leaderboardsRouter);
  app.use('/api/operator', operatorRouter);
  app.use('/api/auth', authClientRouter);
  app.use('/api/passport', passportRouter);
  app.use('/oauth', oauthRouter);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found', path: req.path });
  });

  app.use((error, _req, res, _next) => {
    const status = error.statusCode || error.status || 500;
    res.status(status).json({
      error: error.message || 'Internal server error',
      details: error.errors
    });
  });

  return app;
}

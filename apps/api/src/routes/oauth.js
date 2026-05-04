import express from 'express';
import {
  createAuthorizationCode,
  exchangeAuthorizationCode,
  introspectAccessToken,
  oauthMetadata,
  registerOAuthClient
} from '../services/oauthService.js';
import { OAuthClient } from '../models/index.js';

export const oauthRouter = express.Router();
export const authClientRouter = express.Router();

oauthRouter.get('/authorize', async (req, res, next) => {
  try {
    const playerToken = req.query.player_token || req.header('x-player-id');
    const result = await createAuthorizationCode({ ...req.query, player_token: playerToken });
    res.redirect(result.redirectUrl);
  } catch (error) {
    next(error);
  }
});

oauthRouter.post('/token', async (req, res, next) => {
  try {
    res.json(await exchangeAuthorizationCode(req.body));
  } catch (error) {
    next(error);
  }
});

oauthRouter.post('/introspect', async (req, res, next) => {
  try {
    const token = req.body.token || String(req.header('authorization') || '').replace(/^Bearer\s+/i, '');
    res.json(await introspectAccessToken(token));
  } catch (error) {
    next(error);
  }
});

oauthRouter.get('/metadata', (_req, res) => {
  res.json(oauthMetadata());
});

authClientRouter.post('/clients', async (req, res, next) => {
  try {
    res.status(201).json(await registerOAuthClient(req.body));
  } catch (error) {
    next(error);
  }
});

authClientRouter.get('/clients', async (_req, res, next) => {
  try {
    const clients = await OAuthClient.find({}).sort({ updatedAt: -1 }).lean();
    res.json({
      clients: clients.map((client) => ({
        clientId: client.clientId,
        name: client.name,
        redirectUris: client.redirectUris,
        allowedScopes: client.allowedScopes,
        type: client.type,
        status: client.status,
        createdAt: client.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

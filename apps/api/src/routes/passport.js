import express from 'express';
import { buildScopedPassportPayload } from '../services/passportService.js';
import { resolvePassportAccessToken } from '../services/oauthService.js';

export const passportRouter = express.Router();

function bearerToken(req) {
  return String(req.header('authorization') || '').replace(/^Bearer\s+/i, '') || req.query.access_token;
}

passportRouter.get('/me', async (req, res, next) => {
  try {
    const resolved = await resolvePassportAccessToken(bearerToken(req));
    if (!resolved) {
      res.status(401).json({ error: 'Valid Passport access token is required' });
      return;
    }
    res.json(await buildScopedPassportPayload(resolved.profile, resolved.scopes));
  } catch (error) {
    next(error);
  }
});

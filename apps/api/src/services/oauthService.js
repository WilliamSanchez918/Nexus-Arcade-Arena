import crypto from 'node:crypto';
import {
  OAuthAuthorizeRequestSchema,
  OAuthTokenRequestSchema,
  PASSPORT_SCOPES,
  PassportAuthClientSchema
} from '../../../../packages/shared/src/index.js';
import {
  OAuthAccessToken,
  OAuthAuthorizationCode,
  OAuthClient,
  PlayerProfile
} from '../models/index.js';
import { config } from '../config.js';
import {
  hashToken,
  randomToken,
  safeEqualHash,
  sha256Base64Url
} from './tokenService.js';
import { toPublicPlayer } from './passportService.js';

const ACCESS_TOKEN_SECONDS = 3600;
const AUTH_CODE_SECONDS = 300;

export function normalizeScopes(scopeText = 'passport:profile:read') {
  const requested = String(scopeText).split(/\s+/).filter(Boolean);
  return [...new Set(requested)];
}

export function assertScopesAllowed(requested, allowed) {
  const allowedSet = new Set(allowed);
  const invalid = requested.filter((scope) => !PASSPORT_SCOPES.includes(scope) || !allowedSet.has(scope));
  if (invalid.length) {
    const error = new Error(`Invalid or unauthorized scope: ${invalid.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
}

export function verifyPkce({ verifier, challenge, method = 'S256' }) {
  if (!challenge) {
    return true;
  }
  if (!verifier) {
    return false;
  }
  const derived = method === 'plain' ? verifier : sha256Base64Url(verifier);
  return derived === challenge;
}

export function signPassportAccessTokenClaims(claims) {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto.createHmac('sha256', config.passportTokenSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyPassportAccessTokenClaims(token) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature) {
    return null;
  }
  const expected = crypto.createHmac('sha256', config.passportTokenSecret).update(payload).digest('base64url');
  if (!safeEqualHash(signature, expected)) {
    return null;
  }
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

export async function registerOAuthClient(input) {
  const parsed = PassportAuthClientSchema.omit({ clientId: true }).extend({
    clientId: PassportAuthClientSchema.shape.clientId.optional()
  }).parse(input);
  const clientId = parsed.clientId || `nexus_${randomToken(12)}`;
  const clientSecret = parsed.type === 'confidential' ? randomToken(32) : undefined;

  const client = await OAuthClient.create({
    ...parsed,
    clientId,
    clientSecretHash: clientSecret ? hashToken(clientSecret, config.passportTokenSecret) : undefined
  });

  return {
    client: {
      clientId: client.clientId,
      name: client.name,
      redirectUris: client.redirectUris,
      allowedScopes: client.allowedScopes,
      type: client.type,
      status: client.status
    },
    clientSecret
  };
}

export async function createAuthorizationCode(rawRequest) {
  const request = OAuthAuthorizeRequestSchema.parse(rawRequest);
  const client = await OAuthClient.findOne({ clientId: request.client_id, status: 'active' });
  if (!client) {
    const error = new Error('Unknown OAuth client');
    error.statusCode = 400;
    throw error;
  }
  if (!client.redirectUris.includes(request.redirect_uri)) {
    const error = new Error('redirect_uri is not registered for this client');
    error.statusCode = 400;
    throw error;
  }

  const scopes = normalizeScopes(request.scope);
  assertScopesAllowed(scopes, client.allowedScopes);

  const profile = await PlayerProfile.findById(request.player_token);
  if (!profile || profile.status !== 'active') {
    const error = new Error('Player authentication is required before authorization');
    error.statusCode = 401;
    throw error;
  }

  const code = randomToken(32);
  await OAuthAuthorizationCode.create({
    codeHash: hashToken(code, config.passportTokenSecret),
    clientId: client.clientId,
    playerId: profile._id,
    redirectUri: request.redirect_uri,
    scope: scopes,
    codeChallenge: request.code_challenge,
    codeChallengeMethod: request.code_challenge_method,
    expiresAt: new Date(Date.now() + AUTH_CODE_SECONDS * 1000)
  });

  const redirectUrl = new URL(request.redirect_uri);
  redirectUrl.searchParams.set('code', code);
  if (request.state) {
    redirectUrl.searchParams.set('state', request.state);
  }

  return { redirectUrl: redirectUrl.toString(), code, profile, scopes, client };
}

export async function exchangeAuthorizationCode(rawRequest) {
  const request = OAuthTokenRequestSchema.parse(rawRequest);
  const client = await OAuthClient.findOne({ clientId: request.client_id, status: 'active' });
  if (!client) {
    const error = new Error('Unknown OAuth client');
    error.statusCode = 400;
    throw error;
  }
  if (client.type === 'confidential') {
    const secretHash = hashToken(request.client_secret || '', config.passportTokenSecret);
    if (!safeEqualHash(secretHash, client.clientSecretHash || '')) {
      const error = new Error('Invalid client secret');
      error.statusCode = 401;
      throw error;
    }
  }

  const codeHash = hashToken(request.code, config.passportTokenSecret);
  const authCode = await OAuthAuthorizationCode.findOne({ codeHash }).populate('playerId');
  if (!authCode || authCode.consumedAt) {
    const error = new Error('Invalid authorization code');
    error.statusCode = 400;
    throw error;
  }
  if (authCode.expiresAt <= new Date()) {
    const error = new Error('Authorization code expired');
    error.statusCode = 400;
    throw error;
  }
  if (authCode.clientId !== client.clientId || authCode.redirectUri !== request.redirect_uri) {
    const error = new Error('Authorization code request mismatch');
    error.statusCode = 400;
    throw error;
  }
  if (!verifyPkce({
    verifier: request.code_verifier,
    challenge: authCode.codeChallenge,
    method: authCode.codeChallengeMethod
  })) {
    const error = new Error('Invalid PKCE verifier');
    error.statusCode = 401;
    throw error;
  }

  authCode.consumedAt = new Date();
  await authCode.save();

  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_SECONDS * 1000);
  const claims = {
    iss: config.oauthIssuer,
    aud: client.clientId,
    sub: String(authCode.playerId._id),
    scope: authCode.scope.join(' '),
    exp: Math.floor(expiresAt.getTime() / 1000)
  };
  const accessToken = signPassportAccessTokenClaims(claims);
  const refreshToken = randomToken(32);

  await OAuthAccessToken.create({
    tokenHash: hashToken(accessToken, config.passportTokenSecret),
    refreshTokenHash: hashToken(refreshToken, config.passportTokenSecret),
    clientId: client.clientId,
    playerId: authCode.playerId._id,
    scope: authCode.scope,
    expiresAt
  });

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_SECONDS,
    refresh_token: refreshToken,
    scope: authCode.scope.join(' '),
    passport_profile: toPublicPlayer(authCode.playerId)
  };
}

export async function introspectAccessToken(token) {
  const claims = verifyPassportAccessTokenClaims(token);
  if (!claims || claims.exp <= Math.floor(Date.now() / 1000)) {
    return { active: false };
  }

  const stored = await OAuthAccessToken.findOne({
    tokenHash: hashToken(token, config.passportTokenSecret),
    revokedAt: { $exists: false }
  }).populate('playerId');

  if (!stored || stored.expiresAt <= new Date()) {
    return { active: false };
  }

  return {
    active: true,
    client_id: stored.clientId,
    sub: String(stored.playerId._id),
    scope: stored.scope.join(' '),
    exp: Math.floor(stored.expiresAt.getTime() / 1000),
    passport_profile: toPublicPlayer(stored.playerId)
  };
}

export function oauthMetadata() {
  return {
    issuer: config.oauthIssuer,
    authorization_endpoint: `${config.oauthIssuer}/oauth/authorize`,
    token_endpoint: `${config.oauthIssuer}/oauth/token`,
    introspection_endpoint: `${config.oauthIssuer}/oauth/introspect`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256', 'plain'],
    scopes_supported: PASSPORT_SCOPES,
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post']
  };
}

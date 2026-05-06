import { createRemoteJWKSet, jwtVerify } from 'jose';
import {
  normalizeDisplayName,
  normalizeDisplayNameKey
} from '../../../../packages/shared/src/index.js';
import { PlayerIdentity, PlayerProfile } from '../models/index.js';
import { ensurePlayerInventory } from './avatarCatalogService.js';
import { getOperatorConfig } from './operatorConfigService.js';

const jwksCache = new Map();

function bearerToken(req) {
  const header = req.header?.('authorization') || '';
  const [scheme, token] = header.split(/\s+/);
  return scheme?.toLowerCase() === 'bearer' ? token : '';
}

function identityConfigFromOperatorConfig(config) {
  const identity = config.identity || {};
  const projectUrl = String(identity.supabaseProjectUrl || '').replace(/\/$/, '');
  const provider = identity.provider || 'local-dev';
  return {
    provider,
    authProvider: provider === 'supabase' ? 'supabase' : 'managed-auth',
    issuer: identity.issuer || (projectUrl ? `${projectUrl}/auth/v1` : ''),
    jwksUrl: identity.jwksUrl || (projectUrl ? `${projectUrl}/auth/v1/.well-known/jwks.json` : ''),
    audience: identity.audience || 'authenticated'
  };
}

function jwksForUrl(jwksUrl) {
  if (!jwksCache.has(jwksUrl)) {
    jwksCache.set(jwksUrl, createRemoteJWKSet(new URL(jwksUrl)));
  }
  return jwksCache.get(jwksUrl);
}

export async function verifyManagedIdentityRequest(req) {
  const token = bearerToken(req);
  if (!token) {
    const error = new Error('Bearer token required');
    error.statusCode = 401;
    throw error;
  }

  const runtimeConfig = identityConfigFromOperatorConfig(await getOperatorConfig());
  if (runtimeConfig.provider === 'local-dev') {
    const error = new Error('Nexus identity backend is not enabled');
    error.statusCode = 400;
    throw error;
  }
  if (!runtimeConfig.issuer || !runtimeConfig.jwksUrl) {
    const error = new Error('Nexus identity backend is missing issuer or JWKS URL');
    error.statusCode = 500;
    throw error;
  }

  const { payload } = await jwtVerify(token, jwksForUrl(runtimeConfig.jwksUrl), {
    issuer: runtimeConfig.issuer,
    audience: runtimeConfig.audience
  });

  return {
    provider: runtimeConfig.provider,
    authProvider: runtimeConfig.authProvider,
    authUserId: payload.sub,
    email: payload.email,
    emailVerified: Boolean(payload.email_verified),
    displayName: payload.user_metadata?.display_name || payload.user_metadata?.name || payload.email,
    claims: payload
  };
}

function displayNameBase(identity, requestedDisplayName) {
  const fromRequest = normalizeDisplayName(requestedDisplayName);
  if (fromRequest) {
    return fromRequest;
  }
  const fromClaims = normalizeDisplayName(identity.displayName);
  if (fromClaims) {
    return fromClaims;
  }
  const emailPrefix = normalizeDisplayName(String(identity.email || '').split('@')[0]);
  if (emailPrefix) {
    return emailPrefix;
  }
  return `PLAYER_${String(identity.authUserId || 'USER').slice(0, 6).toUpperCase()}`;
}

async function availableDisplayName(baseDisplayName, authUserId) {
  const cleanBase = normalizeDisplayName(baseDisplayName) || 'PLAYER';
  const normalizedBase = normalizeDisplayNameKey(cleanBase);
  const existing = await PlayerProfile.findOne({ normalizedDisplayName: normalizedBase }).lean();
  if (!existing) {
    return cleanBase;
  }
  const suffix = String(authUserId || Date.now()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase();
  return normalizeDisplayName(`${cleanBase.slice(0, 17)}_${suffix}`);
}

export async function findOrCreateManagedAuthProfile({ identity, displayName }) {
  const existingIdentity = await PlayerIdentity.findOne({
    authProvider: identity.authProvider,
    authUserId: identity.authUserId
  });
  if (existingIdentity) {
    const profile = await PlayerProfile.findById(existingIdentity.playerId);
    if (!profile || profile.status !== 'active') {
      const error = new Error('Player profile not found');
      error.statusCode = 404;
      throw error;
    }
    profile.lastLoginAt = new Date();
    await profile.save();
    await ensurePlayerInventory(profile._id, profile.avatar);
    return profile;
  }

  const cleanDisplayName = await availableDisplayName(displayNameBase(identity, displayName), identity.authUserId);
  const profile = await PlayerProfile.create({
    displayName: cleanDisplayName,
    normalizedDisplayName: normalizeDisplayNameKey(cleanDisplayName),
    lastLoginAt: new Date()
  });
  await ensurePlayerInventory(profile._id, profile.avatar);

  await PlayerIdentity.create({
    provider: identity.authProvider,
    identifier: identity.authUserId,
    authProvider: identity.authProvider,
    authUserId: identity.authUserId,
    emailVerified: identity.emailVerified,
    playerId: profile._id,
    verifiedAt: new Date(),
    metadata: {
      email: identity.email,
      identityProvider: identity.provider
    }
  });

  return profile;
}

export async function playerProfileForManagedIdentityRequest(req, options = {}) {
  return (await playerProfileWithManagedIdentityForRequest(req, options)).profile;
}

export async function playerProfileWithManagedIdentityForRequest(req, options = {}) {
  const identity = await verifyManagedIdentityRequest(req);
  const profile = await findOrCreateManagedAuthProfile({
    identity,
    displayName: options.displayName
  });
  return { identity, profile };
}

export function hasBearerToken(req) {
  return Boolean(bearerToken(req));
}

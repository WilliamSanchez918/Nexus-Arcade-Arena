import {
  AvatarManifestSchema,
  exportAvatarRuntimeManifest,
  normalizeDisplayName,
  normalizeDisplayNameKey,
  publicPlayerFromProfile
} from '../../../../packages/shared/src/index.js';
import {
  LeaderboardEntry,
  PlayerIdentity,
  PlayerGameStats,
  PlayerProfile
} from '../models/index.js';
import { ensurePlayerInventory } from './avatarCatalogService.js';

export function sanitizeOptionalIdentifier(value) {
  const cleaned = String(value || '').trim().toLowerCase();
  return cleaned || undefined;
}

export async function findOrCreateDevProfile({ displayName, email, phone }) {
  const cleanDisplayName = normalizeDisplayName(displayName);
  if (!cleanDisplayName) {
    const error = new Error('Display name is required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedDisplayName = normalizeDisplayNameKey(cleanDisplayName);
  let profile = await PlayerProfile.findOne({ normalizedDisplayName });

  if (!profile) {
    profile = await PlayerProfile.create({
      displayName: cleanDisplayName,
      normalizedDisplayName,
      lastLoginAt: new Date()
    });
    await ensurePlayerInventory(profile._id, profile.avatar);
  } else {
    profile.displayName = cleanDisplayName;
    profile.lastLoginAt = new Date();
    await profile.save();
    await ensurePlayerInventory(profile._id, profile.avatar);
  }

  const identifiers = [
    ['dev', normalizedDisplayName],
    ['email', sanitizeOptionalIdentifier(email)],
    ['phone', sanitizeOptionalIdentifier(phone)]
  ].filter(([, identifier]) => Boolean(identifier));

  await Promise.all(identifiers.map(([provider, identifier]) => PlayerIdentity.updateOne(
    { provider, identifier },
    {
      $setOnInsert: {
        provider,
        identifier,
        playerId: profile._id,
        verifiedAt: provider === 'dev' ? new Date() : undefined
      }
    },
    { upsert: true }
  )));

  return profile;
}

export async function getPlayerProfile(playerId) {
  const profile = await PlayerProfile.findById(playerId);
  if (!profile || profile.status !== 'active') {
    const error = new Error('Player profile not found');
    error.statusCode = 404;
    throw error;
  }
  return profile;
}

export async function updatePlayerAvatar(playerId, avatarInput) {
  const avatar = AvatarManifestSchema.parse(avatarInput || {});
  const profile = await getPlayerProfile(playerId);
  profile.avatar = avatar;
  await profile.save();
  return profile;
}

export function toPublicPlayer(profile, overrides = {}) {
  return publicPlayerFromProfile(profile, overrides);
}

export async function buildScopedPassportPayload(profile, scopes = []) {
  const scopeSet = new Set(scopes);
  const playerId = String(profile._id);
  const payload = {
    playerId,
    scopes: [...scopeSet],
    issuedAt: new Date().toISOString()
  };

  if (scopeSet.has('passport:profile:read')) {
    payload.profile = {
      playerId,
      displayName: profile.displayName,
      level: profile.progression?.level || 1,
      status: profile.status,
      createdAt: profile.createdAt?.toISOString?.() || profile.createdAt,
      updatedAt: profile.updatedAt?.toISOString?.() || profile.updatedAt
    };
  }

  if (scopeSet.has('passport:avatar:read')) {
    payload.avatar = exportAvatarRuntimeManifest(profile.avatar);
  }

  if (scopeSet.has('passport:stats:read') || scopeSet.has('passport:achievements:read')) {
    const stats = await PlayerGameStats.find({ playerId: profile._id }).sort({ lastPlayedAt: -1 }).lean();
    if (scopeSet.has('passport:stats:read')) {
      payload.stats = stats.map((entry) => ({
        gameId: entry.gameId,
        totalPlays: entry.totalPlays,
        bestScore: entry.bestScore,
        totalScore: entry.totalScore,
        wins: entry.wins,
        losses: entry.losses,
        lastPlayedAt: entry.lastPlayedAt
      }));
    }
    if (scopeSet.has('passport:achievements:read')) {
      payload.achievements = stats.flatMap((entry) => entry.achievements.map((achievement) => ({
        gameId: entry.gameId,
        achievementId: achievement.achievementId,
        unlockedAt: achievement.unlockedAt
      })));
    }
  }

  if (scopeSet.has('passport:leaderboard:read')) {
    const entries = await LeaderboardEntry.find({ playerId: profile._id })
      .sort({ achievedAt: -1 })
      .limit(25)
      .lean();
    payload.leaderboards = entries.map((entry) => ({
      gameId: entry.gameId,
      scope: entry.scope,
      siteId: entry.siteId,
      season: entry.season,
      score: entry.score,
      achievedAt: entry.achievedAt
    }));
  }

  return payload;
}

export function redactPlayerProfile(profile) {
  return {
    player: toPublicPlayer(profile),
    progression: profile.progression,
    preferences: profile.preferences,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

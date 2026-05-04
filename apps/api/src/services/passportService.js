import {
  AvatarManifestSchema,
  normalizeDisplayName,
  normalizeDisplayNameKey,
  publicPlayerFromProfile
} from '../../../../packages/shared/src/index.js';
import {
  PlayerIdentity,
  PlayerInventory,
  PlayerProfile
} from '../models/index.js';

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
    await PlayerInventory.create({
      playerId: profile._id,
      cosmetics: [{ cosmeticId: 'frame_neon_start', source: 'starter' }],
      badges: [{ badgeId: 'rookie' }]
    });
  } else {
    profile.displayName = cleanDisplayName;
    profile.lastLoginAt = new Date();
    await profile.save();
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

export function redactPlayerProfile(profile) {
  return {
    player: toPublicPlayer(profile),
    progression: profile.progression,
    preferences: profile.preferences,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

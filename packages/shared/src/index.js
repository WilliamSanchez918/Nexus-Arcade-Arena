import { z } from 'zod';

export const PLAYER_SLOTS = ['P1', 'P2'];
export const GAME_MODES = ['solo', 'versus', 'co-op', 'guest'];
export const QR_LOGIN_STATUSES = ['pending', 'claimed', 'expired', 'cancelled'];
export const TWO_FACTOR_PURPOSES = ['player_login', 'operator_login'];
export const AVATAR_BODY_TYPES = ['hero', 'street', 'runner', 'android', 'guardian'];
export const AVATAR_EQUIPMENT_SLOTS = [
  'body',
  'head',
  'hair',
  'helmet',
  'visor',
  'outfit',
  'boots',
  'back',
  'trail',
  'aura',
  'frame',
  'badge',
  'pose',
  'emote'
];
export const AVATAR_COSMETIC_TYPES = [
  ...AVATAR_EQUIPMENT_SLOTS,
  'material',
  'colorway'
];
export const AVATAR_MANIFEST_VERSION = 'nexus-avatar-manifest/v1';
export const AVATAR_RENDER_TARGETS = ['shared', '2d', '3d'];
export const PASSPORT_SCOPE_CATALOG = Object.freeze([
  {
    scope: 'passport:profile:read',
    label: 'Profile',
    description: 'Read the player ID, display name, level, and public profile flags.'
  },
  {
    scope: 'passport:avatar:read',
    label: 'Avatar',
    description: 'Read the versioned avatar manifest for 2D and 3D game rendering.'
  },
  {
    scope: 'passport:stats:read',
    label: 'Stats',
    description: 'Read per-game play counts, best scores, wins, and losses.'
  },
  {
    scope: 'passport:achievements:read',
    label: 'Achievements',
    description: 'Read achievement unlocks generated from signed game results.'
  },
  {
    scope: 'passport:leaderboard:read',
    label: 'Leaderboards',
    description: 'Read leaderboard entries connected to the player.'
  },
  {
    scope: 'passport:session:write',
    label: 'Cabinet Sessions',
    description: 'Claim or update active cabinet player sessions.'
  }
]);
export const PASSPORT_SCOPES = PASSPORT_SCOPE_CATALOG.map((item) => item.scope);

export const defaultAvatar = Object.freeze({
  manifestVersion: AVATAR_MANIFEST_VERSION,
  avatarId: 'default_neon_01',
  baseStyle: 'neon',
  bodyType: 'hero',
  bodyId: 'body_neon_hero',
  headId: 'head_neon_human',
  hairId: 'hair_glowhawk',
  helmetId: 'helmet_none',
  visorId: 'visor_shutter',
  outfitId: 'outfit_street_leather',
  bootsId: 'boots_grid_runners',
  backId: 'back_none',
  trailId: 'trail_neon',
  auraId: 'aura_none',
  materialId: 'material_gloss',
  primaryColor: '#00E5FF',
  secondaryColor: '#FF2ED1',
  accentColor: '#FFD400',
  frameId: 'frame_neon_start',
  badgeId: 'rookie',
  poseId: 'power',
  emoteId: 'emote_wave',
  animationSet: 'hero_idle',
  addons: []
});

export const xpRules = Object.freeze({
  playGame: 10,
  finishRound: 20,
  beatPersonalBest: 50,
  dailyPlay: 25,
  winVersusMatch: 75,
  topTenLocalScore: 100,
  newSiteVisited: 50
});

export const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
export const AvatarEquipmentSlotSchema = z.enum(AVATAR_EQUIPMENT_SLOTS);
export const AvatarCosmeticTypeSchema = z.enum(AVATAR_COSMETIC_TYPES);

export const AvatarAddonSchema = z.object({
  slot: AvatarEquipmentSlotSchema,
  cosmeticId: z.string().min(1),
  enabled: z.boolean().default(true)
});

export const AvatarManifestSchema = z.object({
  manifestVersion: z.literal(AVATAR_MANIFEST_VERSION).default(defaultAvatar.manifestVersion),
  avatarId: z.string().min(1).default(defaultAvatar.avatarId),
  baseStyle: z.string().min(1).default(defaultAvatar.baseStyle),
  bodyType: z.enum(AVATAR_BODY_TYPES).default(defaultAvatar.bodyType),
  bodyId: z.string().min(1).default(defaultAvatar.bodyId),
  headId: z.string().min(1).default(defaultAvatar.headId),
  hairId: z.string().min(1).default(defaultAvatar.hairId),
  helmetId: z.string().min(1).default(defaultAvatar.helmetId),
  visorId: z.string().min(1).default(defaultAvatar.visorId),
  outfitId: z.string().min(1).default(defaultAvatar.outfitId),
  bootsId: z.string().min(1).default(defaultAvatar.bootsId),
  backId: z.string().min(1).default(defaultAvatar.backId),
  trailId: z.string().min(1).default(defaultAvatar.trailId),
  auraId: z.string().min(1).default(defaultAvatar.auraId),
  materialId: z.string().min(1).default(defaultAvatar.materialId),
  primaryColor: HexColorSchema.default(defaultAvatar.primaryColor),
  secondaryColor: HexColorSchema.default(defaultAvatar.secondaryColor),
  accentColor: HexColorSchema.default(defaultAvatar.accentColor),
  frameId: z.string().min(1).default(defaultAvatar.frameId),
  badgeId: z.string().min(1).default(defaultAvatar.badgeId),
  poseId: z.string().min(1).default(defaultAvatar.poseId),
  emoteId: z.string().min(1).default(defaultAvatar.emoteId),
  animationSet: z.string().min(1).default(defaultAvatar.animationSet),
  addons: z.array(AvatarAddonSchema).max(24).default(defaultAvatar.addons)
});

export const AvatarRuntimeManifestSchema = z.object({
  manifestVersion: z.literal(AVATAR_MANIFEST_VERSION),
  target: z.enum(AVATAR_RENDER_TARGETS).default('shared'),
  avatarId: z.string().min(1),
  colors: z.object({
    primary: HexColorSchema,
    secondary: HexColorSchema,
    accent: HexColorSchema
  }),
  morphology: z.object({
    bodyType: z.enum(AVATAR_BODY_TYPES),
    bodyId: z.string().min(1),
    headId: z.string().min(1)
  }),
  equipment: z.record(z.string()),
  animation: z.object({
    poseId: z.string().min(1),
    emoteId: z.string().min(1),
    animationSet: z.string().min(1)
  }),
  addons: z.array(AvatarAddonSchema).default([]),
  compatibility: z.object({
    supportedSlots: z.array(AvatarEquipmentSlotSchema),
    supportedTargets: z.array(z.enum(AVATAR_RENDER_TARGETS))
  })
});

export const CosmeticCatalogItemSchema = z.object({
  cosmeticId: z.string().min(1),
  type: AvatarCosmeticTypeSchema,
  slot: AvatarEquipmentSlotSchema.optional(),
  title: z.string().min(1).max(80),
  description: z.string().max(240).default(''),
  rarity: z.enum(['common', 'rare', 'epic', 'founder', 'pilot']).default('common'),
  compatibleBodyTypes: z.array(z.enum(AVATAR_BODY_TYPES)).default([...AVATAR_BODY_TYPES]),
  colorMasks: z.array(z.enum(['primary', 'secondary', 'accent'])).default([]),
  asset2d: z.record(z.unknown()).default({}),
  asset3d: z.record(z.unknown()).default({}),
  preview: z.record(z.unknown()).default({}),
  unlockRule: z.record(z.unknown()).default({}),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true)
});

export const PlayerAvatarInventorySchema = z.object({
  playerId: z.string().min(1),
  cosmetics: z.array(z.object({
    cosmeticId: z.string().min(1),
    slot: AvatarEquipmentSlotSchema.optional(),
    unlockedAt: z.string().datetime().optional(),
    source: z.string().default('starter')
  })).default([]),
  badges: z.array(z.object({
    badgeId: z.string().min(1),
    unlockedAt: z.string().datetime().optional()
  })).default([]),
  equipped: z.record(z.string()).default({}),
  unlocks: z.record(z.unknown()).default({})
});

export const PlayerSlotSchema = z.enum(PLAYER_SLOTS);

export const PublicPlayerSchema = z.object({
  playerId: z.string().min(1),
  displayName: z.string().min(1).max(24),
  avatar: AvatarManifestSchema,
  level: z.number().int().min(1).default(1),
  isGuest: z.boolean().default(false)
});

export const CabinetPlayerSlotSchema = PublicPlayerSchema.extend({
  slot: PlayerSlotSchema,
  claimedAt: z.string().datetime().optional()
});

export const CabinetLoginSessionSchema = z.object({
  sessionId: z.string().min(1),
  cabinetId: z.string().min(1),
  siteId: z.string().min(1),
  status: z.enum(QR_LOGIN_STATUSES),
  desiredSlot: z.union([PlayerSlotSchema, z.literal('auto')]).default('auto'),
  playerSlot: PlayerSlotSchema.optional(),
  expiresAt: z.string().datetime(),
  qrUrl: z.string().url().optional(),
  qrDataUrl: z.string().optional(),
  pairingCode: z.string().min(4).optional(),
  player: PublicPlayerSchema.optional()
});

export const GamePlayerPayloadSchema = PublicPlayerSchema.extend({
  slot: PlayerSlotSchema,
  avatarRuntime: AvatarRuntimeManifestSchema.optional()
});

export const GameLaunchPayloadSchema = z.object({
  cabinetId: z.string().min(1),
  siteId: z.string().min(1),
  gameId: z.string().min(1),
  gameSessionId: z.string().min(1),
  mode: z.enum(GAME_MODES),
  players: z.array(GamePlayerPayloadSchema).min(1).max(2),
  issuedAt: z.string().datetime(),
  callbackSecretId: z.string().optional()
});

export const GamePlayerResultSchema = z.object({
  slot: PlayerSlotSchema,
  playerId: z.string().min(1).optional(),
  displayName: z.string().max(24).optional(),
  score: z.number().int().nonnegative(),
  result: z.string().max(64).default('finished'),
  telemetry: z.record(z.unknown()).default({})
});

export const GameResultPayloadSchema = z.object({
  idempotencyKey: z.string().min(8),
  cabinetId: z.string().min(1),
  siteId: z.string().min(1),
  gameId: z.string().min(1),
  gameSessionId: z.string().min(1),
  mode: z.enum(GAME_MODES),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  durationSeconds: z.number().nonnegative(),
  players: z.array(GamePlayerResultSchema).min(1).max(2),
  telemetry: z.record(z.unknown()).default({}),
  nonce: z.string().min(8),
  signature: z.string().optional()
});

export const CabinetHeartbeatSchema = z.object({
  cabinetId: z.string().min(1),
  siteId: z.string().min(1),
  appVersion: z.string().default('0.1.0'),
  state: z.enum(['attract', 'pairing', 'game', 'operator', 'offline', 'error']).default('attract'),
  networkOnline: z.boolean().default(true),
  activeGameId: z.string().optional(),
  activeSessionId: z.string().optional(),
  diskFreeMb: z.number().nonnegative().optional(),
  uptimeSeconds: z.number().nonnegative().optional(),
  errors: z.array(z.string()).default([])
});

export const PlayerPassportIntegrationEventSchema = z.object({
  type: z.enum([
    'player.created',
    'player.updated',
    'player.session.claimed',
    'player.game.completed',
    'player.progression.updated',
    'leaderboard.updated'
  ]),
  occurredAt: z.string().datetime(),
  playerId: z.string().optional(),
  cabinetId: z.string().optional(),
  gameId: z.string().optional(),
  payload: z.record(z.unknown()).default({})
});

export const PassportScopeSchema = z.enum(PASSPORT_SCOPES);

export const PassportAuthClientSchema = z.object({
  clientId: z.string().min(8),
  name: z.string().min(1).max(80),
  redirectUris: z.array(z.string().url()).min(1),
  allowedScopes: z.array(PassportScopeSchema).default(['passport:profile:read']),
  type: z.enum(['public', 'confidential']).default('public')
});

export const OAuthAuthorizeRequestSchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string().min(8),
  redirect_uri: z.string().url(),
  scope: z.string().default('passport:profile:read'),
  state: z.string().optional(),
  code_challenge: z.string().min(32).optional(),
  code_challenge_method: z.enum(['S256', 'plain']).default('S256'),
  player_token: z.string().optional()
});

export const OAuthTokenRequestSchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string().min(16),
  redirect_uri: z.string().url(),
  client_id: z.string().min(8),
  client_secret: z.string().optional(),
  code_verifier: z.string().optional()
});

export const OAuthTokenResponseSchema = z.object({
  access_token: z.string().min(16),
  token_type: z.literal('Bearer').default('Bearer'),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().optional(),
  scope: z.string(),
  passport: z.record(z.unknown()).optional(),
  passport_profile: PublicPlayerSchema.optional()
});

export const TokenIntrospectionResponseSchema = z.object({
  active: z.boolean(),
  client_id: z.string().optional(),
  sub: z.string().optional(),
  scope: z.string().optional(),
  exp: z.number().optional(),
  passport_profile: PublicPlayerSchema.optional(),
  passport: z.record(z.unknown()).optional()
});

export const TwoFactorChallengeResponseSchema = z.object({
  requiresTwoFactor: z.literal(true),
  challengeId: z.string().min(12),
  purpose: z.enum(TWO_FACTOR_PURPOSES),
  delivery: z.object({
    type: z.enum(['email', 'sms', 'local']),
    destination: z.string()
  }),
  expiresAt: z.string().datetime(),
  devCode: z.string().regex(/^\d{6}$/).optional()
});

export function normalizeDisplayName(displayName) {
  return String(displayName || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 24);
}

export function normalizeDisplayNameKey(displayName) {
  return normalizeDisplayName(displayName).toLowerCase();
}

export function levelFromXp(xp) {
  const safeXp = Math.max(0, Number(xp) || 0);
  return Math.max(1, Math.floor(Math.sqrt(safeXp / 100)) + 1);
}

export function describePassportScopes(scopes = []) {
  const requested = new Set(scopes);
  return PASSPORT_SCOPE_CATALOG.filter((item) => requested.has(item.scope));
}

export function exportAvatarRuntimeManifest(avatarInput = defaultAvatar, { target = 'shared' } = {}) {
  const avatarSource = typeof avatarInput?.toObject === 'function'
    ? avatarInput.toObject()
    : avatarInput;
  const avatar = AvatarManifestSchema.parse({
    ...defaultAvatar,
    ...(avatarSource || {})
  });
  return AvatarRuntimeManifestSchema.parse({
    manifestVersion: avatar.manifestVersion,
    target,
    avatarId: avatar.avatarId,
    colors: {
      primary: avatar.primaryColor,
      secondary: avatar.secondaryColor,
      accent: avatar.accentColor
    },
    morphology: {
      bodyType: avatar.bodyType,
      bodyId: avatar.bodyId,
      headId: avatar.headId
    },
    equipment: {
      body: avatar.bodyId,
      head: avatar.headId,
      hair: avatar.hairId,
      helmet: avatar.helmetId,
      visor: avatar.visorId,
      outfit: avatar.outfitId,
      boots: avatar.bootsId,
      back: avatar.backId,
      trail: avatar.trailId,
      aura: avatar.auraId,
      frame: avatar.frameId,
      badge: avatar.badgeId,
      material: avatar.materialId
    },
    animation: {
      poseId: avatar.poseId,
      emoteId: avatar.emoteId,
      animationSet: avatar.animationSet
    },
    addons: avatar.addons.filter((addon) => addon.enabled),
    compatibility: {
      supportedSlots: [...AVATAR_EQUIPMENT_SLOTS],
      supportedTargets: [...AVATAR_RENDER_TARGETS]
    }
  });
}

export function publicPlayerFromProfile(profile, overrides = {}) {
  const progression = profile.progression || {};
  return PublicPlayerSchema.parse({
    playerId: String(profile._id || profile.id || profile.playerId),
    displayName: profile.displayName,
    avatar: profile.avatar || defaultAvatar,
    level: progression.level || levelFromXp(progression.xp || 0),
    isGuest: false,
    ...overrides
  });
}

export function guestPlayer(slot = 'P1') {
  const avatar = { ...defaultAvatar, avatarId: 'guest_bot', badgeId: 'guest' };
  return GamePlayerPayloadSchema.parse({
    slot,
    playerId: 'guest',
    displayName: 'GUEST',
    avatar,
    avatarRuntime: exportAvatarRuntimeManifest(avatar, { target: '2d' }),
    level: 1,
    isGuest: true
  });
}

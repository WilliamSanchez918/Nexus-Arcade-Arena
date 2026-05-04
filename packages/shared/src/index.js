import { z } from 'zod';

export const PLAYER_SLOTS = ['P1', 'P2'];
export const GAME_MODES = ['solo', 'versus', 'co-op', 'guest'];
export const QR_LOGIN_STATUSES = ['pending', 'claimed', 'expired', 'cancelled'];
export const PASSPORT_SCOPES = [
  'passport:profile:read',
  'passport:avatar:read',
  'passport:stats:read',
  'passport:session:write'
];

export const defaultAvatar = Object.freeze({
  avatarId: 'default_neon_01',
  baseStyle: 'neon',
  primaryColor: '#00E5FF',
  secondaryColor: '#FF2ED1',
  frameId: 'none',
  badgeId: 'rookie',
  poseId: 'idle'
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

export const AvatarManifestSchema = z.object({
  avatarId: z.string().min(1).default(defaultAvatar.avatarId),
  baseStyle: z.string().min(1).default(defaultAvatar.baseStyle),
  primaryColor: HexColorSchema.default(defaultAvatar.primaryColor),
  secondaryColor: HexColorSchema.default(defaultAvatar.secondaryColor),
  frameId: z.string().min(1).default(defaultAvatar.frameId),
  badgeId: z.string().min(1).default(defaultAvatar.badgeId),
  poseId: z.string().min(1).default(defaultAvatar.poseId)
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
  slot: PlayerSlotSchema
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
  passport_profile: PublicPlayerSchema
});

export const TokenIntrospectionResponseSchema = z.object({
  active: z.boolean(),
  client_id: z.string().optional(),
  sub: z.string().optional(),
  scope: z.string().optional(),
  exp: z.number().optional(),
  passport_profile: PublicPlayerSchema.optional()
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
  return GamePlayerPayloadSchema.parse({
    slot,
    playerId: 'guest',
    displayName: 'GUEST',
    avatar: { ...defaultAvatar, avatarId: 'guest_bot', badgeId: 'guest' },
    level: 1,
    isGuest: true
  });
}

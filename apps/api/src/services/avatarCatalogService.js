import {
  AvatarEquipmentSlotSchema,
  AvatarManifestSchema,
  CosmeticCatalogItemSchema,
  PlayerAvatarInventorySchema,
  defaultAvatar
} from '../../../../packages/shared/src/index.js';
import {
  CosmeticItem,
  PlayerInventory,
  PlayerProfile
} from '../models/index.js';

export const avatarCatalogItems = Object.freeze([
  {
    cosmeticId: 'body_runner_core',
    type: 'body',
    slot: 'body',
    title: 'Runner Core',
    description: 'Balanced arcade runner proportions for 2D and 3D games.',
    rarity: 'common',
    compatibleBodyTypes: ['runner'],
    asset2d: { shape: 'runner-silhouette' },
    asset3d: { primitive: 'athletic-rig' },
    preview: { swatch: '#00E5FF' },
    sortOrder: 10
  },
  {
    cosmeticId: 'body_android_prime',
    type: 'body',
    slot: 'body',
    title: 'Android Prime',
    description: 'Sharper shoulders and plated limbs for sci-fi games.',
    rarity: 'rare',
    compatibleBodyTypes: ['android'],
    asset2d: { shape: 'android-silhouette' },
    asset3d: { primitive: 'plated-rig' },
    preview: { swatch: '#8B2CFF' },
    unlockRule: { xpRequired: 250 },
    sortOrder: 20
  },
  {
    cosmeticId: 'head_spark',
    type: 'head',
    slot: 'head',
    title: 'Spark Head',
    description: 'Clean Player Passport starter head.',
    rarity: 'common',
    colorMasks: ['primary'],
    asset2d: { shape: 'round-head' },
    asset3d: { primitive: 'sphere-head' },
    sortOrder: 30
  },
  {
    cosmeticId: 'head_arcade_star',
    type: 'head',
    slot: 'head',
    title: 'Arcade Star',
    description: 'A sharper profile built for leaderboard portraits.',
    rarity: 'rare',
    colorMasks: ['primary', 'accent'],
    asset2d: { shape: 'star-head' },
    asset3d: { primitive: 'faceted-head' },
    unlockRule: { xpRequired: 500 },
    sortOrder: 40
  },
  {
    cosmeticId: 'helmet_vector',
    type: 'helmet',
    slot: 'helmet',
    title: 'Vector Helmet',
    description: 'Neon-trim helmet with a universal game-safe silhouette.',
    rarity: 'common',
    colorMasks: ['secondary'],
    asset2d: { layer: 'helmet-vector' },
    asset3d: { primitive: 'helmet-band' },
    sortOrder: 50
  },
  {
    cosmeticId: 'helmet_champion_crown',
    type: 'helmet',
    slot: 'helmet',
    title: 'Champion Crown',
    description: 'High-score crown reserved for competitive events.',
    rarity: 'epic',
    colorMasks: ['accent'],
    asset2d: { layer: 'crown' },
    asset3d: { primitive: 'crown-spikes' },
    unlockRule: { achievementId: 'rush_run_top_10' },
    sortOrder: 60
  },
  {
    cosmeticId: 'visor_clear',
    type: 'visor',
    slot: 'visor',
    title: 'Clear Visor',
    description: 'Minimal visor that keeps profile portraits readable.',
    rarity: 'common',
    asset2d: { layer: 'visor-clear' },
    asset3d: { primitive: 'visor-slab' },
    sortOrder: 70
  },
  {
    cosmeticId: 'visor_prism',
    type: 'visor',
    slot: 'visor',
    title: 'Prism Visor',
    description: 'Reflective visor for premium avatar looks.',
    rarity: 'rare',
    colorMasks: ['secondary', 'accent'],
    asset2d: { layer: 'visor-prism' },
    asset3d: { primitive: 'visor-glass' },
    unlockRule: { xpRequired: 350 },
    sortOrder: 80
  },
  {
    cosmeticId: 'outfit_grid',
    type: 'outfit',
    slot: 'outfit',
    title: 'Grid Suit',
    description: 'Starter racing suit with color-mask support.',
    rarity: 'common',
    colorMasks: ['primary', 'secondary'],
    asset2d: { layer: 'grid-suit' },
    asset3d: { primitive: 'torso-panels' },
    sortOrder: 90
  },
  {
    cosmeticId: 'outfit_founder_jacket',
    type: 'outfit',
    slot: 'outfit',
    title: 'Founder Jacket',
    description: 'Pilot-founder jacket for early Nexus Passport profiles.',
    rarity: 'founder',
    colorMasks: ['accent'],
    asset2d: { layer: 'founder-jacket' },
    asset3d: { primitive: 'jacket-shell' },
    unlockRule: { pilotOnly: true },
    sortOrder: 100
  },
  {
    cosmeticId: 'back_none',
    type: 'back',
    slot: 'back',
    title: 'No Back Gear',
    description: 'Clean silhouette for lightweight games.',
    rarity: 'common',
    asset2d: { layer: 'none' },
    asset3d: { primitive: 'none' },
    sortOrder: 110
  },
  {
    cosmeticId: 'back_boost_pack',
    type: 'back',
    slot: 'back',
    title: 'Boost Pack',
    description: 'Compact back add-on for speed-focused games.',
    rarity: 'rare',
    colorMasks: ['secondary', 'accent'],
    asset2d: { layer: 'boost-pack' },
    asset3d: { primitive: 'backpack-thrusters' },
    unlockRule: { xpRequired: 700 },
    sortOrder: 120
  },
  {
    cosmeticId: 'trail_neon',
    type: 'trail',
    slot: 'trail',
    title: 'Neon Trail',
    description: 'Reusable motion trail for runners and racers.',
    rarity: 'common',
    colorMasks: ['primary'],
    asset2d: { particle: 'line-trail' },
    asset3d: { particle: 'ribbon-trail' },
    sortOrder: 130
  },
  {
    cosmeticId: 'trail_comet',
    type: 'trail',
    slot: 'trail',
    title: 'Comet Trail',
    description: 'Longer particle trail for games with fast movement.',
    rarity: 'epic',
    colorMasks: ['accent'],
    asset2d: { particle: 'spark-trail' },
    asset3d: { particle: 'comet-ribbon' },
    unlockRule: { xpRequired: 1200 },
    sortOrder: 140
  },
  {
    cosmeticId: 'aura_none',
    type: 'aura',
    slot: 'aura',
    title: 'No Aura',
    description: 'No ambient effect.',
    rarity: 'common',
    asset2d: { effect: 'none' },
    asset3d: { effect: 'none' },
    sortOrder: 150
  },
  {
    cosmeticId: 'aura_electric',
    type: 'aura',
    slot: 'aura',
    title: 'Electric Aura',
    description: 'Subtle pulsing aura for cabinet and profile previews.',
    rarity: 'rare',
    colorMasks: ['secondary'],
    asset2d: { effect: 'pulse-ring' },
    asset3d: { effect: 'halo-ring' },
    unlockRule: { xpRequired: 900 },
    sortOrder: 160
  },
  {
    cosmeticId: 'frame_neon_start',
    type: 'frame',
    slot: 'frame',
    title: 'Neon Start Frame',
    description: 'Starter portrait frame for cabinet cards.',
    rarity: 'common',
    colorMasks: ['primary'],
    asset2d: { frame: 'rounded-neon' },
    asset3d: { frame: 'none' },
    sortOrder: 170
  },
  {
    cosmeticId: 'badge_rookie',
    type: 'badge',
    slot: 'badge',
    title: 'Rookie Badge',
    description: 'First Passport badge.',
    rarity: 'common',
    asset2d: { icon: 'rookie' },
    asset3d: { decal: 'rookie' },
    sortOrder: 180
  },
  {
    cosmeticId: 'pose_idle',
    type: 'pose',
    slot: 'pose',
    title: 'Ready Pose',
    description: 'Neutral pose for game-safe profile rendering.',
    rarity: 'common',
    asset2d: { pose: 'idle' },
    asset3d: { pose: 'idle' },
    sortOrder: 190
  },
  {
    cosmeticId: 'pose_victory',
    type: 'pose',
    slot: 'pose',
    title: 'Victory Pose',
    description: 'Celebration pose shown after saved scores.',
    rarity: 'rare',
    asset2d: { pose: 'victory' },
    asset3d: { pose: 'victory' },
    unlockRule: { achievementId: 'first_saved_score' },
    sortOrder: 200
  }
].map((item) => CosmeticCatalogItemSchema.parse(item)));

const starterCosmeticIds = new Set([
  defaultAvatar.bodyId,
  defaultAvatar.headId,
  defaultAvatar.helmetId,
  defaultAvatar.visorId,
  defaultAvatar.outfitId,
  defaultAvatar.backId,
  defaultAvatar.trailId,
  defaultAvatar.auraId,
  defaultAvatar.frameId,
  `badge_${defaultAvatar.badgeId}`,
  `pose_${defaultAvatar.poseId}`,
  'head_arcade_star',
  'visor_prism',
  'outfit_founder_jacket',
  'aura_electric'
]);

const avatarFieldBySlot = Object.freeze({
  body: 'bodyId',
  head: 'headId',
  helmet: 'helmetId',
  visor: 'visorId',
  outfit: 'outfitId',
  back: 'backId',
  trail: 'trailId',
  aura: 'auraId',
  frame: 'frameId',
  badge: 'badgeId',
  pose: 'poseId'
});

function avatarValueForSlot(slot, cosmeticId) {
  if (slot === 'badge') {
    return cosmeticId.replace(/^badge_/, '');
  }
  if (slot === 'pose') {
    return cosmeticId.replace(/^pose_/, '');
  }
  return cosmeticId;
}

export function defaultEquippedFromAvatar(avatarInput = defaultAvatar) {
  const avatar = AvatarManifestSchema.parse(avatarInput);
  return {
    body: avatar.bodyId,
    head: avatar.headId,
    helmet: avatar.helmetId,
    visor: avatar.visorId,
    outfit: avatar.outfitId,
    back: avatar.backId,
    trail: avatar.trailId,
    aura: avatar.auraId,
    frame: avatar.frameId,
    badge: `badge_${avatar.badgeId}`,
    pose: `pose_${avatar.poseId}`
  };
}

function mapToPlainObject(value) {
  if (!value) {
    return {};
  }
  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }
  return Object.fromEntries(Object.entries(value));
}

export async function ensureStarterCosmetics() {
  await Promise.all(avatarCatalogItems.map((item) => CosmeticItem.updateOne(
    { cosmeticId: item.cosmeticId },
    { $set: item },
    { upsert: true }
  )));
}

export async function ensurePlayerInventory(playerId, avatarInput = defaultAvatar) {
  await ensureStarterCosmetics();
  const defaultEquipped = defaultEquippedFromAvatar(avatarInput);
  const starterCosmetics = avatarCatalogItems
    .filter((item) => starterCosmeticIds.has(item.cosmeticId))
    .map((item) => ({
      cosmeticId: item.cosmeticId,
      slot: item.slot,
      source: 'starter'
    }));

  let inventory = await PlayerInventory.findOne({ playerId });
  if (!inventory) {
    return PlayerInventory.create({
      playerId,
      cosmetics: starterCosmetics,
      badges: [{ badgeId: defaultAvatar.badgeId }],
      equipped: defaultEquipped
    });
  }

  const ownedIds = new Set(inventory.cosmetics.map((item) => item.cosmeticId));
  for (const item of starterCosmetics) {
    if (!ownedIds.has(item.cosmeticId)) {
      inventory.cosmetics.push(item);
    }
  }

  const equipped = {
    ...defaultEquipped,
    ...mapToPlainObject(inventory.equipped)
  };
  inventory.equipped = equipped;
  await inventory.save();
  return inventory;
}

export async function getAvatarCatalog() {
  await ensureStarterCosmetics();
  const items = await CosmeticItem.find({ active: true }).sort({ sortOrder: 1, title: 1 }).lean();
  return { items };
}

export async function getPlayerAvatarInventory(playerId) {
  const profile = await PlayerProfile.findById(playerId);
  if (!profile) {
    const error = new Error('Player profile not found');
    error.statusCode = 404;
    throw error;
  }

  const inventory = await ensurePlayerInventory(playerId, profile.avatar || defaultAvatar);
  return PlayerAvatarInventorySchema.parse({
    playerId: String(playerId),
    cosmetics: inventory.cosmetics.map((item) => ({
      cosmeticId: item.cosmeticId,
      slot: item.slot,
      source: item.source,
      unlockedAt: item.unlockedAt?.toISOString()
    })),
    badges: inventory.badges.map((badge) => ({
      badgeId: badge.badgeId,
      unlockedAt: badge.unlockedAt?.toISOString()
    })),
    equipped: mapToPlainObject(inventory.equipped),
    unlocks: inventory.unlocks || {}
  });
}

export async function equipPlayerCosmetic(playerId, { slot, cosmeticId }) {
  const parsedSlot = AvatarEquipmentSlotSchema.parse(slot);
  const catalogItem = await CosmeticItem.findOne({ cosmeticId, active: true });
  if (!catalogItem || catalogItem.slot !== parsedSlot) {
    const error = new Error('Cosmetic is not available for that avatar slot');
    error.statusCode = 400;
    throw error;
  }

  const inventory = await ensurePlayerInventory(playerId);
  const owned = inventory.cosmetics.some((item) => item.cosmeticId === cosmeticId);
  if (!owned) {
    const error = new Error('Cosmetic is locked for this player');
    error.statusCode = 403;
    throw error;
  }

  const profile = await PlayerProfile.findById(playerId);
  if (!profile) {
    const error = new Error('Player profile not found');
    error.statusCode = 404;
    throw error;
  }

  const equipped = {
    ...mapToPlainObject(inventory.equipped),
    [parsedSlot]: cosmeticId
  };
  inventory.equipped = equipped;

  const nextAvatar = AvatarManifestSchema.parse({
    ...(profile.avatar?.toObject?.() || profile.avatar || defaultAvatar),
    [avatarFieldBySlot[parsedSlot]]: avatarValueForSlot(parsedSlot, cosmeticId)
  });
  if (parsedSlot === 'body' && cosmeticId.includes('android')) {
    nextAvatar.bodyType = 'android';
  } else if (parsedSlot === 'body') {
    nextAvatar.bodyType = 'runner';
  }
  profile.avatar = nextAvatar;

  await Promise.all([inventory.save(), profile.save()]);
  return {
    profile,
    inventory: await getPlayerAvatarInventory(playerId)
  };
}

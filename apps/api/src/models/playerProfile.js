import mongoose from 'mongoose';
import { defaultAvatar } from '../../../../packages/shared/src/index.js';

const AvatarManifestSchema = new mongoose.Schema({
  avatarId: { type: String, default: defaultAvatar.avatarId },
  baseStyle: { type: String, default: defaultAvatar.baseStyle },
  bodyType: { type: String, default: defaultAvatar.bodyType },
  bodyId: { type: String, default: defaultAvatar.bodyId },
  headId: { type: String, default: defaultAvatar.headId },
  hairId: { type: String, default: defaultAvatar.hairId },
  helmetId: { type: String, default: defaultAvatar.helmetId },
  visorId: { type: String, default: defaultAvatar.visorId },
  outfitId: { type: String, default: defaultAvatar.outfitId },
  bootsId: { type: String, default: defaultAvatar.bootsId },
  backId: { type: String, default: defaultAvatar.backId },
  trailId: { type: String, default: defaultAvatar.trailId },
  auraId: { type: String, default: defaultAvatar.auraId },
  materialId: { type: String, default: defaultAvatar.materialId },
  primaryColor: { type: String, default: defaultAvatar.primaryColor },
  secondaryColor: { type: String, default: defaultAvatar.secondaryColor },
  accentColor: { type: String, default: defaultAvatar.accentColor },
  frameId: { type: String, default: defaultAvatar.frameId },
  badgeId: { type: String, default: defaultAvatar.badgeId },
  poseId: { type: String, default: defaultAvatar.poseId },
  emoteId: { type: String, default: defaultAvatar.emoteId },
  animationSet: { type: String, default: defaultAvatar.animationSet },
  addons: [{
    slot: String,
    cosmeticId: String,
    enabled: { type: Boolean, default: true }
  }]
}, { _id: false });

const PlayerProfileSchema = new mongoose.Schema({
  displayName: { type: String, required: true, trim: true, maxlength: 24 },
  normalizedDisplayName: { type: String, required: true, unique: true, index: true },
  avatar: { type: AvatarManifestSchema, default: () => ({}) },
  progression: {
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    lifetimePlays: { type: Number, default: 0 }
  },
  preferences: {
    publicLeaderboard: { type: Boolean, default: true },
    showAvatarOnAttract: { type: Boolean, default: true },
    preferredInitials: { type: String, maxlength: 3 }
  },
  status: { type: String, enum: ['active', 'restricted', 'deleted'], default: 'active' },
  lastLoginAt: Date,
  lastPlayedAt: Date
}, { timestamps: true });

export const PlayerProfile = mongoose.models.PlayerProfile || mongoose.model('PlayerProfile', PlayerProfileSchema);

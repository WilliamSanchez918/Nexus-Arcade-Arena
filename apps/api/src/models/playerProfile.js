import mongoose from 'mongoose';
import { defaultAvatar } from '../../../../packages/shared/src/index.js';

const AvatarManifestSchema = new mongoose.Schema({
  avatarId: { type: String, default: defaultAvatar.avatarId },
  baseStyle: { type: String, default: defaultAvatar.baseStyle },
  primaryColor: { type: String, default: defaultAvatar.primaryColor },
  secondaryColor: { type: String, default: defaultAvatar.secondaryColor },
  frameId: { type: String, default: defaultAvatar.frameId },
  badgeId: { type: String, default: defaultAvatar.badgeId },
  poseId: { type: String, default: defaultAvatar.poseId }
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

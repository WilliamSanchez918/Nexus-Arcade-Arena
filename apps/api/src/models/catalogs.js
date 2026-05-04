import mongoose from 'mongoose';

const AchievementSchema = new mongoose.Schema({
  achievementId: { type: String, required: true, unique: true, index: true },
  gameId: { type: String, index: true },
  title: String,
  description: String,
  xpReward: { type: Number, default: 0 },
  criteria: { type: Object, default: {} },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const CosmeticItemSchema = new mongoose.Schema({
  cosmeticId: { type: String, required: true, unique: true, index: true },
  type: {
    type: String,
    enum: ['body', 'head', 'helmet', 'visor', 'outfit', 'back', 'trail', 'aura', 'frame', 'badge', 'pose', 'material', 'colorway', 'emote'],
    required: true
  },
  slot: { type: String, index: true },
  title: String,
  description: String,
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'founder', 'pilot'], default: 'common' },
  compatibleBodyTypes: { type: [String], default: ['runner', 'android', 'sprite', 'guardian'] },
  colorMasks: { type: [String], default: [] },
  asset2d: { type: Object, default: {} },
  asset3d: { type: Object, default: {} },
  preview: { type: Object, default: {} },
  unlockRule: { type: Object, default: {} },
  sortOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const Achievement = mongoose.models.Achievement || mongoose.model('Achievement', AchievementSchema);
export const CosmeticItem = mongoose.models.CosmeticItem || mongoose.model('CosmeticItem', CosmeticItemSchema);

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
  type: { type: String, enum: ['base', 'helmet', 'visor', 'frame', 'badge', 'pose', 'color'], required: true },
  title: String,
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'founder'], default: 'common' },
  unlockRule: { type: Object, default: {} },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const Achievement = mongoose.models.Achievement || mongoose.model('Achievement', AchievementSchema);
export const CosmeticItem = mongoose.models.CosmeticItem || mongoose.model('CosmeticItem', CosmeticItemSchema);

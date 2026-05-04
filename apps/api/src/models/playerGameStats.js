import mongoose from 'mongoose';

const PlayerGameStatsSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', required: true, index: true },
  gameId: { type: String, required: true, index: true },
  totalPlays: { type: Number, default: 0 },
  bestScore: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  achievements: [{ achievementId: String, unlockedAt: Date }],
  cosmeticsUnlocked: [{ cosmeticId: String, unlockedAt: Date }],
  lastPlayedAt: Date
}, { timestamps: true });

PlayerGameStatsSchema.index({ playerId: 1, gameId: 1 }, { unique: true });

export const PlayerGameStats = mongoose.models.PlayerGameStats || mongoose.model('PlayerGameStats', PlayerGameStatsSchema);

import mongoose from 'mongoose';

const LeaderboardEntrySchema = new mongoose.Schema({
  gameId: { type: String, required: true, index: true },
  scope: { type: String, enum: ['site', 'global'], default: 'global', index: true },
  siteId: { type: String, index: true },
  season: { type: String, default: 'all-time', index: true },
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', index: true },
  displayName: String,
  avatarSnapshot: Object,
  score: { type: Number, required: true, index: true },
  gameSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' },
  achievedAt: { type: Date, default: Date.now }
}, { timestamps: true });

LeaderboardEntrySchema.index({ gameId: 1, scope: 1, siteId: 1, season: 1, score: -1 });

export const LeaderboardEntry = mongoose.models.LeaderboardEntry || mongoose.model('LeaderboardEntry', LeaderboardEntrySchema);

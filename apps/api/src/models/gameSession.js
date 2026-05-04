import mongoose from 'mongoose';

const GameSessionPlayerSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile' },
  slot: { type: String, enum: ['P1', 'P2'], required: true },
  displayName: String,
  avatarSnapshot: Object,
  level: { type: Number, default: 1 },
  isGuest: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  result: String
}, { _id: false });

const GameSessionSchema = new mongoose.Schema({
  cabinetId: { type: String, required: true, index: true },
  siteId: { type: String, required: true, index: true },
  gameId: { type: String, required: true, index: true },
  mode: { type: String, enum: ['solo', 'versus', 'co-op', 'guest'], required: true },
  players: { type: [GameSessionPlayerSchema], default: [] },
  startedAt: Date,
  endedAt: Date,
  status: { type: String, enum: ['active', 'completed', 'failed', 'queued'], default: 'active', index: true },
  idempotencyKey: { type: String, sparse: true, unique: true },
  telemetry: {
    durationSeconds: Number,
    creditsUsed: Number,
    errors: [String],
    raw: { type: Object, default: {} }
  },
  syncStatus: { type: String, enum: ['synced', 'pending', 'failed'], default: 'synced' },
  claimTokenHash: String,
  claimExpiresAt: Date
}, { timestamps: true });

export const GameSession = mongoose.models.GameSession || mongoose.model('GameSession', GameSessionSchema);

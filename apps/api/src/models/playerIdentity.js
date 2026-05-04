import mongoose from 'mongoose';

const PlayerIdentitySchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', required: true, index: true },
  provider: { type: String, enum: ['dev', 'email', 'phone', 'passkey'], default: 'dev', index: true },
  identifier: { type: String, required: true },
  verifiedAt: Date,
  metadata: { type: Object, default: {} }
}, { timestamps: true });

PlayerIdentitySchema.index({ provider: 1, identifier: 1 }, { unique: true });

export const PlayerIdentity = mongoose.models.PlayerIdentity || mongoose.model('PlayerIdentity', PlayerIdentitySchema);

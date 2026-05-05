import mongoose from 'mongoose';

const CabinetLoginSessionSchema = new mongoose.Schema({
  cabinetId: { type: String, required: true, index: true },
  siteId: { type: String, required: true, index: true },
  desiredSlot: { type: String, enum: ['P1', 'P2', 'auto'], default: 'auto' },
  pairingCode: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'claimed', 'expired', 'cancelled'], default: 'pending', index: true },
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile' },
  playerSlot: { type: String, enum: ['P1', 'P2'] },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  claimedAt: Date
}, { timestamps: true });

export const CabinetLoginSession = mongoose.models.CabinetLoginSession ||
  mongoose.model('CabinetLoginSession', CabinetLoginSessionSchema);

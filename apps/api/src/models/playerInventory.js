import mongoose from 'mongoose';

const PlayerInventorySchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', required: true, unique: true, index: true },
  cosmetics: [{
    cosmeticId: String,
    slot: String,
    unlockedAt: { type: Date, default: Date.now },
    source: String
  }],
  badges: [{
    badgeId: String,
    unlockedAt: { type: Date, default: Date.now }
  }],
  equipped: { type: Map, of: String, default: () => new Map() },
  unlocks: { type: Object, default: {} }
}, { timestamps: true });

export const PlayerInventory = mongoose.models.PlayerInventory || mongoose.model('PlayerInventory', PlayerInventorySchema);

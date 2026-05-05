import mongoose from 'mongoose';

const PlayerIdentitySchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', required: true, index: true },
  provider: { type: String, enum: ['dev', 'email', 'phone', 'passkey', 'supabase', 'managed-auth'], default: 'dev', index: true },
  identifier: { type: String, required: true },
  authProvider: { type: String, index: true },
  authUserId: { type: String, index: true },
  emailVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  metadata: { type: Object, default: {} }
}, { timestamps: true });

PlayerIdentitySchema.index({ provider: 1, identifier: 1 }, { unique: true });
PlayerIdentitySchema.index({ authProvider: 1, authUserId: 1 }, {
  unique: true,
  partialFilterExpression: { authProvider: { $exists: true }, authUserId: { $exists: true } }
});

export const PlayerIdentity = mongoose.models.PlayerIdentity || mongoose.model('PlayerIdentity', PlayerIdentitySchema);

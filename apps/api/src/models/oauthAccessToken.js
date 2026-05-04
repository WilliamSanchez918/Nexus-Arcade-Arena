import mongoose from 'mongoose';

const OAuthAccessTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  refreshTokenHash: { type: String, index: true },
  clientId: { type: String, required: true, index: true },
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', required: true, index: true },
  scope: { type: [String], default: [] },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: Date
}, { timestamps: true });

export const OAuthAccessToken = mongoose.models.OAuthAccessToken ||
  mongoose.model('OAuthAccessToken', OAuthAccessTokenSchema);

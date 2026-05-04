import mongoose from 'mongoose';

const OAuthAuthorizationCodeSchema = new mongoose.Schema({
  codeHash: { type: String, required: true, unique: true, index: true },
  clientId: { type: String, required: true, index: true },
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', required: true, index: true },
  redirectUri: { type: String, required: true },
  scope: { type: [String], default: [] },
  codeChallenge: String,
  codeChallengeMethod: { type: String, enum: ['S256', 'plain'], default: 'S256' },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  consumedAt: Date
}, { timestamps: true });

export const OAuthAuthorizationCode = mongoose.models.OAuthAuthorizationCode ||
  mongoose.model('OAuthAuthorizationCode', OAuthAuthorizationCodeSchema);

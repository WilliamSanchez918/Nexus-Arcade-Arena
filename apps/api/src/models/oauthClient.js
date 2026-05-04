import mongoose from 'mongoose';

const OAuthClientSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true, index: true },
  clientSecretHash: String,
  name: { type: String, required: true },
  redirectUris: { type: [String], required: true },
  allowedScopes: { type: [String], default: ['passport:profile:read'] },
  type: { type: String, enum: ['public', 'confidential'], default: 'public' },
  status: { type: String, enum: ['active', 'disabled'], default: 'active', index: true }
}, { timestamps: true });

export const OAuthClient = mongoose.models.OAuthClient || mongoose.model('OAuthClient', OAuthClientSchema);

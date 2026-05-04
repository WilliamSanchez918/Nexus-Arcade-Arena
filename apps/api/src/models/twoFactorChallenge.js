import mongoose from 'mongoose';

const TwoFactorChallengeSchema = new mongoose.Schema({
  challengeId: { type: String, required: true, unique: true, index: true },
  purpose: { type: String, enum: ['player_login', 'operator_login'], required: true, index: true },
  subjectId: { type: String, required: true, index: true },
  subjectDisplayName: String,
  codeHash: { type: String, required: true },
  delivery: {
    type: { type: String, enum: ['email', 'sms', 'local'], default: 'local' },
    destination: { type: String, default: 'local dev console' }
  },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  consumedAt: Date,
  metadata: { type: Object, default: {} }
}, { timestamps: true });

export const TwoFactorChallenge = mongoose.models.TwoFactorChallenge || mongoose.model('TwoFactorChallenge', TwoFactorChallengeSchema);

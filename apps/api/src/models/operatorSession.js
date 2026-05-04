import mongoose from 'mongoose';

const OperatorSessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  operatorId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: Date,
  lastUsedAt: Date
}, { timestamps: true });

export const OperatorSession = mongoose.models.OperatorSession || mongoose.model('OperatorSession', OperatorSessionSchema);

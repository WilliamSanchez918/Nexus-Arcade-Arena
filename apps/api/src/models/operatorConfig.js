import mongoose from 'mongoose';

const OperatorConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  general: {
    siteId: String,
    cabinetId: String,
    appBaseUrl: String,
    apiBaseUrl: String
  },
  security: {
    playerTwoFactorRequired: { type: Boolean, default: true },
    operatorTwoFactorRequired: { type: Boolean, default: true },
    twoFactorTtlSeconds: Number,
    twoFactorMaxAttempts: Number,
    exposeDevTwoFactorCodes: Boolean,
    operatorSessionTtlSeconds: Number,
    clientManagementRequiresOperator2fa: { type: Boolean, default: true }
  },
  qr: {
    qrTokenTtlSeconds: Number
  },
  oauth: {
    issuer: String
  },
  updatedBy: String
}, { timestamps: true });

export const OperatorConfig = mongoose.models.OperatorConfig || mongoose.model('OperatorConfig', OperatorConfigSchema);

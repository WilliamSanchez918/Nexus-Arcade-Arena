import mongoose from 'mongoose';

const HeartbeatLogSchema = new mongoose.Schema({
  cabinetId: { type: String, required: true, index: true },
  siteId: { type: String, required: true, index: true },
  appVersion: String,
  state: String,
  networkOnline: Boolean,
  activeGameId: String,
  activeSessionId: String,
  diskFreeMb: Number,
  uptimeSeconds: Number,
  errors: [String],
  receivedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true, suppressReservedKeysWarning: true });

export const HeartbeatLog = mongoose.models.HeartbeatLog || mongoose.model('HeartbeatLog', HeartbeatLogSchema);

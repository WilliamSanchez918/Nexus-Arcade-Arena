import mongoose from 'mongoose';

const ActivePlayerSchema = new mongoose.Schema({
  slot: { type: String, enum: ['P1', 'P2'], required: true },
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile' },
  displayName: String,
  avatar: Object,
  level: { type: Number, default: 1 },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CabinetLoginSession' },
  claimedAt: Date,
  lastSeenAt: Date
}, { _id: false });

const CabinetSchema = new mongoose.Schema({
  cabinetId: { type: String, required: true, unique: true, index: true },
  siteId: { type: String, required: true, index: true },
  label: String,
  status: { type: String, enum: ['online', 'offline', 'maintenance', 'disabled'], default: 'offline' },
  config: { type: Object, default: {} },
  activePlayers: { type: [ActivePlayerSchema], default: [] },
  lastHeartbeatAt: Date,
  lastState: String,
  appVersion: String
}, { timestamps: true });

export const Cabinet = mongoose.models.Cabinet || mongoose.model('Cabinet', CabinetSchema);

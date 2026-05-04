import mongoose from 'mongoose';

const SyncQueueItemSchema = new mongoose.Schema({
  source: { type: String, enum: ['cabinet', 'api'], default: 'cabinet', index: true },
  cabinetId: { type: String, index: true },
  type: { type: String, required: true, index: true },
  idempotencyKey: { type: String, required: true, unique: true, index: true },
  payload: { type: Object, required: true },
  status: { type: String, enum: ['pending', 'processing', 'synced', 'failed'], default: 'pending', index: true },
  attempts: { type: Number, default: 0 },
  lastError: String,
  nextAttemptAt: Date
}, { timestamps: true });

export const SyncQueueItem = mongoose.models.SyncQueueItem || mongoose.model('SyncQueueItem', SyncQueueItemSchema);

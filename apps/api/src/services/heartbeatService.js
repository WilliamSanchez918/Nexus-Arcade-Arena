import { CabinetHeartbeatSchema } from '../../../../packages/shared/src/index.js';
import { Cabinet, HeartbeatLog } from '../models/index.js';

export async function recordHeartbeat(input, io) {
  const heartbeat = CabinetHeartbeatSchema.parse(input);
  const receivedAt = new Date();

  await HeartbeatLog.create({ ...heartbeat, receivedAt });
  await Cabinet.updateOne(
    { cabinetId: heartbeat.cabinetId },
    {
      $setOnInsert: { cabinetId: heartbeat.cabinetId, siteId: heartbeat.siteId },
      $set: {
        siteId: heartbeat.siteId,
        status: heartbeat.networkOnline ? 'online' : 'offline',
        lastHeartbeatAt: receivedAt,
        lastState: heartbeat.state,
        appVersion: heartbeat.appVersion
      }
    },
    { upsert: true }
  );

  io?.to?.(`cabinet:${heartbeat.cabinetId}`)?.emit('cabinet.heartbeat', heartbeat);
  return { ok: true, receivedAt: receivedAt.toISOString() };
}

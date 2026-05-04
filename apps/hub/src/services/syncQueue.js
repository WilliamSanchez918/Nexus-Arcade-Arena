import fs from 'node:fs/promises';
import path from 'node:path';

export async function enqueueSyncItem(queuePath, item) {
  await fs.mkdir(path.dirname(queuePath), { recursive: true });
  const record = {
    queuedAt: new Date().toISOString(),
    attempts: 0,
    ...item
  };
  await fs.appendFile(queuePath, `${JSON.stringify(record)}\n`, 'utf8');
  return record;
}

export async function readSyncQueue(queuePath) {
  try {
    const text = await fs.readFile(queuePath, 'utf8');
    return text
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function rewriteSyncQueue(queuePath, records) {
  await fs.mkdir(path.dirname(queuePath), { recursive: true });
  const text = records.map((record) => JSON.stringify(record)).join('\n');
  await fs.writeFile(queuePath, text ? `${text}\n` : '', 'utf8');
}

export async function flushSyncQueue({ queuePath, send }) {
  const records = await readSyncQueue(queuePath);
  const remaining = [];
  const synced = [];

  for (const record of records) {
    try {
      await send(record);
      synced.push(record);
    } catch (error) {
      remaining.push({
        ...record,
        attempts: (record.attempts || 0) + 1,
        lastError: error.message,
        lastAttemptAt: new Date().toISOString()
      });
    }
  }

  await rewriteSyncQueue(queuePath, remaining);
  return { synced, remaining };
}

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..', '..');

export const hubConfig = {
  cabinetId: process.env.CABINET_ID || 'NEXUS-CAB-001',
  siteId: process.env.SITE_ID || 'COSTLEY-HQ',
  apiBaseUrl: process.env.API_BASE_URL || 'http://127.0.0.1:3000',
  godotRushRunPath: process.env.GODOT_RUSH_RUN_PATH || '',
  rushRunWebUrl: process.env.RUSH_RUN_WEB_URL || 'http://127.0.0.1:5175',
  gameCallbackSecret: process.env.GAME_CALLBACK_SECRET || 'local-dev-game-callback-secret',
  gameCallbackPort: Number(process.env.GAME_CALLBACK_PORT || 43871),
  syncQueuePath: path.resolve(process.cwd(), process.env.SYNC_QUEUE_PATH || 'apps/hub/.runtime/sync-queue.jsonl'),
  runtimeDir: path.resolve(packageRoot, '.runtime'),
  devServerUrl: process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5174'
};

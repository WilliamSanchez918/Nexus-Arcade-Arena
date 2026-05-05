import { app, ipcMain } from 'electron';
import os from 'node:os';
import { io as createSocketClient } from 'socket.io-client';
import { hubConfig } from './config.js';
import { createHubWindow } from './window.js';
import { HubApiClient } from './apiClient.js';
import { createGameCallbackServer } from '../services/gameCallbackServer.js';
import { launchGame } from '../services/gameLauncher.js';
import { enqueueSyncItem, flushSyncQueue } from '../services/syncQueue.js';

const api = new HubApiClient({ apiBaseUrl: hubConfig.apiBaseUrl });
let callbackServerState;
let socket;

async function ensureCallbackServer() {
  if (callbackServerState) {
    return callbackServerState;
  }
  callbackServerState = await createGameCallbackServer({
    port: hubConfig.gameCallbackPort,
    secret: hubConfig.gameCallbackSecret,
    onResult: async (payload) => {
      try {
        return await api.endGameSession(payload);
      } catch (error) {
        await enqueueSyncItem(hubConfig.syncQueuePath, {
          type: 'game-result',
          idempotencyKey: payload.idempotencyKey,
          payload,
          lastError: error.message
        });
        return { queued: true };
      }
    }
  });
  return callbackServerState;
}

function registerIpc() {
  ipcMain.handle('hub:get-config', () => ({
    cabinetId: hubConfig.cabinetId,
    siteId: hubConfig.siteId,
    apiBaseUrl: hubConfig.apiBaseUrl,
    hasNexusRelayPath: Boolean(hubConfig.godotNexusRelayPath),
    hasNexusRelayProject: Boolean(hubConfig.godotNexusRelayProjectPath),
    gameCallbackPort: hubConfig.gameCallbackPort
  }));

  ipcMain.handle('hub:create-login-session', async (_event, desiredSlot = 'auto') => api.createLoginSession({
    cabinetId: hubConfig.cabinetId,
    siteId: hubConfig.siteId,
    desiredSlot
  }));

  ipcMain.handle('hub:get-active-players', async () => api.getActivePlayers(hubConfig.cabinetId));

  ipcMain.handle('hub:logout-player', async (_event, slot) => api.logoutPlayer(hubConfig.cabinetId, slot));

  async function launchNexusRelay() {
    const active = await api.getActivePlayers(hubConfig.cabinetId);
    const activePlayers = (active.activePlayers || []).filter((player) => player?.slot && player?.playerId);
    const players = activePlayers.length > 0
      ? activePlayers.map((player) => ({ slot: player.slot, playerId: player.playerId }))
      : [{ slot: 'P1', playerId: 'guest' }];
    const start = await api.startGameSession({
      cabinetId: hubConfig.cabinetId,
      siteId: hubConfig.siteId,
      gameId: 'nexus_relay',
      mode: players.length > 1 ? 'co-op' : 'solo',
      players
    });
    const { callbackUrl } = await ensureCallbackServer();
    return launchGame({
      launchPayload: start.launchPayload,
      executablePath: hubConfig.godotNexusRelayPath,
      godotCommand: hubConfig.godotCommand,
      godotProjectPath: hubConfig.godotNexusRelayProjectPath,
      callbackUrl,
      callbackSecret: hubConfig.gameCallbackSecret,
      runtimeDir: hubConfig.runtimeDir
    });
  }

  ipcMain.handle('hub:launch-nexus-relay', launchNexusRelay);
  ipcMain.handle('hub:launch-rush-run', launchNexusRelay);

  ipcMain.handle('hub:diagnostics', async () => ({
    cabinetId: hubConfig.cabinetId,
    siteId: hubConfig.siteId,
    hostname: os.hostname(),
    platform: os.platform(),
    uptimeSeconds: Math.floor(os.uptime()),
    networkOnline: true,
    cpuCount: os.cpus().length,
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024)
  }));

  ipcMain.handle('hub:heartbeat', async (_event, state = 'attract') => api.heartbeat(hubConfig.cabinetId, {
    cabinetId: hubConfig.cabinetId,
    siteId: hubConfig.siteId,
    appVersion: app.getVersion(),
    state,
    networkOnline: true,
    uptimeSeconds: Math.floor(os.uptime())
  }));

  ipcMain.handle('hub:flush-sync-queue', async () => flushSyncQueue({
    queuePath: hubConfig.syncQueuePath,
    send: (record) => api.endGameSession(record.payload)
  }));
}

app.whenReady().then(async () => {
  registerIpc();
  socket = createSocketClient(hubConfig.apiBaseUrl, { transports: ['websocket', 'polling'] });
  socket.on('connect', () => {
    socket.emit('cabinet:join', { cabinetId: hubConfig.cabinetId });
  });
  await ensureCallbackServer();
  await createHubWindow();
});

app.on('window-all-closed', () => {
  callbackServerState?.server?.close();
  socket?.close();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

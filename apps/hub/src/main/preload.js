const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nexusHub', {
  getConfig: () => ipcRenderer.invoke('hub:get-config'),
  createLoginSession: (desiredSlot) => ipcRenderer.invoke('hub:create-login-session', desiredSlot),
  getActivePlayers: () => ipcRenderer.invoke('hub:get-active-players'),
  logoutPlayer: (slot) => ipcRenderer.invoke('hub:logout-player', slot),
  launchNexusRelay: () => ipcRenderer.invoke('hub:launch-nexus-relay'),
  launchRushRun: () => ipcRenderer.invoke('hub:launch-rush-run'),
  diagnostics: () => ipcRenderer.invoke('hub:diagnostics'),
  heartbeat: (state) => ipcRenderer.invoke('hub:heartbeat', state),
  flushSyncQueue: () => ipcRenderer.invoke('hub:flush-sync-queue')
});

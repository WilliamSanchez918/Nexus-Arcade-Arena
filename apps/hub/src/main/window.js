import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BrowserWindow } from 'electron';
import { hubConfig } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createHubWindow() {
  const win = new BrowserWindow({
    width: 1080,
    height: 1920,
    fullscreen: false,
    autoHideMenuBar: true,
    backgroundColor: '#060a14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.webContents.on('console-message', (_event, detailsOrLevel, message, line, sourceId) => {
    const details = typeof detailsOrLevel === 'object'
      ? detailsOrLevel
      : { level: detailsOrLevel, message, lineNumber: line, sourceId };
    console.log(`[hub-renderer:${details.level}] ${details.message} (${details.sourceId}:${details.lineNumber})`);
  });
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[hub-renderer] failed to load ${validatedURL}: ${errorCode} ${errorDescription}`);
  });
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error(`[hub-renderer] render process gone: ${details.reason}`);
  });

  if (process.env.NODE_ENV === 'production') {
    await win.loadFile(path.resolve(__dirname, '..', '..', 'dist', 'renderer', 'index.html'));
  } else {
    await win.loadURL(hubConfig.devServerUrl);
  }

  return win;
}

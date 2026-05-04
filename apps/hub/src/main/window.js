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

  if (process.env.NODE_ENV === 'production') {
    await win.loadFile(path.resolve(__dirname, '..', '..', 'dist', 'renderer', 'index.html'));
  } else {
    await win.loadURL(hubConfig.devServerUrl);
  }

  return win;
}

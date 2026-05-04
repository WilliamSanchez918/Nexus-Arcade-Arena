import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: appRoot,
  build: {
    outDir: path.join(appRoot, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1800
  }
});

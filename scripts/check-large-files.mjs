import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const maxBytes = Number(process.env.MAX_TRACKED_FILE_BYTES || 5 * 1024 * 1024);
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', '.runtime', '.vite', 'coverage']);
const oversized = [];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }
    const stat = await fs.stat(fullPath);
    if (stat.size > maxBytes) {
      oversized.push({ path: path.relative(root, fullPath), size: stat.size });
    }
  }
}

await walk(root);

if (oversized.length) {
  console.error(`Found files over ${maxBytes} bytes:`);
  for (const file of oversized) {
    console.error(`${file.size}\t${file.path}`);
  }
  process.exitCode = 1;
} else {
  console.log(`No local source files exceed ${maxBytes} bytes.`);
}

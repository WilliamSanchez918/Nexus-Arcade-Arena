import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const gameRuntimeRoots = [
  'apps/rush-run/src',
  'games/nexus-relay/scripts'
];
const forbiddenPatterns = [
  /@supabase\//i,
  /\bsupabase\b/i,
  /\bpostgrest\b/i,
  /\bauth\/v1\b/i,
  /\brest\/v1\b/i,
  /\brealtime\/v1\b/i
];
const runtimeFileExtensions = new Set(['.gd', '.js', '.jsx', '.ts', '.tsx', '.json']);

async function runtimeFiles(root) {
  const absoluteRoot = path.join(repoRoot, root);
  const entries = await readdir(absoluteRoot, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(absoluteRoot, entry.name);
    if (entry.isDirectory()) {
      files.push(...await runtimeFiles(path.relative(repoRoot, absolutePath)));
      continue;
    }
    if (!entry.isFile() || !runtimeFileExtensions.has(path.extname(entry.name))) {
      continue;
    }
    files.push(absolutePath);
  }
  return files;
}

test('game runtimes integrate through Nexus, not Supabase directly', async () => {
  const roots = [];
  for (const root of gameRuntimeRoots) {
    const rootStats = await stat(path.join(repoRoot, root));
    assert.equal(rootStats.isDirectory(), true, `${root} should exist`);
    roots.push(...await runtimeFiles(root));
  }

  const violations = [];
  for (const file of roots) {
    const content = await readFile(file, 'utf8');
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        violations.push(path.relative(repoRoot, file));
        break;
      }
    }
  }

  assert.deepEqual(violations, [], 'Game runtime code must use Nexus launch payloads, Passport APIs, and Hub callbacks instead of Supabase directly.');
});

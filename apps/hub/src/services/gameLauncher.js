import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { GameLaunchPayloadSchema } from '../../../../packages/shared/src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');

function simulatorPath() {
  return path.resolve(repoRoot, 'tools', 'game-simulator', 'index.js');
}

export function buildLaunchCommand({ executablePath, payloadPath, callbackUrl }) {
  if (executablePath) {
    return {
      command: executablePath,
      args: ['--nexus-session-payload', payloadPath, '--nexus-result-callback', callbackUrl],
      usingSimulator: false,
      usingGodotProject: false
    };
  }

  return {
    command: process.execPath,
    args: [simulatorPath(), '--nexus-session-payload', payloadPath, '--nexus-result-callback', callbackUrl],
    usingSimulator: true,
    usingGodotProject: false
  };
}

export function buildGodotProjectCommand({ godotCommand, projectPath, payloadPath, callbackUrl }) {
  return {
    command: godotCommand || 'godot',
    args: [
      '--path',
      projectPath,
      '--',
      '--nexus-session-payload',
      payloadPath,
      '--nexus-result-callback',
      callbackUrl
    ],
    usingSimulator: false,
    usingGodotProject: true
  };
}

export function buildWebGameUrl({ webUrl, launchPayload, callbackUrl, callbackSecret }) {
  const payload = GameLaunchPayloadSchema.parse(launchPayload);
  const url = new URL(webUrl);
  url.searchParams.set('payload', Buffer.from(JSON.stringify(payload)).toString('base64url'));
  url.searchParams.set('callback', callbackUrl);
  url.searchParams.set('callbackSecret', callbackSecret);
  return url.toString();
}

export async function launchGame({
  launchPayload,
  executablePath,
  godotCommand,
  godotProjectPath,
  callbackUrl,
  callbackSecret,
  runtimeDir
}) {
  const payload = GameLaunchPayloadSchema.parse(launchPayload);
  await fs.mkdir(runtimeDir, { recursive: true });
  const payloadPath = path.join(runtimeDir, `launch-${payload.gameSessionId}.json`);
  await fs.writeFile(payloadPath, JSON.stringify(payload, null, 2), 'utf8');

  const commandSpec = executablePath
    ? buildLaunchCommand({ executablePath, payloadPath, callbackUrl })
    : godotProjectPath
      ? buildGodotProjectCommand({ godotCommand, projectPath: godotProjectPath, payloadPath, callbackUrl })
      : buildLaunchCommand({ executablePath, payloadPath, callbackUrl });

  const child = spawn(commandSpec.command, commandSpec.args, {
    detached: false,
    stdio: 'ignore',
    env: {
      ...process.env,
      NEXUS_GAME_CALLBACK_SECRET: callbackSecret
    }
  });
  child.unref();

  return {
    ...commandSpec,
    payloadPath,
    pid: child.pid
  };
}

import {
  GameLaunchPayloadSchema,
  GameResultPayloadSchema,
  guestPlayer
} from '../../../packages/shared/src/index.js';

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return atob(padded);
}

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((sorted, key) => {
      if (value[key] !== undefined && key !== 'signature') {
        sorted[key] = sortValue(value[key]);
      }
      return sorted;
    }, {});
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(sortValue(value));
}

export function parseLaunchParams(search = window.location.search) {
  const params = new URLSearchParams(search);
  const encodedPayload = params.get('payload');
  const callbackUrl = params.get('callback');
  const callbackSecret = params.get('callbackSecret');

  if (!encodedPayload) {
    return {
      launchPayload: demoLaunchPayload(),
      callbackUrl,
      callbackSecret
    };
  }

  return {
    launchPayload: GameLaunchPayloadSchema.parse(JSON.parse(base64UrlDecode(encodedPayload))),
    callbackUrl,
    callbackSecret
  };
}

export function demoLaunchPayload() {
  return GameLaunchPayloadSchema.parse({
    cabinetId: 'DEMO-CABINET',
    siteId: 'LOCAL-DEMO',
    gameId: 'rush_run',
    gameSessionId: `demo-${Date.now()}`,
    mode: 'solo',
    players: [guestPlayer('P1')],
    issuedAt: new Date().toISOString()
  });
}

export async function signResultPayload(payload, secret) {
  if (!secret) {
    return undefined;
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(canonicalJson(payload)));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function buildSignedResult({ launchPayload, score, durationSeconds, boosts, collisions, callbackSecret }) {
  const startedAt = new Date(Date.now() - durationSeconds * 1000).toISOString();
  const endedAt = new Date().toISOString();
  const unsigned = GameResultPayloadSchema.parse({
    idempotencyKey: crypto.randomUUID(),
    cabinetId: launchPayload.cabinetId,
    siteId: launchPayload.siteId,
    gameId: launchPayload.gameId,
    gameSessionId: launchPayload.gameSessionId,
    mode: launchPayload.mode,
    startedAt,
    endedAt,
    durationSeconds,
    players: launchPayload.players.map((player, index) => ({
      slot: player.slot,
      playerId: player.playerId,
      displayName: player.displayName,
      score: Math.max(0, Math.round(score - index * 200)),
      result: index === 0 ? 'win' : 'finished',
      telemetry: { boosts, collisions }
    })),
    telemetry: { source: 'rush-run-web', boosts, collisions },
    nonce: crypto.randomUUID()
  });

  return {
    ...unsigned,
    signature: await signResultPayload(unsigned, callbackSecret)
  };
}

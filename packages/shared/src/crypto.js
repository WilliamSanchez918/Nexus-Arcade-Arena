import crypto from 'node:crypto';

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((sorted, key) => {
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

export function signGameResult(payload, secret) {
  if (!secret) {
    throw new Error('GAME_CALLBACK_SECRET is required to sign game results');
  }
  return crypto.createHmac('sha256', secret).update(canonicalJson(payload)).digest('hex');
}

export function verifyGameResultSignature(payload, secret) {
  if (!payload?.signature) {
    return false;
  }
  const expected = signGameResult(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(payload.signature), Buffer.from(expected));
}

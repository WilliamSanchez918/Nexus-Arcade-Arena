import crypto from 'node:crypto';
import { config } from '../config.js';

const PAIRING_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function hashToken(token, pepper = config.passportTokenSecret) {
  return crypto.createHash('sha256').update(`${pepper}:${token}`).digest('hex');
}

export function generatePairingCode(length = 6) {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    const randomIndex = crypto.randomInt(0, PAIRING_CODE_ALPHABET.length);
    code += PAIRING_CODE_ALPHABET[randomIndex];
  }
  return code;
}

export function safeEqualHash(left, right) {
  if (!left || !right || left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

export function sha256Base64Url(value) {
  return crypto.createHash('sha256').update(value).digest('base64url');
}

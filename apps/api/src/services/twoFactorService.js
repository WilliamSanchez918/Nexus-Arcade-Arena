import crypto from 'node:crypto';
import {
  TWO_FACTOR_PURPOSES,
  TwoFactorChallengeResponseSchema
} from '../../../../packages/shared/src/index.js';
import { TwoFactorChallenge } from '../models/index.js';
import { config } from '../config.js';
import {
  hashToken,
  randomToken,
  safeEqualHash
} from './tokenService.js';

export function generateTwoFactorCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function maskDestination({ email, phone }) {
  if (email) {
    const [name = '', domain = ''] = String(email).trim().toLowerCase().split('@');
    const visible = name.slice(0, 2).padEnd(Math.min(2, name.length), '*');
    return {
      type: 'email',
      destination: `${visible}${name.length > 2 ? '***' : ''}@${domain || 'email'}`
    };
  }
  if (phone) {
    const digits = String(phone).replace(/\D/g, '');
    return {
      type: 'sms',
      destination: digits.length > 4 ? `***-${digits.slice(-4)}` : 'phone'
    };
  }
  return { type: 'local', destination: 'local dev challenge' };
}

export async function createTwoFactorChallenge({
  purpose,
  subjectId,
  subjectDisplayName,
  email,
  phone,
  metadata = {}
}) {
  if (!TWO_FACTOR_PURPOSES.includes(purpose)) {
    const error = new Error('Unsupported 2FA purpose');
    error.statusCode = 400;
    throw error;
  }

  const code = generateTwoFactorCode();
  const expiresAt = new Date(Date.now() + config.twoFactorTtlSeconds * 1000);
  const delivery = maskDestination({ email, phone });
  const challenge = await TwoFactorChallenge.create({
    challengeId: `mfa_${randomToken(18)}`,
    purpose,
    subjectId: String(subjectId),
    subjectDisplayName,
    codeHash: hashToken(code, config.passportTokenSecret),
    delivery,
    maxAttempts: config.twoFactorMaxAttempts,
    expiresAt,
    metadata
  });

  const response = {
    requiresTwoFactor: true,
    challengeId: challenge.challengeId,
    purpose,
    delivery,
    expiresAt: expiresAt.toISOString(),
    devCode: config.exposeDevTwoFactorCodes ? code : undefined
  };
  return TwoFactorChallengeResponseSchema.parse(response);
}

export async function verifyTwoFactorChallenge({ challengeId, code, purpose }) {
  const challenge = await TwoFactorChallenge.findOne({ challengeId, purpose });
  if (!challenge || challenge.consumedAt) {
    const error = new Error('Invalid or consumed 2FA challenge');
    error.statusCode = 401;
    throw error;
  }
  if (challenge.expiresAt <= new Date()) {
    const error = new Error('2FA challenge expired');
    error.statusCode = 401;
    throw error;
  }
  if (challenge.attempts >= challenge.maxAttempts) {
    const error = new Error('2FA challenge attempts exceeded');
    error.statusCode = 429;
    throw error;
  }

  challenge.attempts += 1;
  const codeHash = hashToken(String(code || ''), config.passportTokenSecret);
  if (!safeEqualHash(codeHash, challenge.codeHash)) {
    await challenge.save();
    const error = new Error('Invalid 2FA code');
    error.statusCode = 401;
    throw error;
  }

  challenge.consumedAt = new Date();
  await challenge.save();
  return challenge;
}

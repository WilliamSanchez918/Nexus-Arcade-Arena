import { OperatorSession } from '../models/index.js';
import { config } from '../config.js';
import {
  hashToken,
  randomToken,
  safeEqualHash
} from './tokenService.js';
import {
  createTwoFactorChallenge,
  verifyTwoFactorChallenge
} from './twoFactorService.js';
import { getSecurityRuntimeConfig } from './operatorConfigService.js';

export async function startOperatorLogin({ operatorId, pin }) {
  const cleanOperatorId = String(operatorId || '').trim();
  if (!cleanOperatorId || cleanOperatorId !== config.operatorId || !safeEqualHash(String(pin || ''), config.operatorPin)) {
    const error = new Error('Invalid operator credentials');
    error.statusCode = 401;
    throw error;
  }

  return createTwoFactorChallenge({
    purpose: 'operator_login',
    subjectId: cleanOperatorId,
    subjectDisplayName: cleanOperatorId,
    metadata: { role: 'operator' }
  });
}

export async function verifyOperatorLogin({ challengeId, code }) {
  const challenge = await verifyTwoFactorChallenge({
    challengeId,
    code,
    purpose: 'operator_login'
  });
  const operatorToken = `op_${randomToken(32)}`;
  const runtimeConfig = await getSecurityRuntimeConfig();
  const expiresAt = new Date(Date.now() + runtimeConfig.operatorSessionTtlSeconds * 1000);
  await OperatorSession.create({
    tokenHash: hashToken(operatorToken, config.passportTokenSecret),
    operatorId: challenge.subjectId,
    expiresAt,
    lastUsedAt: new Date()
  });

  return {
    operatorToken,
    operator: {
      operatorId: challenge.subjectId,
      role: challenge.metadata?.role || 'operator'
    },
    expiresAt: expiresAt.toISOString()
  };
}

export async function requireOperatorSession(req, _res, next) {
  try {
    const rawToken = req.header('x-operator-token') || String(req.header('authorization') || '').replace(/^Bearer\s+/i, '');
    const tokenHash = hashToken(rawToken || '', config.passportTokenSecret);
    const session = await OperatorSession.findOne({
      tokenHash,
      revokedAt: { $exists: false }
    });
    if (!session || session.expiresAt <= new Date()) {
      const error = new Error('Operator 2FA session is required');
      error.statusCode = 401;
      throw error;
    }
    session.lastUsedAt = new Date();
    await session.save();
    req.operator = {
      operatorId: session.operatorId
    };
    next();
  } catch (error) {
    next(error);
  }
}

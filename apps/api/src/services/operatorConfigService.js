import { z } from 'zod';
import { OperatorConfig } from '../models/index.js';
import { config } from '../config.js';

const CONFIG_KEY = 'pilot';

const secondsRange = (minimum, maximum) => z.coerce.number().int().min(minimum).max(maximum);
const OptionalUrlSchema = z.string().url().optional();

const OperatorConfigPatchSchema = z.object({
  general: z.object({
    siteId: z.string().trim().min(1).max(80).optional(),
    cabinetId: z.string().trim().min(1).max(80).optional(),
    appBaseUrl: OptionalUrlSchema,
    apiBaseUrl: OptionalUrlSchema
  }).partial().optional(),
  security: z.object({
    twoFactorTtlSeconds: secondsRange(60, 1800).optional(),
    twoFactorMaxAttempts: secondsRange(1, 10).optional(),
    exposeDevTwoFactorCodes: z.boolean().optional(),
    operatorSessionTtlSeconds: secondsRange(900, 86400).optional()
  }).partial().optional(),
  qr: z.object({
    qrTokenTtlSeconds: secondsRange(60, 1800).optional()
  }).partial().optional(),
  oauth: z.object({
    issuer: OptionalUrlSchema
  }).partial().optional()
}).strict();

export function defaultOperatorConfig() {
  return {
    key: CONFIG_KEY,
    general: {
      siteId: config.siteId,
      cabinetId: config.cabinetId,
      appBaseUrl: config.appBaseUrl,
      apiBaseUrl: config.apiBaseUrl
    },
    security: {
      playerTwoFactorRequired: true,
      operatorTwoFactorRequired: true,
      twoFactorTtlSeconds: config.twoFactorTtlSeconds,
      twoFactorMaxAttempts: config.twoFactorMaxAttempts,
      exposeDevTwoFactorCodes: config.exposeDevTwoFactorCodes,
      operatorSessionTtlSeconds: config.operatorSessionTtlSeconds,
      clientManagementRequiresOperator2fa: true
    },
    qr: {
      qrTokenTtlSeconds: config.qrTokenTtlSeconds
    },
    oauth: {
      issuer: config.oauthIssuer
    }
  };
}

function normalizeConfig(doc) {
  const defaults = defaultOperatorConfig();
  const raw = doc?.toObject?.() || doc || {};
  return {
    key: CONFIG_KEY,
    general: { ...defaults.general, ...(raw.general || {}) },
    security: {
      ...defaults.security,
      ...(raw.security || {}),
      playerTwoFactorRequired: true,
      operatorTwoFactorRequired: true,
      clientManagementRequiresOperator2fa: true
    },
    qr: { ...defaults.qr, ...(raw.qr || {}) },
    oauth: { ...defaults.oauth, ...(raw.oauth || {}) },
    updatedBy: raw.updatedBy,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  };
}

export async function getOperatorConfig() {
  const defaults = defaultOperatorConfig();
  const doc = await OperatorConfig.findOneAndUpdate(
    { key: CONFIG_KEY },
    { $setOnInsert: defaults },
    { upsert: true, new: true }
  );
  return normalizeConfig(doc);
}

export async function updateOperatorConfig(input, operatorId = 'operator') {
  const patch = OperatorConfigPatchSchema.parse(input || {});
  const current = await getOperatorConfig();
  const next = normalizeConfig({
    ...current,
    general: { ...current.general, ...(patch.general || {}) },
    security: { ...current.security, ...(patch.security || {}) },
    qr: { ...current.qr, ...(patch.qr || {}) },
    oauth: { ...current.oauth, ...(patch.oauth || {}) },
    updatedBy: operatorId
  });

  const doc = await OperatorConfig.findOneAndUpdate(
    { key: CONFIG_KEY },
    { $set: next },
    { new: true, upsert: true }
  );
  return normalizeConfig(doc);
}

export async function getSecurityRuntimeConfig() {
  return (await getOperatorConfig()).security;
}

export async function getQrRuntimeConfig() {
  const effective = await getOperatorConfig();
  return {
    ...effective.qr,
    appBaseUrl: effective.general.appBaseUrl,
    apiBaseUrl: effective.general.apiBaseUrl
  };
}

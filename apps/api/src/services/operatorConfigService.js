import { z } from 'zod';
import os from 'node:os';
import { OperatorConfig } from '../models/index.js';
import { config } from '../config.js';

const CONFIG_KEY = 'pilot';

const secondsRange = (minimum, maximum) => z.coerce.number().int().min(minimum).max(maximum);
const OptionalUrlSchema = z.string().url().optional();
const OptionalUrlOrEmptySchema = z.union([z.string().url(), z.literal('')]).optional();
const DeploymentEnvironmentSchema = z.enum(['local', 'staging', 'production']);
const IdentityProviderSchema = z.enum(['local-dev', 'supabase', 'managed-auth']);

const OperatorConfigPatchSchema = z.object({
  tenant: z.object({
    tenantId: z.string().trim().min(1).max(80).optional(),
    tenantName: z.string().trim().min(1).max(120).optional(),
    deploymentEnvironment: DeploymentEnvironmentSchema.optional()
  }).partial().optional(),
  general: z.object({
    siteId: z.string().trim().min(1).max(80).optional(),
    cabinetId: z.string().trim().min(1).max(80).optional(),
    appBaseUrl: OptionalUrlSchema,
    apiBaseUrl: OptionalUrlSchema
  }).partial().optional(),
  identity: z.object({
    provider: IdentityProviderSchema.optional(),
    supabaseProjectUrl: OptionalUrlOrEmptySchema,
    issuer: OptionalUrlOrEmptySchema,
    jwksUrl: OptionalUrlOrEmptySchema,
    audience: z.string().trim().min(1).max(120).optional()
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
    tenant: {
      tenantId: config.tenantId,
      tenantName: config.tenantName,
      deploymentEnvironment: config.deploymentEnvironment
    },
    general: {
      siteId: config.siteId,
      cabinetId: config.cabinetId,
      appBaseUrl: config.appBaseUrl,
      apiBaseUrl: config.apiBaseUrl
    },
    identity: {
      provider: config.identityProvider,
      supabaseProjectUrl: config.supabaseProjectUrl,
      issuer: config.identityIssuer,
      jwksUrl: config.identityJwksUrl,
      audience: config.identityAudience
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
  const rawIdentity = raw.identity || {};
  const identity = config.identityProvider !== 'local-dev'
    && (!rawIdentity.provider || rawIdentity.provider === 'local-dev')
    ? defaults.identity
    : { ...defaults.identity, ...rawIdentity };
  return {
    key: CONFIG_KEY,
    tenant: { ...defaults.tenant, ...(raw.tenant || {}) },
    general: { ...defaults.general, ...(raw.general || {}) },
    identity,
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
    tenant: { ...current.tenant, ...(patch.tenant || {}) },
    general: { ...current.general, ...(patch.general || {}) },
    identity: { ...current.identity, ...(patch.identity || {}) },
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

function localNetworkHosts() {
  const candidates = [];
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        candidates.push({ name, address: entry.address });
      }
    }
  }
  candidates.sort((left, right) => networkInterfaceRank(left) - networkInterfaceRank(right));
  return Array.from(new Set(candidates.map(({ address }) => address)));
}

function networkInterfaceRank({ name = '', address = '' }) {
  const lowerName = name.toLowerCase();
  if (
    lowerName.includes('vethernet')
    || lowerName.includes('wsl')
    || lowerName.includes('hyper-v')
    || lowerName.includes('docker')
    || lowerName.includes('virtualbox')
    || lowerName.includes('vmware')
  ) {
    return 3;
  }
  if (address.startsWith('169.254.')) {
    return 2;
  }
  if (lowerName.includes('wi-fi') || lowerName.includes('wifi') || lowerName.includes('ethernet')) {
    return 0;
  }
  return 1;
}

export function isLoopbackUrl(value) {
  try {
    const { hostname } = new URL(value);
    return hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || hostname.startsWith('127.');
  } catch {
    return false;
  }
}

function portFromUrl(value, fallbackPort) {
  try {
    return new URL(value).port || fallbackPort;
  } catch {
    return fallbackPort;
  }
}

export function deploymentHints(effectiveConfig) {
  const appPort = portFromUrl(effectiveConfig.general.appBaseUrl, '5173');
  const apiPort = portFromUrl(effectiveConfig.general.apiBaseUrl, String(config.port));
  const hosts = localNetworkHosts();
  const suggestedAppBaseUrls = hosts.map((host) => `http://${host}:${appPort}`);
  const suggestedApiBaseUrls = hosts.map((host) => `http://${host}:${apiPort}`);
  const warnings = [];
  if (isLoopbackUrl(effectiveConfig.general.appBaseUrl)) {
    warnings.push('QR codes use the App base URL. Loopback URLs only work on this computer; phones need a LAN or public HTTPS URL.');
  }
  if (isLoopbackUrl(effectiveConfig.general.apiBaseUrl)) {
    warnings.push('API base URL is loopback-only. External clients and OAuth integrations need a reachable API URL.');
  }
  return {
    suggestedAppBaseUrls,
    suggestedApiBaseUrls,
    appBaseUrlIsLoopback: isLoopbackUrl(effectiveConfig.general.appBaseUrl),
    apiBaseUrlIsLoopback: isLoopbackUrl(effectiveConfig.general.apiBaseUrl),
    warnings
  };
}

import dotenv from 'dotenv';
import os from 'node:os';

dotenv.config();

function firstLanIpv4() {
  const candidates = [];
  const interfaces = os.networkInterfaces();
  for (const [name, entries] of Object.entries(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        candidates.push({ name, address: entry.address });
      }
    }
  }
  candidates.sort((left, right) => networkInterfaceRank(left) - networkInterfaceRank(right));
  return candidates[0]?.address || '127.0.0.1';
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

const localNetworkHost = firstLanIpv4();
const defaultAppBaseUrl = `http://${localNetworkHost}:5173`;
const defaultApiBaseUrl = `http://${localNetworkHost}:${process.env.PORT || 3000}`;
const supabaseProjectUrl = process.env.SUPABASE_PROJECT_URL || '';
const deploymentEnvironment = ['local', 'staging', 'production'].includes(process.env.DEPLOYMENT_ENVIRONMENT)
  ? process.env.DEPLOYMENT_ENVIRONMENT
  : 'local';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexus_arcade',
  tenantId: process.env.TENANT_ID || 'local-tenant',
  tenantName: process.env.TENANT_NAME || 'Local Arcade',
  deploymentEnvironment,
  appBaseUrl: process.env.APP_BASE_URL || defaultAppBaseUrl,
  apiBaseUrl: process.env.API_BASE_URL || defaultApiBaseUrl,
  identityProvider: process.env.IDENTITY_PROVIDER || 'local-dev',
  identityIssuer: process.env.IDENTITY_ISSUER || (supabaseProjectUrl ? `${supabaseProjectUrl}/auth/v1` : ''),
  identityJwksUrl: process.env.IDENTITY_JWKS_URL || (supabaseProjectUrl ? `${supabaseProjectUrl}/auth/v1/.well-known/jwks.json` : ''),
  identityAudience: process.env.IDENTITY_AUDIENCE || 'authenticated',
  supabaseProjectUrl,
  cabinetId: process.env.CABINET_ID || 'NEXUS-CAB-001',
  siteId: process.env.SITE_ID || 'COSTLEY-HQ',
  qrTokenTtlSeconds: Number(process.env.QR_SESSION_TTL_SECONDS || process.env.QR_TOKEN_TTL_SECONDS || 300),
  gameCallbackSecret: process.env.GAME_CALLBACK_SECRET || 'local-dev-game-callback-secret',
  passportTokenSecret: process.env.PASSPORT_TOKEN_SECRET || 'local-dev-passport-token-secret',
  oauthIssuer: process.env.OAUTH_ISSUER || process.env.API_BASE_URL || defaultApiBaseUrl,
  twoFactorTtlSeconds: Number(process.env.TWO_FACTOR_TTL_SECONDS || 300),
  twoFactorMaxAttempts: Number(process.env.TWO_FACTOR_MAX_ATTEMPTS || 5),
  exposeDevTwoFactorCodes: process.env.EXPOSE_DEV_2FA_CODES !== 'false',
  operatorId: process.env.OPERATOR_ID || 'operator',
  operatorPin: process.env.OPERATOR_PIN || '000000',
  operatorSessionTtlSeconds: Number(process.env.OPERATOR_SESSION_TTL_SECONDS || 28800)
};

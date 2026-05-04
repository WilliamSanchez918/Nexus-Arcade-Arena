import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexus_arcade',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  cabinetId: process.env.CABINET_ID || 'NEXUS-CAB-001',
  siteId: process.env.SITE_ID || 'COSTLEY-HQ',
  qrTokenTtlSeconds: Number(process.env.QR_TOKEN_TTL_SECONDS || 300),
  qrTokenHashPepper: process.env.QR_TOKEN_HASH_PEPPER || 'local-dev-pepper',
  gameCallbackSecret: process.env.GAME_CALLBACK_SECRET || 'local-dev-game-callback-secret',
  passportTokenSecret: process.env.PASSPORT_TOKEN_SECRET || 'local-dev-passport-token-secret',
  oauthIssuer: process.env.OAUTH_ISSUER || process.env.API_BASE_URL || 'http://localhost:3000',
  twoFactorTtlSeconds: Number(process.env.TWO_FACTOR_TTL_SECONDS || 300),
  twoFactorMaxAttempts: Number(process.env.TWO_FACTOR_MAX_ATTEMPTS || 5),
  exposeDevTwoFactorCodes: process.env.EXPOSE_DEV_2FA_CODES !== 'false',
  operatorId: process.env.OPERATOR_ID || 'operator',
  operatorPin: process.env.OPERATOR_PIN || '000000',
  operatorSessionTtlSeconds: Number(process.env.OPERATOR_SESSION_TTL_SECONDS || 28800)
};

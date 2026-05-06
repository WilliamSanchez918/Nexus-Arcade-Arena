import { config } from './config.js';

const DEVELOPMENT_SECRET_PATTERN = /^(replace-with|local-dev)/i;

function parseUrl(value) {
  try {
    return value ? new URL(value) : null;
  } catch {
    return null;
  }
}

function isLoopbackUrl(value) {
  const url = parseUrl(value);
  if (!url) {
    return false;
  }
  return url.hostname === 'localhost'
    || url.hostname === '127.0.0.1'
    || url.hostname === '::1'
    || url.hostname.startsWith('127.');
}

function isHttpsUrl(value) {
  return parseUrl(value)?.protocol === 'https:';
}

function isDevelopmentSecret(value) {
  return !value || DEVELOPMENT_SECRET_PATTERN.test(String(value));
}

export function runtimeSecurityFindings(runtimeConfig = config) {
  if (runtimeConfig.deploymentEnvironment === 'local') {
    return [];
  }

  const findings = [];
  if (runtimeConfig.identityProvider !== 'supabase') {
    findings.push('IDENTITY_PROVIDER must be supabase for non-local Nexus Player Passport auth.');
  }
  if (runtimeConfig.supabaseDeploymentMode === 'local-cli') {
    findings.push('SUPABASE_DEPLOYMENT_MODE cannot be local-cli outside local development.');
  }

  const requiredHttpsUrls = [
    ['APP_BASE_URL', runtimeConfig.appBaseUrl],
    ['API_BASE_URL', runtimeConfig.apiBaseUrl],
    ['SUPABASE_PROJECT_URL', runtimeConfig.supabaseProjectUrl],
    ['IDENTITY_ISSUER', runtimeConfig.identityIssuer],
    ['IDENTITY_JWKS_URL', runtimeConfig.identityJwksUrl],
    ['OAUTH_ISSUER', runtimeConfig.oauthIssuer]
  ];
  for (const [key, value] of requiredHttpsUrls) {
    if (!value) {
      findings.push(`${key} must be configured for non-local deployments.`);
      continue;
    }
    if (isLoopbackUrl(value)) {
      findings.push(`${key} cannot use localhost or 127.0.0.1 outside local development.`);
    }
    if (!isHttpsUrl(value)) {
      findings.push(`${key} must use HTTPS outside local development.`);
    }
  }

  if (runtimeConfig.identityAudience !== 'authenticated') {
    findings.push('IDENTITY_AUDIENCE should be authenticated for Supabase-backed Player Passport auth.');
  }
  if (isDevelopmentSecret(runtimeConfig.gameCallbackSecret)) {
    findings.push('GAME_CALLBACK_SECRET must be replaced with a non-development secret.');
  }
  if (isDevelopmentSecret(runtimeConfig.passportTokenSecret)) {
    findings.push('PASSPORT_TOKEN_SECRET must be replaced with a non-development secret.');
  }
  if (runtimeConfig.exposeDevTwoFactorCodes) {
    findings.push('EXPOSE_DEV_2FA_CODES must be false outside local development.');
  }
  if (!runtimeConfig.operatorPin || runtimeConfig.operatorPin === '000000') {
    findings.push('OPERATOR_PIN must be changed from the default before non-local deployment.');
  }
  if (runtimeConfig.deploymentEnvironment === 'production' && runtimeConfig.nodeEnv !== 'production') {
    findings.push('NODE_ENV must be production when DEPLOYMENT_ENVIRONMENT=production.');
  }

  return findings;
}

export function assertRuntimeSecurity(runtimeConfig = config) {
  const findings = runtimeSecurityFindings(runtimeConfig);
  if (findings.length) {
    throw new Error(`Nexus startup security validation failed:\n- ${findings.join('\n- ')}`);
  }
}

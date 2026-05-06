import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DOMAIN = 'arcade.costleyentertainment.com';
const DEFAULT_EMAIL = 'admin@costleyentertainment.com';
const INSECURE_PATTERN = /(your-|insecure|fake_|secret1234|xxxxxxxx|replace-with|local-dev)/i;

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    if (key === 'force-secrets') {
      args.forceSecrets = true;
      continue;
    }
    args[key] = argv[index + 1];
    index += 1;
  }
  return args;
}

function parseEnv(content = '') {
  const values = new Map();
  const order = [];
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      continue;
    }
    const [, key, value] = match;
    values.set(key, value);
    order.push(key);
  }
  return { values, order };
}

function writeEnv({ values, order }) {
  const seen = new Set();
  const lines = [];
  for (const key of order) {
    if (seen.has(key) || !values.has(key)) {
      continue;
    }
    seen.add(key);
    lines.push(`${key}=${values.get(key)}`);
  }
  for (const key of [...values.keys()].sort()) {
    if (!seen.has(key)) {
      lines.push(`${key}=${values.get(key)}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

function randomHex(bytes) {
  return crypto.randomBytes(bytes).toString('hex');
}

function randomBase64(bytes) {
  return crypto.randomBytes(bytes).toString('base64');
}

function needsGeneratedValue(value, forceSecrets = false) {
  return forceSecrets || !value || INSECURE_PATTERN.test(String(value));
}

function signHs256(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function generateOpaqueKey(prefix, projectRef = 'nexus-arcade-arena') {
  const random = crypto.randomBytes(17).toString('base64url').slice(0, 22);
  const intermediate = `${prefix}${random}`;
  const checksum = crypto
    .createHash('sha256')
    .update(`${projectRef}|${intermediate}`)
    .digest('base64url')
    .slice(0, 8);
  return `${intermediate}_${checksum}`;
}

function signEs256(payload, privateKey, kid) {
  const header = { alg: 'ES256', typ: 'JWT', kid };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.sign('SHA256', Buffer.from(data), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363'
  }).toString('base64url');
  return `${data}.${signature}`;
}

function generatedAuthValues(jwtSecret) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + (5 * 365 * 24 * 60 * 60);
  const anonPayload = { role: 'anon', iss: 'supabase', iat: issuedAt, exp: expiresAt };
  const servicePayload = { role: 'service_role', iss: 'supabase', iat: issuedAt, exp: expiresAt };
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const jwkPrivate = privateKey.export({ format: 'jwk' });
  const kid = crypto.randomUUID();
  const octKey = {
    kty: 'oct',
    k: Buffer.from(jwtSecret).toString('base64url'),
    alg: 'HS256'
  };
  const privateJwk = {
    kty: 'EC',
    kid,
    use: 'sig',
    key_ops: ['sign', 'verify'],
    alg: 'ES256',
    ext: true,
    crv: jwkPrivate.crv,
    x: jwkPrivate.x,
    y: jwkPrivate.y,
    d: jwkPrivate.d
  };
  const publicJwk = {
    kty: 'EC',
    kid,
    use: 'sig',
    key_ops: ['verify'],
    alg: 'ES256',
    ext: true,
    crv: jwkPrivate.crv,
    x: jwkPrivate.x,
    y: jwkPrivate.y
  };

  return {
    ANON_KEY: signHs256(anonPayload, jwtSecret),
    SERVICE_ROLE_KEY: signHs256(servicePayload, jwtSecret),
    SUPABASE_PUBLISHABLE_KEY: generateOpaqueKey('sb_publishable_'),
    SUPABASE_SECRET_KEY: generateOpaqueKey('sb_secret_'),
    ANON_KEY_ASYMMETRIC: signEs256(anonPayload, privateKey, kid),
    SERVICE_ROLE_KEY_ASYMMETRIC: signEs256(servicePayload, privateKey, kid),
    JWT_KEYS: JSON.stringify([privateJwk, octKey]),
    JWT_JWKS: JSON.stringify({ keys: [publicJwk, octKey] })
  };
}

function setValue(env, key, value) {
  env.values.set(key, String(value ?? ''));
  if (!env.order.includes(key)) {
    env.order.push(key);
  }
}

export function buildSelfHostedEnv({
  templateContent = '',
  existingContent = '',
  domain = DEFAULT_DOMAIN,
  appDomain,
  apiDomain,
  identityDomain,
  email = DEFAULT_EMAIL,
  forceSecrets = false
} = {}) {
  const template = parseEnv(templateContent);
  const existing = parseEnv(existingContent);
  const env = {
    values: new Map([...template.values, ...existing.values]),
    order: [...template.order, ...existing.order]
  };
  const resolvedAppDomain = appDomain || domain;
  const resolvedApiDomain = apiDomain || `api.${domain}`;
  const resolvedIdentityDomain = identityDomain || `identity.${domain}`;
  const supabaseUrl = `https://${resolvedIdentityDomain}`;
  const appUrl = `https://${resolvedAppDomain}`;
  const apiUrl = `https://${resolvedApiDomain}`;

  if (needsGeneratedValue(env.values.get('JWT_SECRET'), forceSecrets)) {
    setValue(env, 'JWT_SECRET', randomBase64(48));
  }
  const jwtSecret = env.values.get('JWT_SECRET');
  const authValues = generatedAuthValues(jwtSecret);

  for (const [key, value] of Object.entries({
    POSTGRES_PASSWORD: randomHex(24),
    SECRET_KEY_BASE: randomBase64(64),
    VAULT_ENC_KEY: randomHex(16),
    PG_META_CRYPTO_KEY: randomBase64(32),
    LOGFLARE_PUBLIC_ACCESS_TOKEN: randomBase64(32),
    LOGFLARE_PRIVATE_ACCESS_TOKEN: randomBase64(32),
    S3_PROTOCOL_ACCESS_KEY_ID: randomHex(16),
    S3_PROTOCOL_ACCESS_KEY_SECRET: randomHex(32),
    MINIO_ROOT_PASSWORD: randomHex(16),
    DASHBOARD_PASSWORD: randomHex(18),
    GAME_CALLBACK_SECRET: randomBase64(48),
    PASSPORT_TOKEN_SECRET: randomBase64(48),
    OPERATOR_PIN: String(crypto.randomInt(100000, 999999))
  })) {
    if (needsGeneratedValue(env.values.get(key), forceSecrets)) {
      setValue(env, key, value);
    }
  }

  for (const [key, value] of Object.entries(authValues)) {
    if (needsGeneratedValue(env.values.get(key), forceSecrets)) {
      setValue(env, key, value);
    }
  }

  setValue(env, 'NEXUS_DOMAIN', domain);
  setValue(env, 'NEXUS_APP_DOMAIN', resolvedAppDomain);
  setValue(env, 'NEXUS_API_DOMAIN', resolvedApiDomain);
  setValue(env, 'NEXUS_IDENTITY_DOMAIN', resolvedIdentityDomain);
  setValue(env, 'NEXUS_LETSENCRYPT_EMAIL', email);
  setValue(env, 'SUPABASE_DEPLOYMENT_MODE', 'self-hosted');
  setValue(env, 'SUPABASE_SELF_HOSTED_ENV_FILE', 'deploy/self-hosted-supabase/.env');

  setValue(env, 'SUPABASE_PUBLIC_URL', supabaseUrl);
  setValue(env, 'API_EXTERNAL_URL', supabaseUrl);
  setValue(env, 'SITE_URL', appUrl);
  setValue(env, 'ADDITIONAL_REDIRECT_URLS', `${appUrl}/play/claim,${appUrl}/player/profile,${appUrl}/operator/config`);
  setValue(env, 'STUDIO_DEFAULT_ORGANIZATION', 'Nexus Arcade');
  setValue(env, 'STUDIO_DEFAULT_PROJECT', 'Nexus Identity');
  setValue(env, 'DASHBOARD_USERNAME', env.values.get('DASHBOARD_USERNAME') || 'nexus-admin');
  setValue(env, 'ENABLE_EMAIL_AUTOCONFIRM', 'false');
  setValue(env, 'ENABLE_ANONYMOUS_USERS', 'false');
  setValue(env, 'ENABLE_PHONE_SIGNUP', 'false');
  setValue(env, 'ENABLE_PHONE_AUTOCONFIRM', 'false');
  setValue(env, 'KONG_HTTP_PORT', env.values.get('KONG_HTTP_PORT') || '127.0.0.1:8000');
  setValue(env, 'KONG_HTTPS_PORT', env.values.get('KONG_HTTPS_PORT') || '127.0.0.1:8443');
  setValue(env, 'PROXY_DOMAIN', resolvedIdentityDomain);
  setValue(env, 'CERTBOT_EMAIL', email);

  setValue(env, 'NODE_ENV', 'production');
  setValue(env, 'DEPLOYMENT_ENVIRONMENT', 'production');
  setValue(env, 'PORT', '3000');
  setValue(env, 'MONGO_URI', 'mongodb://nexus-mongo:27017/nexus_arcade');
  setValue(env, 'APP_BASE_URL', appUrl);
  setValue(env, 'API_BASE_URL', apiUrl);
  setValue(env, 'IDENTITY_PROVIDER', 'supabase');
  setValue(env, 'SUPABASE_PROJECT_URL', supabaseUrl);
  setValue(env, 'IDENTITY_ISSUER', `${supabaseUrl}/auth/v1`);
  setValue(env, 'IDENTITY_JWKS_URL', `${supabaseUrl}/auth/v1/.well-known/jwks.json`);
  setValue(env, 'IDENTITY_AUDIENCE', 'authenticated');
  setValue(env, 'VITE_IDENTITY_PROVIDER', 'supabase');
  setValue(env, 'VITE_SUPABASE_URL', supabaseUrl);
  setValue(env, 'VITE_SUPABASE_PUBLISHABLE_KEY', env.values.get('SUPABASE_PUBLISHABLE_KEY'));
  setValue(env, 'VITE_SUPABASE_ANON_KEY', env.values.get('ANON_KEY'));
  setValue(env, 'OAUTH_ISSUER', apiUrl);
  setValue(env, 'EXPOSE_DEV_2FA_CODES', 'false');
  setValue(env, 'OPERATOR_ID', env.values.get('OPERATOR_ID') || 'operator');

  return writeEnv(env);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const templatePath = args.template || path.join(repoRoot, 'deploy/self-hosted-supabase/upstream/.env.example');
  const outPath = args.out || path.join(repoRoot, 'deploy/self-hosted-supabase/.env');
  const templateContent = fs.existsSync(templatePath) ? fs.readFileSync(templatePath, 'utf8') : '';
  const existingContent = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
  const envContent = buildSelfHostedEnv({
    templateContent,
    existingContent,
    domain: args.domain || DEFAULT_DOMAIN,
    appDomain: args['app-domain'],
    apiDomain: args['api-domain'],
    identityDomain: args['identity-domain'],
    email: args.email || DEFAULT_EMAIL,
    forceSecrets: args.forceSecrets
  });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, envContent);
  console.log(`Generated ${path.relative(repoRoot, outPath)} for self-hosted Supabase.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

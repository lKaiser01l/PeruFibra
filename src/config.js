import 'dotenv/config';

function required(name) {
  const v = process.env[name];
  if (!v || !v.trim()) {
    console.error(`[config] Falta la variable de entorno obligatoria: ${name}`);
    process.exit(1);
  }
  return v.trim();
}

const int = (name, def) => {
  const n = parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(n) ? n : def;
};

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) {
  console.error('[config] JWT_SECRET debe tener al menos 32 caracteres.');
  process.exit(1);
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: int('PORT', 3000),
  trustProxy: int('TRUST_PROXY', 0),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  n8n: {
    url: required('N8N_WEBHOOK_URL'),
    headerName: required('N8N_AUTH_HEADER_NAME'),
    headerValue: required('N8N_AUTH_HEADER_VALUE'),
    timeoutMs: int('N8N_TIMEOUT_MS', 0)
  },
  jwt: {
    secret: jwtSecret,
    ttlSeconds: int('SESSION_TTL_MINUTES', 120) * 60,
  },
};

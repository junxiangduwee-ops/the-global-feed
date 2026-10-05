import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const PG_SCHEMA     = join(ROOT, 'prisma', 'schema.prisma');
export const SQLITE_SCHEMA = join(ROOT, 'prisma', 'schema.sqlite.prisma');
export const PG_SCHEMA_REL     = 'prisma/schema.prisma';
export const SQLITE_SCHEMA_REL = 'prisma/schema.sqlite.prisma';
export const DEFAULT_SQLITE_URL = 'file:./dev.db';

/** Minimal .env reader — loads BEFORE Prisma so our vars take effect. */
export function readEnvFile(file = join(ROOT, '.env')) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) value = value.slice(1, -1);
    out[m[1]] = value;
  }
  return out;
}

/** Load .env into process.env so Prisma picks everything up. */
export function loadEnv() {
  const vars = readEnvFile();
  for (const [k, v] of Object.entries(vars)) {
    if (!process.env[k]) process.env[k] = v;
  }
  return vars;
}

export function resolveDatabase() {
  const fileEnv = readEnvFile();
  const url      = process.env.DATABASE_URL || fileEnv.DATABASE_URL || '';
  const explicit = (process.env.DATABASE_PROVIDER || fileEnv.DATABASE_PROVIDER || '').toLowerCase();

  let provider;
  if (explicit === 'postgresql' || explicit === 'postgres') provider = 'postgresql';
  else if (explicit === 'sqlite') provider = 'sqlite';
  else if (/^postgres(ql)?:\/\//i.test(url)) provider = 'postgresql';
  else if (/^file:/i.test(url)) provider = 'sqlite';
  else provider = 'sqlite';

  const resolvedUrl = url || (provider === 'sqlite' ? DEFAULT_SQLITE_URL : '');
  const inferred    = !url;

  return {
    provider,
    url: resolvedUrl,
    inferred,
    schema: provider === 'sqlite' ? SQLITE_SCHEMA_REL : PG_SCHEMA_REL,
  };
}

function dropDirectUrl(schema) {
  const lines = schema.split('\n');
  const drop  = new Set();
  lines.forEach((line, i) => {
    if (!/^\s*directUrl\s*=/.test(line)) return;
    drop.add(i);
    for (let j = i - 1; j >= 0 && /^\s*\/\//.test(lines[j]); j--) drop.add(j);
  });
  return lines.filter((_, i) => !drop.has(i)).join('\n');
}

export function writeSqliteSchema() {
  const source = readFileSync(PG_SCHEMA, 'utf8');
  let out = source
    .replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"')
    .replace(/\s+@db\.Date\b/g, '')
    .replace(/String\[\]\s*@default\(\[\]\)/g, 'String  @default("")');
  out = dropDirectUrl(out);
  out =
    `// GENERATED — do not edit. Edit prisma/schema.prisma instead.\n\n` + out;
  writeFileSync(SQLITE_SCHEMA, out, 'utf8');
  return { path: SQLITE_SCHEMA };
}

function assertNotSqliteInProduction(db) {
  const hosted = process.env.VERCEL || process.env.NETLIFY || process.env.RENDER;
  if (db.provider !== 'sqlite' || !hosted) return;
  throw new Error(
    'DATABASE_URL is not set to a Postgres database.\n' +
    'SQLite cannot be used on a serverless host.\n' +
    'Set DATABASE_URL to a Postgres connection string.'
  );
}

export function prepareSchema() {
  // Load .env first so all PRISMA_* vars and DATABASE_URL are in process.env
  loadEnv();
  const db = resolveDatabase();
  assertNotSqliteInProduction(db);
  if (db.provider === 'sqlite') writeSqliteSchema();
  return db;
}

#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { prepareSchema } from './db-config.mjs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/prisma.mjs <prisma command...>');
  process.exit(1);
}

// prepareSchema() calls loadEnv() which sets NODE_TLS_REJECT_UNAUTHORIZED,
// PRISMA_CLI_QUERY_ENGINE_TYPE etc from .env before Prisma starts.
const db = prepareSchema();

if (db.inferred) {
  console.log(
    `  i No DATABASE_URL configured - using SQLite at ${db.url}\n` +
    `    Set DATABASE_URL in .env to point at Postgres instead.`
  );
}
console.log(`  · prisma ${args.join(' ')}  [${db.provider}]`);

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['prisma', ...args, '--schema', db.schema],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: db.url,
      DIRECT_URL:   process.env.DIRECT_URL || db.url,
    },
    shell: process.platform === 'win32',
  }
);

process.exit(result.status ?? 1);

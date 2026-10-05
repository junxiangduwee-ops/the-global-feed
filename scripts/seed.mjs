#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { prepareSchema } from './db-config.mjs';

const db = prepareSchema();

function run(cmd, args, extraEnv = {}) {
  return spawnSync(process.platform === 'win32' ? `${cmd}.cmd` : cmd, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL:      db.url,
      DIRECT_URL:        process.env.DIRECT_URL || db.url,
      DATABASE_PROVIDER: db.provider,
      ...extraEnv,
    },
    shell: process.platform === 'win32',
  });
}

const remote =
  db.provider !== 'sqlite' && !/@(localhost|127\.0\.0\.1)[:/]/.test(db.url);

if (remote) {
  const host = (/@([^/:?]+)/.exec(db.url)?.[1] ?? 'unknown host').replace(/^.*@/, '');
  console.log(`\n  ! Seeding a REMOTE database (${host}).`);
  console.log('    This creates admin accounts and sample releases.');
  console.log('    Do not run against a database with real data.\n');
}

console.log(`  · regenerating Prisma client for ${db.provider}`);
const gen = run('npx', ['prisma', 'generate', '--schema', db.schema]);
if (gen.status !== 0) process.exit(gen.status ?? 1);

console.log(`  · seeding  [${db.provider}]`);
const seed = run('npx', ['tsx', 'prisma/seed.ts']);
process.exit(seed.status ?? 1);

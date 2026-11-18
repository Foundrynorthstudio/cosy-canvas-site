#!/usr/bin/env node
/**
 * Upload local `.data/*.json` into the COSY_DATA KV namespace.
 * Usage (after wrangler login + KV id in wrangler.jsonc):
 *   node scripts/seed-cf-kv.mjs
 */
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const pairs = [
  ['bookings-v1.json', 'bookings.json'],
  ['guest-crm-v1.json', 'guest-crm.json'],
  ['posts-v1.json', 'journal-posts.json'],
  ['staff-v1.json', 'studio-staff.json'],
  ['mail-settings-v1.json', 'mail-settings.json'],
];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

for (const [kvKey, localName] of pairs) {
  const file = join(ROOT, '.data', localName);
  if (!(await exists(file))) {
    console.log(`skip ${kvKey} (no .data/${localName})`);
    continue;
  }
  const result = spawnSync(
    'npx',
    ['wrangler', 'kv', 'key', 'put', kvKey, '--binding=COSY_DATA', '--remote', '--preview', 'false', '--path', file],
    { cwd: ROOT, encoding: 'utf8', stdio: 'inherit' },
  );
  if (result.status !== 0) process.exit(result.status || 1);
  console.log(`uploaded ${kvKey}`);
}

console.log('Done. Kit photos (if any) still live under .data/kit-photos locally — re-upload via Studio if needed.');

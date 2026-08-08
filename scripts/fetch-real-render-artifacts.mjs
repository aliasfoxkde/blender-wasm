#!/usr/bin/env node
/**
 * fetch-real-render-artifacts.mjs
 *
 * Downloads real-render artifacts from configured release artifacts URLs.
 * Manifest must exist at public/wasm/real-render/manifest.json before running.
 *
 * Usage:
 *   node scripts/fetch-real-render-artifacts.mjs
 *
 * Environment:
 *   REAL_RENDER_ARTIFACT_BASE  — base URL for artifacts (default: GitHub releases)
 *   REAL_RENDER_VERSION        — version tag to fetch (default: latest manifest version)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, createWriteStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MANIFEST_PATH = resolve(ROOT, 'public/wasm/real-render/manifest.json');
const DEST_DIR = resolve(ROOT, 'public/wasm/real-render');

const BASE_URL = process.env.REAL_RENDER_ARTIFACT_BASE ?? 'https://github.com/HeyPuter/blender-wasm/releases/download/real-render';

async function download(url, destPath) {
  console.log(`Downloading ${url} ...`);
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} for ${url}`);
  }
  mkdirSync(dirname(destPath), { recursive: true });
  await pipeline(resp.body, createWriteStream(destPath));
  console.log(`Saved: ${destPath}`);
}

async function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error('manifest.json not found. Run the heavy build first or fetch artifacts manually.');
    console.error('Expected at: ' + MANIFEST_PATH);
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const version = process.env.REAL_RENDER_VERSION ?? manifest.version;

  console.log(`Fetching real-render artifacts version: ${version}`);
  console.log(`Base URL: ${BASE_URL}`);

  for (const [key, entry] of Object.entries(manifest.artifacts)) {
    const fileName = entry.path;
    const destPath = resolve(DEST_DIR, fileName);

    if (existsSync(destPath)) {
      const size = (await import('fs')).statSync(destPath).size;
      const declared = entry.bytes ?? entry.compressed_bytes ?? 0;
      if (declared === 0 || size === declared) {
        console.log(`Already present: ${fileName} (${size} bytes) — skipping`);
        continue;
      }
      console.warn(`Overwriting: ${fileName} (size mismatch: ${size} vs declared ${declared})`);
    }

    const url = `${BASE_URL}/${version}/${fileName}`;
    await download(url, destPath);
  }

  console.log('\nAll artifacts fetched.');
}

main().catch((err) => {
  console.error('Fetch failed:', err.message);
  process.exit(1);
});

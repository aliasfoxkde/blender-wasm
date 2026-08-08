#!/usr/bin/env node
/**
 * audit-real-render-artifacts.mjs
 *
 * Validates the real-render artifact manifest and checks that declared files exist.
 * Does NOT download artifacts, run Docker, CMake, or Ninja.
 *
 * Exit codes:
 *   0 = all declared artifacts present and valid
 *   0 = no manifest and no real-render files (SKIP state)
 *   1 = manifest exists but declared files are missing
 *   1 = manifest exists but required fields are missing
 */

import { readFileSync, statSync, existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const MANIFEST_PATH = resolve(process.cwd(), 'public/wasm/real-render/manifest.json');

function fileSize(path) {
  try {
    return statSync(path).size;
  } catch {
    return null;
  }
}

function checkArtifacts() {
  // Check if manifest exists
  if (!existsSync(MANIFEST_PATH)) {
    // No manifest — check if any real-render files exist in the directory
    const dir = resolve(process.cwd(), 'public/wasm/real-render');
    if (existsSync(dir)) {
      const files = readdirSync(dir);
      const artifactFiles = files.filter(f =>
        f.endsWith('.wasm') || f.endsWith('.wasm.zst') || f.endsWith('.data') || f.endsWith('.js')
      );
      if (artifactFiles.length > 0) {
        console.error(`ERROR: real-render directory exists but no manifest.json found at ${MANIFEST_PATH}`);
        console.error('Artifact files present but untracked:');
        artifactFiles.forEach(f => console.error(`  ${f}`));
        process.exit(1);
      }
    }
    console.log('SKIP: no manifest.json and no real-render artifact files — nothing to audit');
    process.exit(0);
  }

  // Parse and validate manifest
  let manifest;
  try {
    const raw = readFileSync(MANIFEST_PATH, 'utf8');
    manifest = JSON.parse(raw);
  } catch (err) {
    console.error(`ERROR: failed to parse ${MANIFEST_PATH}: ${err.message}`);
    process.exit(1);
  }

  // Validate required top-level fields
  const required = ['schema', 'name', 'version', 'artifacts'];
  for (const field of required) {
    if (!(field in manifest)) {
      console.error(`ERROR: manifest missing required field: ${field}`);
      process.exit(1);
    }
  }

  if (manifest.schema !== 1) {
    console.error(`ERROR: unsupported schema version: ${manifest.schema} (expected 1)`);
    process.exit(1);
  }

  if (manifest.name !== 'real-render') {
    console.error(`ERROR: unexpected artifact name: ${manifest.name} (expected real-render)`);
    process.exit(1);
  }

  // Validate artifacts
  const artifactEntries = Object.entries(manifest.artifacts);
  if (artifactEntries.length === 0) {
    console.error('ERROR: manifest declares no artifacts');
    process.exit(1);
  }

  let allPresent = true;
  const manifestDir = resolve(process.cwd(), 'public/wasm/real-render');

  for (const [key, entry] of artifactEntries) {
    const filePath = join(manifestDir, entry.path);
    const size = fileSize(filePath);

    if (size === null) {
      console.error(`MISSING: ${entry.path} (declared ${entry.bytes ?? entry.compressed_bytes ?? 0} bytes)`);
      allPresent = false;
    } else {
      const declared = entry.bytes ?? entry.compressed_bytes ?? 0;
      if (declared > 0 && size !== declared) {
        console.warn(`WARN: ${entry.path} size mismatch — got ${size}, declared ${declared}`);
      }
      console.log(`OK   ${key}: ${entry.path} (${size} bytes)`);
    }
  }

  if (!allPresent) {
    console.error('\nERROR: some declared artifacts are missing');
    console.error('       Build artifacts may be published as CI artifacts or release attachments.');
    console.error('       See docs/minimax-real-render/04-ci-artifacts-and-release.md for distribution policy.');
    process.exit(1);
  }

  console.log(`\nAll ${artifactEntries.length} artifact(s) present. Audit passed.`);
  process.exit(0);
}

checkArtifacts();

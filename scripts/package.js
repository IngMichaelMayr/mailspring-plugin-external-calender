#!/usr/bin/env node
/**
 * Packages the Mailspring plugin into a distributable zip file.
 * Output: dist/<name>-<version>.zip
 *
 * Contents of the zip (all under a top-level folder named after the plugin):
 *   package.json
 *   lib/
 *   styles/
 *   assets/
 *   node_modules/   (production dependencies only)
 */

'use strict';

const archiver = require('archiver');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STAGING = path.resolve(ROOT, '.staging');
const DIST = path.resolve(ROOT, 'dist');

const pkg = require('../package.json');
const pluginDir = pkg.name;
const zipName = `${pkg.name}-${pkg.version}.zip`;
const zipPath = path.resolve(DIST, zipName);

// --- Prepare directories ---
fs.rmSync(STAGING, { recursive: true, force: true });
fs.mkdirSync(STAGING, { recursive: true });
fs.mkdirSync(DIST, { recursive: true });

// --- Copy plugin files to staging ---
console.log('Copying plugin files to staging...');
for (const entry of ['lib', 'styles', 'assets', 'package.json']) {
  const src = path.resolve(ROOT, entry);
  if (!fs.existsSync(src)) {
    console.warn(`  WARNING: "${entry}" not found, skipping.`);
    continue;
  }
  execSync(`cp -r "${src}" "${STAGING}/"`);
  console.log(`  + ${entry}`);
}

// --- Install only production dependencies in staging ---
console.log('\nInstalling production dependencies...');
execSync(`npm install --omit=dev --prefix "${STAGING}"`, { stdio: 'inherit' });

// --- Create zip ---
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log(`\nCreating ${zipName}...`);
const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

archive.on('warning', (err) => {
  if (err.code !== 'ENOENT') throw err;
  console.warn('WARNING:', err.message);
});
archive.on('error', (err) => { throw err; });

output.on('close', () => {
  fs.rmSync(STAGING, { recursive: true, force: true });
  const mb = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`\nDone!`);
  console.log(`  File:  dist/${zipName}`);
  console.log(`  Size:  ${mb} MB`);
});

archive.pipe(output);
archive.directory(STAGING, pluginDir);
archive.finalize();

#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read current version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;

// Read manifest.json
const manifestJson = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

console.log('🚀 DSA Buddy Release Script');
console.log('Current version:', currentVersion);
console.log('');

// Update version in manifest.json to match package.json
manifestJson.version = currentVersion;
fs.writeFileSync('manifest.json', JSON.stringify(manifestJson, null, 2));

console.log('✅ Updated manifest.json version to:', currentVersion);
console.log('');
console.log('📦 Build the extension: npm run build');
console.log('📁 The extension will be in the dist/ folder');
console.log('🔧 Load it in Chrome: chrome://extensions/');
console.log('');
console.log('🎉 Ready for release!');
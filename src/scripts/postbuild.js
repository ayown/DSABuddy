#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('📦 Running post-build script...');

// Ensure dist directory exists
if (!fs.existsSync(path.join(rootDir, 'dist'))) {
  fs.mkdirSync(path.join(rootDir, 'dist'));
}

// Copy manifest.json to dist
const manifestPath = path.join(rootDir, 'manifest.json');
const manifestDestPath = path.join(rootDir, 'dist', 'manifest.json');

if (fs.existsSync(manifestPath)) {
  fs.copyFileSync(manifestPath, manifestDestPath);
  console.log('✅ Copied manifest.json to dist/');
} else {
  console.error('❌ manifest.json not found in root directory');
}

// Create icons directory in dist if it doesn't exist
const distIconsDir = path.join(rootDir, 'dist', 'icons');
if (!fs.existsSync(distIconsDir)) {
  fs.mkdirSync(distIconsDir);
}

// Copy icon files
const iconsDir = path.join(rootDir, 'icons');
if (fs.existsSync(iconsDir)) {
  const iconFiles = fs.readdirSync(iconsDir);
  
  iconFiles.forEach(file => {
    const sourcePath = path.join(iconsDir, file);
    const destPath = path.join(distIconsDir, file);
    
    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${file} to dist/icons/`);
    }
  });
} else {
  console.error('❌ icons directory not found');
}

console.log('🎉 Post-build completed!');
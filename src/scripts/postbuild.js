import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Assuming this script is in src/scripts, root is two levels up
const rootDir = path.resolve(__dirname, '../../');
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(distDir, 'assets');

console.log('📦 Running post-build script...');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Find the generated CSS file in dist/assets
let cssFileName = null;
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  cssFileName = files.find(file => file.endsWith('.css'));
  if (cssFileName) {
    console.log(`🔎 Found CSS file: ${cssFileName}`);
  } else {
    console.warn('⚠️ No CSS file found in dist/assets');
  }
} else {
  console.warn('⚠️ dist/assets directory not found');
}

// Read and update manifest.json
const manifestPath = path.join(rootDir, 'manifest.json');
const manifestDestPath = path.join(distDir, 'manifest.json');

if (fs.existsSync(manifestPath)) {
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  try {
    const manifest = JSON.parse(manifestContent);

    // Update CSS path if found
    if (cssFileName && manifest.content_scripts) {
      manifest.content_scripts.forEach(script => {
        if (script.css) {
          script.css = [`assets/${cssFileName}`];
        }
      });
      console.log('✅ Updated manifest.json with new CSS filename');
    }

    // Write updated manifest to dist
    fs.writeFileSync(manifestDestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Copied manifest.json to dist/');
  } catch (e) {
    console.error('❌ Error parsing/updating manifest.json:', e);
  }
} else {
  console.error('❌ manifest.json not found in root directory');
}

// Create icons directory in dist if it doesn't exist
const distIconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(distIconsDir)) {
  fs.mkdirSync(distIconsDir);
}

// Copy icon files
const iconsDir = path.join(rootDir, 'public/icons'); // Check if icons are in public/icons or root/icons
// Based on file list, icons are in root/icons
const rootIconsDir = path.join(rootDir, 'icons');

if (fs.existsSync(rootIconsDir)) {
  const iconFiles = fs.readdirSync(rootIconsDir);

  iconFiles.forEach(file => {
    const sourcePath = path.join(rootIconsDir, file);
    const destPath = path.join(distIconsDir, file);

    // Check if it is a directory or file
    const stat = fs.statSync(sourcePath);
    if (stat.isFile()) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${file} to dist/icons/`);
    }
  });
} else {
  console.warn('⚠️ icons directory not found in root');
}

console.log('🎉 Post-build completed!');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(distDir, 'assets');

console.log('📦 Running post-build script...');

// ============================================================
// STEP 0: Inline shared JS chunks into content.js
//
// Chrome content scripts can't use ES module imports.
// We replace each import statement with the chunk's code.
//
// APPROACH: IIFE with return value
//   Instead of assigning to outer vars from inside the IIFE
//   (which can fail if the chunk's minified code shadows the
//   same name with a `const`), we return an object from the
//   IIFE and destructure it into outer `var` declarations.
//
//   import { g as Qm, V as Oc } from "chunk.js"
//   chunk exports: export { a as g, b as V }
//   ->
//   var __c0 = (function(){ ...code... return {g:a,V:b}; })();
//   var Qm=__c0.g, Oc=__c0.V;
//
//   Each chunk gets a unique temp var __c0, __c1, etc.
// ============================================================
let chunkCounter = 0;

function inlineSharedChunks(targetFileName) {
  const targetPath = path.join(distDir, targetFileName);
  if (!fs.existsSync(targetPath)) {
    console.warn(`⚠️ ${targetFileName} not found in dist`);
    return;
  }

  let code = fs.readFileSync(targetPath, 'utf8');
  let iterations = 0;
  let hasReplacements = true;

  while (hasReplacements && iterations < 10) {
    hasReplacements = false;
    iterations++;
    console.log(`🔄 Inlining pass ${iterations} for ${targetFileName}...`);

    const importRegex = /import\s*\{([^}]+)\}\s*from\s*"([^"]+)"\s*;?/g;
    let match;
    const imports = [];
    while ((match = importRegex.exec(code)) !== null) {
      imports.push({ fullMatch: match[0], bindings: match[1], importPath: match[2] });
    }

    if (imports.length === 0) break;

    for (const imp of imports) {
      const chunkName = path.basename(imp.importPath);
      let chunkPath = path.join(assetsDir, chunkName);

      if (!fs.existsSync(chunkPath)) {
        const rootChunkPath = path.join(distDir, chunkName);
        if (fs.existsSync(rootChunkPath)) {
          chunkPath = rootChunkPath;
        } else {
          console.warn(`⚠️ Chunk not found: ${imp.importPath}`);
          continue;
        }
      }

      let chunkCode = fs.readFileSync(chunkPath, 'utf8');

      const exportRegex = /export\s*\{([^}]+)\}\s*;?\s*$/;
      const exportMatch = chunkCode.match(exportRegex);
      if (!exportMatch) {
        console.warn(`⚠️ Cannot parse exports of ${chunkName}`);
        continue;
      }

      chunkCode = chunkCode.replace(exportRegex, '').trim();

      // Parse "localVar as exportedName" from the chunk's export statement
      const exportBindings = exportMatch[1].split(',').map(b => {
        const parts = b.trim().split(/\s+as\s+/);
        return { local: parts[0].trim(), exported: parts.length > 1 ? parts[1].trim() : parts[0].trim() };
      });

      // Parse "importedName as localAlias" from the import statement
      const importBindings = imp.bindings.split(',').map(b => {
        const parts = b.trim().split(/\s+as\s+/);
        return { imported: parts[0].trim(), local: parts.length > 1 ? parts[1].trim() : parts[0].trim() };
      });

      const returnProps = exportBindings.map(eb => `${eb.exported}:${eb.local}`).join(',');

      const tempVar = `__dsa_c${chunkCounter++}`;
      const outerAliases = importBindings.map(ib => `${ib.local}=${tempVar}.${ib.imported}`).join(',');

      const inlined = [
        `var ${tempVar}=(function(){`,
        chunkCode,
        `;return{${returnProps}};`,
        `})();`,
        `var ${outerAliases};`
      ].join('\n');

      code = code.split(imp.fullMatch).join(inlined);
      hasReplacements = true;
      console.log(`✅ Inlined ${chunkName} -> ${tempVar} (${exportBindings.length} exports)`);
    }
  }

  if (iterations >= 10) console.warn('⚠️ Max inlining iterations reached!');

  fs.writeFileSync(targetPath, code);
  console.log(`✅ ${targetFileName} is now fully self-contained`);
}

inlineSharedChunks('content.js');
inlineSharedChunks('background.js');

// ── CSS / manifest / icons ────────────────────────────────────────────────
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

let cssFileName = null;
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  cssFileName = files.find(f => f.endsWith('.css'));
  if (cssFileName) console.log(`🔎 Found CSS file: ${cssFileName}`);
  else console.warn('⚠️ No CSS file found in dist/assets');
} else {
  console.warn('⚠️ dist/assets directory not found');
}

const manifestPath = path.join(rootDir, 'manifest.json');
const manifestDestPath = path.join(distDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (cssFileName && manifest.content_scripts) {
      manifest.content_scripts.forEach(s => { if (s.css) s.css = [`assets/${cssFileName}`]; });
      console.log('✅ Updated manifest.json with new CSS filename');
    }
    fs.writeFileSync(manifestDestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Copied manifest.json to dist/');
  } catch (e) {
    console.error('❌ Error updating manifest.json:', e);
  }
} else {
  console.error('❌ manifest.json not found');
}

const distIconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(distIconsDir)) fs.mkdirSync(distIconsDir);
const rootIconsDir = path.join(rootDir, 'icons');
if (fs.existsSync(rootIconsDir)) {
  fs.readdirSync(rootIconsDir).forEach(file => {
    const src = path.join(rootIconsDir, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, path.join(distIconsDir, file));
      console.log(`✅ Copied ${file} to dist/icons/`);
    }
  });
} else {
  console.warn('⚠️ icons directory not found');
}

console.log('🎉 Post-build completed!');
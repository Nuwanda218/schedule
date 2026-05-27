import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlPath = path.join(root, 'index.html');

const errors = [];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function collectHtmlAssets(html) {
  const assets = [];

  for (const match of html.matchAll(/<link\b[^>]*\bhref="([^"]+)"/g)) {
    assets.push(match[1]);
  }

  for (const match of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) {
    assets.push(match[1]);
  }

  return assets.filter((asset) => !asset.startsWith('http'));
}

function collectCssImports(css, cssFile) {
  const imports = [];
  const cssDir = path.dirname(cssFile);

  for (const match of css.matchAll(/@import\s+["']([^"']+)["'];/g)) {
    imports.push(path.normalize(path.join(cssDir, match[1])).replaceAll('\\', '/'));
  }

  return imports;
}

if (!exists('index.html')) {
  errors.push('Missing index.html');
} else {
  const html = read('index.html');
  const assets = collectHtmlAssets(html);

  for (const asset of assets) {
    if (!exists(asset)) {
      errors.push(`Missing HTML asset: ${asset}`);
    }
  }

  const cssAssets = assets.filter((asset) => asset.endsWith('.css'));

  for (const cssFile of cssAssets) {
    if (!exists(cssFile)) continue;

    for (const imported of collectCssImports(read(cssFile), cssFile)) {
      if (!exists(imported)) {
        errors.push(`Missing CSS import from ${cssFile}: ${imported}`);
      }
    }
  }
}

if (exists('assets/js/app.js') && /\bfetchJson\b/.test(read('assets/js/app.js'))) {
  errors.push('app.js should not call fetchJson directly; use a data module instead.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Asset check passed.');

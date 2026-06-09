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

  for (const requiredId of ['recentItemTitle', 'recentItemMeta', 'yearTimeline', 'yearTimelineProgress', 'yearTimelineNow', 'yearTimelineEvents']) {
    if (!html.includes(`id="${requiredId}"`)) {
      errors.push(`Missing sidebar overview element: ${requiredId}`);
    }
  }
}

if (exists('assets/js/app.js') && /\bfetchJson\b/.test(read('assets/js/app.js'))) {
  errors.push('app.js should not call fetchJson directly; use a data module instead.');
}

if (exists('assets/js/app.js')) {
  const appSource = read('assets/js/app.js');
  if (!/\bdeleteTaskById\b/.test(appSource)) {
    errors.push('Missing task delete handler: deleteTaskById');
  }
  if (!/isReadOnly:\s*false/.test(appSource)) {
    errors.push('App should be editable by default for task CRUD.');
  }
}

if (!exists('assets/js/modules/html.js')) {
  errors.push('Missing HTML escaping module: assets/js/modules/html.js');
} else if (!/\bescapeHtml\b/.test(read('assets/js/modules/html.js'))) {
  errors.push('Missing escapeHtml helper in assets/js/modules/html.js');
}

if (exists('assets/data/app-config.js')) {
  const configSource = read('assets/data/app-config.js');
  const requiredCollections = ['views', 'tags', 'priorities', 'statusFilters', 'seasons'];

  for (const collection of requiredCollections) {
    if (!new RegExp(`${collection}\\s*:`).test(configSource)) {
      errors.push(`Missing app config collection: ${collection}`);
    }
  }

  for (const field of ['brand', 'defaults', 'modules']) {
    if (!new RegExp(`${field}\\s*:`).test(configSource)) {
      errors.push(`Missing app config section: ${field}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Asset check passed.');

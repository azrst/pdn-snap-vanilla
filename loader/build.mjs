/**
 * Concat loader modules into one merchant-facing snap.js (no bundler).
 * Run: node loader/build.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const parts = [
  path.join(root, 'protocol.js'),
  path.join(root, 'loader/config.js'),
  path.join(root, 'loader/ui.js'),
  path.join(root, 'loader/messaging.js'),
  path.join(root, 'loader/bootstrap.js'),
  path.join(root, 'loader/snap.core.js'),
];

const banner =
  '/*! pdnSnap loader — built ' + new Date().toISOString().slice(0, 10) + ' */\n';

const out = banner + parts.map((p) => fs.readFileSync(p, 'utf8')).join('\n');
const outPath = path.join(__dirname, 'snap.js');
fs.writeFileSync(outPath, out);
console.log('Built', outPath, '(' + parts.length, 'parts)');

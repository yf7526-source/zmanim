import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKIP = new Set(['node_modules', 'dist', '.verification-stubs']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return SKIP.has(entry.name) ? [] : walk(path.join(dir, entry.name));
    return [path.join(dir, entry.name)];
  });
}

let jsonCount = 0;
let jsoncCount = 0;
for (const file of walk(ROOT)) {
  if (!file.endsWith('.json') && !file.endsWith('.jsonc')) continue;
  JSON.parse(fs.readFileSync(file, 'utf8'));
  if (file.endsWith('.jsonc')) jsoncCount += 1;
  else jsonCount += 1;
}

console.log(`Configuration validation passed: ${jsonCount} JSON and ${jsoncCount} JSONC files.`);

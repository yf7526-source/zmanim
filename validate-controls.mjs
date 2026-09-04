import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('src');
const extensions = new Set(['.jsx', '.tsx']);
const issues = [];
let nativeButtons = 0;
let sharedButtons = 0;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length;
}

for (const file of walk(SRC).filter((f) => extensions.has(path.extname(f)))) {
  const source = fs.readFileSync(file, 'utf8');

  // Empty handlers are almost always accidental and make a control look live
  // while doing nothing.
  for (const match of source.matchAll(/onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/g)) {
    issues.push(`${path.relative('.', file)}:${lineOf(source, match.index)} empty onClick handler`);
  }

  for (const match of source.matchAll(/<button\b([\s\S]*?)>/g)) {
    nativeButtons += 1;
    const attrs = match[1];
    const actionable =
      /onClick\s*=/.test(attrs) ||
      /onPointerDown\s*=/.test(attrs) ||
      /onMouseDown\s*=/.test(attrs) ||
      /formAction\s*=/.test(attrs) ||
      /type\s*=\s*["']submit["']/.test(attrs) ||
      /\{\.\.\.[A-Za-z_$][\w$]*\}/.test(attrs);
    if (!actionable) {
      issues.push(`${path.relative('.', file)}:${lineOf(source, match.index)} native button has no explicit action`);
    }
  }

  for (const match of source.matchAll(/<Button\b([\s\S]*?)>/g)) {
    sharedButtons += 1;
    const attrs = match[1];
    const actionable =
      /onClick\s*=/.test(attrs) ||
      /onPointerDown\s*=/.test(attrs) ||
      /onMouseDown\s*=/.test(attrs) ||
      /formAction\s*=/.test(attrs) ||
      /type\s*=\s*["']submit["']/.test(attrs) ||
      /\basChild\b/.test(attrs) ||
      /\{\.\.\.[A-Za-z_$][\w$]*\}/.test(attrs);
    if (!actionable) {
      issues.push(`${path.relative('.', file)}:${lineOf(source, match.index)} Button has no explicit action/asChild/submit`);
    }
  }
}

if (issues.length) {
  console.error('Control validation failed:');
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Control validation passed: ${nativeButtons} native buttons and ${sharedButtons} shared Button controls checked.`);

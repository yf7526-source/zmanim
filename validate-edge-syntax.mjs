import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const BASE44_DIR = path.resolve(import.meta.dirname, '..', 'base44');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
  ));
}

const files = walk(BASE44_DIR).filter((file) => file.endsWith('.ts'));
const failures = [];
for (const file of files) {
  const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  for (const error of errors) failures.push(`${path.relative(BASE44_DIR, file)}: ${ts.flattenDiagnosticMessageText(error.messageText, ' ')}`);
}

if (failures.length) throw new Error(`Edge-function syntax validation failed:\n${failures.join('\n')}`);
console.log(`Edge-function syntax validation passed: ${files.length} TypeScript files.`);

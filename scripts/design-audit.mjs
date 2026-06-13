import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['app', 'components', 'lib', 'data'];
const forbiddenPalettes = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'pink',
  'orange',
  'lime',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'indigo',
  'violet',
  'fuchsia',
  'rose',
  'amber',
  'neutral',
  'slate',
  'zinc',
  'stone'
];

const colorUtilityPattern = new RegExp(
  `(?:bg|text|border|from|via|to|ring|outline|decoration|accent|caret|divide|placeholder)-(${forbiddenPalettes.join('|')})-`,
  'g'
);

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return walk(path);
    if (/\.(ts|tsx)$/.test(path)) return [path];
    return [];
  });
}

const files = roots.flatMap((root) => walk(root));
const failures = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const matches = source.match(colorUtilityPattern) ?? [];
  for (const match of matches) failures.push(`${file}: forbidden color utility ${match}`);

  const imageMatches = source.match(/<(img|Image)\b/g) ?? [];
  if (imageMatches.length > 0 && !source.includes('onContextMenu={(event) => event.preventDefault()}')) {
    failures.push(`${file}: image rendering without explicit context-menu prevention`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Design audit passed.');

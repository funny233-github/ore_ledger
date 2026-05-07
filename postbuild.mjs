import { readFileSync, writeFileSync } from 'fs';

let html = readFileSync('dist/index.html', 'utf8');

// Vite outputs <script type="module" crossorigin> which won't work on file:// protocol.
// Since the bundle is a single IIFE (no import/export), treat it as a plain deferred script.
html = html
  .replaceAll(' crossorigin', '')
  .replace(' type="module"', '')
  .replace('<script src', '<script defer src');

writeFileSync('dist/index.html', html);

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const headersPath = path.resolve(import.meta.dirname, '../dist/_headers');

const noindexRules = [
  '/*.md',
  '  X-Robots-Tag: noindex',
  '/*.mdx',
  '  X-Robots-Tag: noindex',
  '/llms.txt',
  '  X-Robots-Tag: noindex',
  '/llms-full.txt',
  '  X-Robots-Tag: noindex',
  '/agent-readability.json',
  '  X-Robots-Tag: noindex',
  '/openapi.json',
  '  X-Robots-Tag: noindex',
  '/blume-search.json',
  '  X-Robots-Tag: noindex',
  '/api/docs/*',
  '  X-Robots-Tag: noindex',
  '/.well-known/*',
  '  X-Robots-Tag: noindex',
].join('\n');

const current = await readFile(headersPath, 'utf8');
if (!current.includes('X-Robots-Tag: noindex')) {
  const separator = current.endsWith('\n') ? '' : '\n';
  await writeFile(headersPath, `${current}${separator}${noindexRules}\n`);
}

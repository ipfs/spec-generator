
import { isAbsolute, join } from 'path';
import { readFile, writeFile } from 'node:fs/promises';
import { cwd } from 'node:process';
import { remark } from 'remark';
import remarkHTML from 'remark-html';

export async function processFile (input, output) {
  if (!isAbsolute(input)) input = join(cwd(), input);
  if (!isAbsolute(output)) output = join(cwd(), output);
  const md = await readFile(input);
  const html = await processMD(md);
  return writeFile(output, html, 'utf8');
}

export async function processMD (md) {
  const html = await remark()
    .use(remarkHTML)
    .process(md)
  ;
  return String(html);
}

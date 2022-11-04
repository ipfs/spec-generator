
import { isAbsolute, join, dirname, basename } from 'path';
import { watch } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { cwd } from 'node:process';
import chalk from 'chalk';
import debounce from 'debounce';
import getPort from 'get-port';
import { remark } from 'remark';
import remarkHTML from 'remark-html';
import runServer from './server.js';

const abs = (pth) => isAbsolute(pth) ? pth : join(cwd(), pth);

export async function processFile (input, output) {
  input = abs(input);
  output = abs(output);
  const md = await readFile(input);
  const html = await processMD(md);
  return writeFile(output, html, 'utf8');
}

export async function watchFile (input, output) {
  input = abs(input);
  output = abs(output);
  const cb = async () => {
    await processFile(input, output, { watching: true });
    console.warn(chalk.dim(`[${new Date().toISOString()}]`), chalk.green('Ok!'));
  };
  watch(input, debounce(cb, 2000, true));
  console.warn(chalk.magenta(`Watching…`));
  await cb();
  const port = await getPort({ port: 8023 });
  runServer(dirname(output), port);
  console.warn(`Load file from`, chalk.underline.blue(`http://localhost:${port}/${basename(output)}`));
}

async function processMD (md) {
  const html = await remark()
    .use(remarkHTML)
    .process(md)
  ;
  return String(html);
}


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

export async function processFile (input, output, opt) {
  input = abs(input);
  output = abs(output);
  const md = await readFile(input);
  const html = await processMD(md, opt);
  return writeFile(output, html, 'utf8');
}

export async function watchFile (input, output) {
  input = abs(input);
  output = abs(output);
  const port = await getPort({ port: 8023 });
  const reload = runServer(dirname(output), port);
  const cb = async () => {
    await processFile(input, output, { watching: true });
    console.warn(chalk.dim(`[${new Date().toISOString()}]`), chalk.green('Ok!'));
    reload();
  };
  watch(input, debounce(cb, 2000, true));
  console.warn(chalk.magenta(`Watching…`));
  await cb();
  console.warn(`Load file from`, chalk.underline.blue(`http://localhost:${port}/${basename(output)}`));
}

async function processMD (md, opt) {
  const html = await remark()
    .use(remarkHTML)
    .process(md)
  ;
  return generateHTML(String(html), opt);
}

// maybe we should consider a grown-up templating system at some point
// TODO:
//  - extract title
//  - icon
//  - CSS
//  - monetization
//  - cards
function generateHTML (body, opt) {
  let updater = '';
  if (opt.watching) {
    updater = `<script>
      const est = new EventSource('/ipseity');
      est.onmessage = async ({ data }) => {
        data = data.replace(/\\W/g, '');
        if (data === 'refresh') {
          const res = await fetch(document.location.href);
          let body = await res.text();
          body = body.replace(/^.*?<head/m, '<head').replace('</html>', '');
          document.documentElement.innerHTML = body;
          console.log(\`[${new Date().toISOString()}] updated!\`);
        }
      }
    </script>`;
  }
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>XXX</title>
    ${updater}
  </head>
  <body>
${body}
  </body>
</html>`;
}

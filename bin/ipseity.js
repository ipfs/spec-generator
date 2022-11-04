#!/usr/bin/env node

import { join, dirname } from 'path';
import { readFile } from 'node:fs/promises';
import { program  } from 'commander';
import { processFile, watchFile } from "../lib/process.js";

const { version } = JSON.parse(await readFile(join(dirname(import.meta.url.replace(/^file:\/*/, '/')), '../package.json')));

program
  .name('ipseity')
  .description('Renders interplanetary standards')
  .version(version)
;

program
  .command('run')
  .description('Converts an MD source file to standard HTML output')
  .argument('<md>', 'MD input file')
  .argument('<html>', 'HTML output file')
  .action(async (md, html) => {
    await processFile(md, html);
  })
;

program
  .command('watch')
  .description('Watches an MD source file and converts it to HTML when it changes')
  .argument('<md>', 'MD input file')
  .argument('<html>', 'HTML output file')
  .action(async (md, html) => {
    await watchFile(md, html);
  })
;

program.parse();

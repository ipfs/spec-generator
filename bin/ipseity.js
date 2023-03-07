#!/usr/bin/env node

import { argv, cwd } from "node:process";
import { isAbsolute, join } from "node:path";
import { program } from 'commander';
import IpseityRunner from "../lib/runner.js";
import makeRel from '../lib/rel.js';
import loadJSON from '../lib/load-json.js';

const rel = makeRel(import.meta.url);
const { version } = await loadJSON(rel('../package.json'));

program
  .name('ipseity')
  .description('Spec generator for the Interplanetary Stack')
  .version(version)
  .requiredOption('-c, --config <path>', 'path to the configuration file')
  .option('--watch', 'watches the input directory and re-runs with every change', false)
;
program.parse(argv);

let { config, watch } = program.opts();
config = resolve(cwd(), config);
let { input, output, ...options } = await loadJSON(config);
input = resolve(config, input);
output = resolve(config, output);
options.runMode = watch ? 'build' : 'serve';

const ir = new IpseityRunner(input, output, options);
await ir.run();

function resolve (cur, pth) {
  return isAbsolute(pth) ? pth : join(cur, pth)
}

#!/usr/bin/env node

import { env, argv, cwd } from "node:process";
import { isAbsolute, join } from "node:path";
import { writeFile } from "node:fs/promises";
import Mocha from 'mocha/lib/mocha.js';
import collectFiles from 'mocha/lib/cli/collect-files.js';
import Base from "mocha/lib/reporters/base.js";
import Runner from "mocha/lib/runner.js";
import { program } from 'commander';
import makeRel from '../lib/rel.js';
import loadJSON from '../lib/load-json.js';
import saveJSON from '../lib/save-json.js';

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_TEST_PENDING,
  EVENT_TEST_END,
} = Runner.constants;
const { color } = Base;

const rel = makeRel(import.meta.url);
const { version } = await loadJSON(rel('../package.json'));

program
  .name('bastest')
  .description('Test runner for the Interplanetary Stack')
  .version(version)
  .requiredOption('--gateway <url>', 'root URL of the gateway to test, eg. http://127.0.0.1:8765/')
  .option('--save <label>', 'whether to save the output and if so which implementation to label that with', false)
  .option('--markdown <outputFile>', 'save a Markdown output to that file')
  .option('--quiet', 'silences reporting to the terminal', false)
;
program.parse(argv);

const { gateway, save, markdown, quiet } = program.opts();
env.ROOT_GATEWAY_URL = gateway;

// This reporter class is a gory mash up of several of Mocha's reporters.
// See https://mochajs.org/, MIT licensed.
class BastestReporter extends Base {
  constructor (runner, options) {
    super(runner, options);
    let indents = 0;
    let n = 0;
    const tests = [];
    const pending = [];
    const failures = [];
    const passes = [];
    const buf = [];

    const title = (str) => `${'#'.repeat(indents)} ${str || 'Interplanetary Test Suite'}`;
    const indent = () => '  '.repeat(indents);

    runner.on(EVENT_RUN_BEGIN, () => {
      if (!quiet) Base.consoleLog();
    });

    runner.on(EVENT_SUITE_BEGIN, (suite) => {
      indents++;
      if (!quiet) Base.consoleLog(color('suite', '%s%s'), indent(), suite.title);
      if (markdown) buf.push(title(suite.title));
    });

    runner.on(EVENT_SUITE_END, () => {
      indents--;
      if (indents === 1) {
        if (!quiet) Base.consoleLog();
      }
    });

    runner.on(EVENT_TEST_PENDING, (test) => {
      if (save) pending.push(test);
      if (markdown) buf.push(`* 🕰  - ${test.title}`);
      if (!quiet) Base.consoleLog(indent() + color('pending', '  - %s'), test.title);
    });

    runner.on(EVENT_TEST_PASS, (test) => {
      if (save) passes.push(test);
      if (markdown) buf.push(`* ✅ ${test.title}`);
      if (!quiet) {
        if (test.speed === 'fast') {
          Base.consoleLog(
            indent() +
            color('checkmark', '  ' + Base.symbols.ok) +
            color('pass', ' %s'),
            test.title
          );
        }
        else {
          Base.consoleLog(
            indent() +
            color('checkmark', '  ' + Base.symbols.ok) +
            color('pass', ' %s') +
            color(test.speed, ' (%dms)'),
            test.title,
            test.duration
          );
        }
      }
    });

    runner.on(EVENT_TEST_FAIL, (test) => {
      n++;
      if (save) failures.push(test);
      if (!quiet) Base.consoleLog(indent() + color('fail', '  %d) %s'), n, test.title);
      if (markdown) buf.push(`* ❌ ${n}) ${test.title}`);
    });

    runner.on(EVENT_TEST_END, (test) => {
      if (save) tests.push(test);
    });

    runner.once(EVENT_RUN_END, async () => {
      if (!quiet) super.epilogue();
      if (markdown) {
        const md = [buf.join('\n')].join('');
        const out = isAbsolute(markdown) ? markdown : join(cwd(), markdown);
        await writeFile(out, md, 'utf8');
      }
      if (save) {
        // runner.testResults = obj;
        // XXX this is NOT how we plan to save data, the intent is to do this on a per spec basis,
        // which means processing the data we have here in order to split it out properly.
        // Temporarily, we just save per implementation. And maybe that's good enough and we can
        // process those in the spec runner instead.
        // Ideally the save label would be something like implemenationName_M.m.p(.commit) so that
        // we can process it to report on it.
        try {
          await saveJSON(rel(`../test-reports/${save}.json`), {
            stats: this.stats,
            tests: tests.map(clean),
            pending: pending.map(clean),
            failures: failures.map(clean),
            passes: passes.map(clean),
          });
        }
        catch (err) {
          console.error(
            `${Base.symbols.err} [bastest] writing output to "${save}.json" failed: ${err.message}\n`
          );
        }
      }
    });
  }
}

const mocha = new Mocha({ reporter: BastestReporter });
const files = collectFiles({
  recursive: true,
  spec: ['test-suite'],
  extension: ['.js'],
  ignore: [],
  file: [],
  sort: false,
});
mocha.files = files;
await mocha.loadFilesAsync();
mocha.run();

function clean (test) {
  let err = test.err || {};
  if (err instanceof Error) err = errorJSON(err);
  return {
    title: test.title,
    fullTitle: test.fullTitle(),
    file: test.file.replace(/.*?test-suite\//, ''),
    duration: test.duration,
    currentRetry: test.currentRetry(),
    speed: test.speed,
    err: cleanCycles(err)
  };
}

function cleanCycles (obj) {
  const cache = new Set();
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return '' + value;
        cache.add(value);
      }
      return value;
    })
  );
}

function errorJSON (err) {
  const res = {};
  Object.getOwnPropertyNames(err).forEach((key) => {
    res[key] = err[key];
  }, err);
  return res;
}


import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import makeSelectron from 'selectron-test';
import IpseityRunner from '../lib/runner.js';
import makeRel from '../lib/rel.js';

const rel = makeRel(import.meta.url);
const config = {
  input: rel('fixtures/src'),
  output: rel('fixtures/out'),
  template: rel('fixtures/template.html'),
  baseURL: 'https://berjon.com/specs/',
  quietMode: true,
};
let doc, selectron;

describe('Full Run', function () {
  before(async function () {
    this.timeout(10_000);
    const runner = new IpseityRunner(config);
    await runner.run();
    const html = await readFile(rel('fixtures/out/spec-for-specs/index.html'), 'utf-8');
    const { window: { document }} = new JSDOM(html);
    doc = document;
    selectron = makeSelectron(doc);
  });
  it('uses the template', async () => {
    selectron('head > link[rel="icon"][href="/img/ipfs-standards.svg');
  });
});

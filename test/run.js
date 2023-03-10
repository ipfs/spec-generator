
import { readFile } from 'node:fs/promises';
import { ok, equal } from 'node:assert';
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
  it('uses the template', () => {
    selectron('head > link[rel="icon"][href="/img/ipfs-standards.svg');
  });
  it('produces correct ref links', () => {
    selectron('a.bibref[href="#ref-YAML"', 'YAML');
    selectron('a.bibref[href="#ref-WEBUSB"', 'WICG-WEBUSB');
  });
  it('builds a correct biblio', () => {
    selectron('#ref-URL', '[URL]');
    selectron('#ref-URL + dd > a[href="https://url.spec.whatwg.org/"] > cite', 'URL Standard');
  });
  it('has no errors', () => {
    const reports = doc.querySelector('#ipseity-reports');
    if (!reports) {
      ok(true);
      return;
    }
    const errors = Array.from(doc.querySelectorAll('details.ipseity-errors > ol > li')).map(li => li.textContent).filter(err => !/spec-for-specs/.test(err));
    if (errors.length) console.warn(errors.join('\n'));
    equal(errors.length, 0, 'No real errors');
  });
});

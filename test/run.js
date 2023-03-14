
import { readFile, access } from 'node:fs/promises';
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
  it('produces correct dfn links', () => {
    selectron('a[href="https://html.spec.whatwg.org/multipage/system-state.html#dom-navigator-registerprotocolhandler"][data-dfn-type="method"]', 'registerProtocolHandler(scheme, url)');
    selectron('a[data-dfn-type="method"] > code', 'registerProtocolHandler(scheme, url)');
  });
  it('outputs references', async () => {
    const refs = JSON.parse(await readFile(rel('fixtures/out/.well-known/ipseity/references.json')));
    const sfs = refs['spec-for-specs'];
    ok(sfs, 'has a spec-for-specs entry');
    equal(sfs.title, 'Spec for Specs', 'title is correct');
    equal(sfs.authors[0], 'Robin Berjon', 'authors is correct');
    equal(sfs.shortName, 'spec-for-specs', 'shortName is correct');
    equal(sfs.href, 'https://berjon.com/specs/spec-for-specs/', 'href is correct');
  });
  it('outputs definitions', async () => {
    const refs = JSON.parse(await readFile(rel('fixtures/out/.well-known/ipseity/definitions/spec-for-specs.json')));
    equal(refs.spec.title, 'Spec for Specs', 'title is correct');
    equal(refs.spec.url, 'https://berjon.com/specs/spec-for-specs/', 'url is correct');
    const dfns = refs.dfns.filter(d => d.id === 'dfn-spec');
    equal(dfns.length, 2, 'two dfns for spec');
    equal(dfns[0].href, 'https://berjon.com/specs/spec-for-specs/#dfn-spec', 'link is correct');
    const texts = new Set(dfns.map(d => d.linkingText[0]));
    ok(texts.has('spec'), 'singular definition');
    ok(texts.has('specs'), 'plural definition');
  });
  it('passes images through', async () => {
    await access(rel('fixtures/out/img/test.png'));
    ok(true, 'the image is there');
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

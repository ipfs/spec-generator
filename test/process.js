
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import makeSelectron from 'selectron-test';
import IpseityProcessor from '../lib/process.js';
import makeRel from '../lib/rel.js';
import assert from 'assert'

const rel = makeRel(import.meta.url);

const sectionDoc = `
# One

graf

## Two 1

## Two 2

### Three 1

### Three 2

#### Four

## Two 3

#### Renested
`;

describe('General MD/HTML Processing', function () {
  this.timeout(10000);
  it('sets the title', async () => {
    const doc = await md2doc('# The `fun` spec');
    const selectron = makeSelectron(doc);
    selectron('body > header > h1');
    selectron('h1', 'The fun spec');
    selectron('h1 > code', 'fun');
    selectron('title', 'The fun spec');
  });
  it('sets canonical link', async() => {
    const doc = await md2doc('# The `fun` spec');
    const link = doc.querySelector('link[rel=canonical]');
    assert.equal(link.href, 'https://berjon.com/permalink');
  });
  it('sets the date', async () => {
    const bd = '1977-03-15T08:42:00.000Z';
    const doc = await md2doc('# An old doc', { lastModified: new Date(bd) });
    const selectron = makeSelectron(doc);
    selectron('body > header > p#last-modified > time', '15 March 1977');
    selectron(`body > header > p#last-modified > time[datetime="${bd}"]`);
  });
  it('sets maturity', async () => {
    const doc = await md2doc('# A stable doc', { maturity: 'stable' });
    const selectron = makeSelectron(doc);
    selectron('body > header > div.ipseity-maturity > img[src="https://img.shields.io/badge/status-stable-brightgreen.svg?style=flat-square"][alt="status: stable"][height="20"]');
  });
  it('drops empty grafs', async () => {
    const doc = await md2doc('# Title\n\n## No Empty Paragraphs\n\n\ngr1\n\n\n\ngr2\n\n\n  \n\n\ngr3\n\n\n\n\n ');
    const selectron = makeSelectron(doc);
    selectron('section h2', /No Empty Paragraphs/);
    selectron('section > p', 3);
  });
  it('produces sections', async () => {
    const doc = await md2doc(sectionDoc);
    const selectron = makeSelectron(doc);
    selectron('section', 7);
    selectron('body > section', 3);
    selectron('body > section:nth-of-type(1) section', false);
    selectron('body > section:nth-of-type(2) > section', 2);
    selectron('body > section:nth-of-type(2) > section:nth-of-type(1) > section', false);
    selectron('body > section:nth-of-type(2) > section:nth-of-type(2) > section', 1);
    selectron('body > section:nth-of-type(2) > section:nth-of-type(2) > section:nth-of-type(1) h4', /Four/);
    selectron('body > section:nth-of-type(2) > section:nth-of-type(2) > section:nth-of-type(1) > section', false);
    selectron('body > section:nth-of-type(3) > section h3', /Renested/);
  });
  it('produces a ToC', async () => {
    const doc = await md2doc(sectionDoc);
    const selectron = makeSelectron(doc);
    selectron('nav#toc');
    selectron('nav#toc > ol', 1);
    selectron('nav#toc > ol ol', 3);
    selectron('nav#toc li', 7);
    selectron('nav#toc > h2', 'Table of Contents');
    selectron('nav#toc > ol > li:nth-of-type(3) > ol > li', /Renested/);
    selectron('nav#toc > ol > li:nth-of-type(3) > ol > li > a[href="#renested"] > bdi.secno', '3.1 ');
  });
  it('adds sectionals', async () => {
    const doc = await md2doc(sectionDoc);
    const selectron = makeSelectron(doc);
    selectron('body > section:nth-of-type(3) > section > h3', /Renested/);
    selectron('body > section:nth-of-type(3) > section > h3 + a.self-link', '');
    selectron('body > section:nth-of-type(3) > section > a[href="#renested"]');
    selectron('body > section:nth-of-type(3) > section > a[aria-label="Section 3.1"]');
  });
  it('accepts custom header IDs', async () => {
    const doc = await md2doc('# Ook\n\n## Introduction {#intro}');
    const selectron = makeSelectron(doc);
    selectron('h2#intro', /Introduction/);
    selectron('h2#intro + a[href="#intro"]');
  });
});

async function md2doc (md, opt = {}) {
  const template = rel('fixtures/template.html');
  const output = await mkdtemp(join(tmpdir(), 'ipseity-'));
  opt.page = { inputPath: output, url: 'permalink' };
  opt.editors = [];
  const ips = new IpseityProcessor({ template, output, baseURL: 'https://berjon.com/' });
  const html = await ips.render(md, opt);
  const { window: { document }} = new JSDOM(html);
  return document;
}

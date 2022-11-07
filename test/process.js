
// import { equal } from 'node:assert';
import { JSDOM } from 'jsdom';
import makeSelectron from 'selectron-test';
import { processMD } from '../lib/process.js';

describe('General MD/HTML Processing', function () {
  it('sets the title', async () => {
    const doc = await md2doc('# The `fun` spec');
    const selectron = makeSelectron(doc);
    selectron('h1', 'The fun spec');
    selectron('code', 'fun');
    selectron('title', 'The fun spec');
  });
});

async function md2doc (md) {
  const html = await processMD(md);
  const { window: { document }} = new JSDOM(html);
  return document;
}

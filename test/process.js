
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
  it('drops empty grafs', async () => {
    const doc = await md2doc('## No Empty Paragraphs\n\n\ngr1\n\n\n\ngr2\n\n\n  \n\n\ngr3\n\n\n\n\n ');
    const selectron = makeSelectron(doc);
    selectron('h2', 'No Empty Paragraphs');
    selectron('p', 3);
  });
});

async function md2doc (md) {
  const html = await processMD(md);
  const { window: { document }} = new JSDOM(html);
  return document;
}

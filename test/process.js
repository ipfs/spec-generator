
// import { equal } from 'node:assert';
import { JSDOM } from 'jsdom';
import makeSelectron from 'selectron-test';
import { processMD } from '../lib/process.js';

describe('General MD/HTML Processing', function () {
  it('sets the title', async () => {
    const doc = await md2doc('# The `fun` spec');
    const selectron = makeSelectron(doc);
    selectron('body > header > h1');
    selectron('h1', 'The fun spec');
    selectron('h1 > code', 'fun');
    selectron('title', 'The fun spec');
  });
  it('sets the date', async () => {
    const bd = '1977-03-15T08:42:00.000Z';
    const doc = await md2doc('# An old doc', { lastModified: new Date(bd) });
    const selectron = makeSelectron(doc);
    selectron('body > header > p#last-modified > time', '15 March 1977');
    selectron(`body > header > p#last-modified > time[datetime="${bd}"]`);
  });
  it('drops empty grafs', async () => {
    const doc = await md2doc('## No Empty Paragraphs\n\n\ngr1\n\n\n\ngr2\n\n\n  \n\n\ngr3\n\n\n\n\n ');
    const selectron = makeSelectron(doc);
    selectron('h2', 'No Empty Paragraphs');
    selectron('p:not(#last-modified)', 3);
  });
  it('produces sections', async () => {
    // XXX need to actually test this
  });
});

async function md2doc (md, opt) {
  const html = await processMD(md, opt);
  const { window: { document }} = new JSDOM(html);
  return document;
}

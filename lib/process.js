
import { remark } from 'remark';
import remarkHeadingID from 'remark-heading-id';
import remarkSqueezeGrafs from 'remark-squeeze-paragraphs';
import remarkHTML from 'remark-html';
import { JSDOM } from 'jsdom';
import sectionise from './html/sections.js';
import toc from './html/toc.js';
import sectionals from './html/sectionals.js';
import cleanHeadingIDs from './html/clean-heading-id.js';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                'September', 'October', 'November', 'December'];

export async function processMD (md, opt = {}) {
  if (!opt.lastModified) opt.lastModified = new Date();
  const html = await remark()
    .use(remarkSqueezeGrafs)
    .use(remarkHeadingID)
    .use(remarkHTML)
    .process(md)
  ;
  return generateHTML(String(html), opt);
}

// maybe we should consider a grown-up templating system at some point
// TODO:
//  - monetization
//  - cards
function generateHTML (body, opt) {
  let updater = '';
  if (opt.watching) {
    updater = `<script>
      const est = new EventSource('/ipseity');
      est.onmessage = async ({ data }) => {
        data = data.replace(/\\W/g, '');
        if (data === 'refresh') {
          const res = await fetch(document.location.href);
          let body = await res.text();
          body = body.replace(/^.*?<head/m, '<head').replace('</html>', '');
          document.documentElement.innerHTML = body;
          console.log(\`[${new Date().toISOString()}] updated!\`);
        }
      }
    </script>`;
  }
  const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>XXX</title>
    <link rel="stylesheet" href="/ipseity.min.css">
    <link rel="icon" href="/ipfs.svg">
    ${updater}
  </head>
  <body>
${body}
  </body>
</html>`);
  const { window: { document: doc } } = dom;
  const header = doc.createElement('header');
  doc.body.insertBefore(header, doc.body.firstElementChild);
  let h1 = doc.querySelector('h1');
  if (!h1) {
    h1 = doc.createElement('h1');
    h1.textContent = 'Untitled';
  }
  header.appendChild(h1);
  h1.setAttribute('id', 'title');
  doc.title = h1.textContent;
  const lm = opt.lastModified;
  const pDate = doc.createElement('p');
  pDate.setAttribute('id', 'last-modified');
  const timeEl = doc.createElement('time');
  timeEl.setAttribute('datetime', lm.toISOString());
  timeEl.textContent = `${lm.getDate()} ${months[lm.getMonth()]} ${lm.getFullYear()}`
  pDate.appendChild(timeEl);
  h1.after(pDate);
  sectionise(doc.body);
  toc(doc);
  cleanHeadingIDs(doc);
  sectionals(doc);
  return dom.serialize();
}

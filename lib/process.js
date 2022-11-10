
import { remark } from 'remark';
import remarkDirective from 'remark-directive';
import remarkHeadingID from 'remark-heading-id';
import remarkSqueezeGrafs from 'remark-squeeze-paragraphs';
import remarkHTML from 'remark-html';
import { JSDOM } from 'jsdom';
import {visit} from 'unist-util-visit';
import { defaultSchema } from 'hast-util-sanitize';
import sectionise from './html/sections.js';
import toc from './html/toc.js';
import sectionals from './html/sectionals.js';
import cleanHeadingIDs from './html/clean-heading-id.js';
import { makeEl } from './html/utils.js';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                'September', 'October', 'November', 'December'];
const sanitiseSchema = JSON.parse(JSON.stringify(defaultSchema));
sanitiseSchema.clobber = [];
Object.keys(sanitiseSchema.protocols).forEach(k => {
  sanitiseSchema.protocols[k].push('ipfs');
  sanitiseSchema.protocols[k].push('ipns');
});
sanitiseSchema.tagNames.push('section');
sanitiseSchema.tagNames.push('aside');
sanitiseSchema.tagNames.push('video');
sanitiseSchema.tagNames.push('audio');
sanitiseSchema.attributes['*'].push('className');

export async function processMD (md, opt = {}) {
  if (!opt.lastModified) {
    if (opt.page && opt.page.date) opt.lastModified = opt.page.date;
    else opt.lastModified = new Date();
  }
  const html = await remark()
    .use(remarkDirective)
    .use(remarkCallouts)
    .use(remarkSqueezeGrafs)
    .use(remarkHeadingID)
    .use(remarkHTML, { sanitize: sanitiseSchema })
    .process(md)
  ;
  return generateHTML(String(html), opt);
}

// maybe we should consider a grown-up templating system at some point
// TODO:
//  - monetization
//  - cards
function generateHTML (body, opt) {
  const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title></title>
    <link rel="stylesheet" href="/ipseity.min.css">
    <link rel="icon" href="/ipfs-standards.svg">
  </head>
  <body>
${body}
  </body>
</html>`);
  const { window: { document: doc } } = dom;
  const el = makeEl(doc);
  let h1 = doc.querySelector('h1');
  if (!h1) h1 = el('h1', { id: 'title' }, ['Untitled']);
  doc.title = h1.textContent;
  const lm = opt.lastModified;
  const pDate = el('p', { id: 'last-modified' }, [
    el('time', { datetime: lm.toISOString() }, [`${lm.getDate()} ${months[lm.getMonth()]} ${lm.getFullYear()}`])
  ]);
  const metaEls = [];
  if (opt.editors) {
    metaEls.push(el('dt', {}, [`Editor${opt.editors.length > 1 ? 's' : ''}`]));
    opt.editors.forEach(
      ({ name, email, url, github, twitter, mastodon, company: { name: companyName, url: companyURL }}) => {
        const person = [];
        if (url) person.push(el('a', { href: url }, [name]));
        else person.push(el('span', {}, [name]));
        if (companyName) {
          person.push(' (');
          if (companyURL) person.push(el('a', { href: companyURL }, [companyName]));
          else person.push(el('span', {}, [companyName]));
          person.push(')');
        }
        if (email) {
          person.push(' ');
          person.push(el('a', { href: `mailto:${email}` }, [
            el('img', { src: '/email.svg', width: '16', height: '16', alt: `Email: ${email}` })
          ]));
        }
        if (github) {
          person.push(' ');
          person.push(el('a', { href: `https://github.com/${github.replace('@', '')}` }, [
            el('img', { src: '/gh.png', width: '16', height: '16', alt: 'GitHub' })
          ]));
        }
        if (twitter) {
          person.push(' ');
          person.push(el('a', { href: `https://twitter.com/${twitter.replace('@', '')}` }, [
            el('img', { src: '/twitter.svg', width: '16', height: '16', alt: 'Twitter' })
          ]));
        }
        if (mastodon) {
          person.push(' ');
          const [user, domain] = mastodon.replace(/^@/, '').split('@');
          person.push(el('a', { href: `https://${domain}/@${user}` }, [
            el('img', { src: '/mastodon.png', width: '16', height: '16', alt: 'Mastodon' })
          ]));
        }
        metaEls.push(el('dd', {}, person));
      });
  }
  const dl = metaEls.length ? el('dl', null, metaEls) : null;
  const header = el('header', {}, [h1, pDate, dl]);
  doc.body.insertBefore(header, doc.body.firstElementChild);
  sectionise(doc.body);
  toc(doc);
  cleanHeadingIDs(doc);
  sectionals(doc);
  return dom.serialize();
}

function remarkCallouts () {
  return (tree) => {
    visit(tree, (node) => {
      if (
        // node.type === 'textDirective' ||
        // node.type === 'leafDirective' ||
        node.type === 'containerDirective'
      ) {
        if (!['note', 'issue', 'warning', 'example'].find(type => type === node.name)) return;
        const data = node.data || (node.data = {});
        data.hName = 'div';
        data.hProperties = { className: node.name, title: 'What?' };
      }
    })
  }
}

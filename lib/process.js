
import { remark } from 'remark';
import remarkDirective from 'remark-directive';
import remarkHeadingID from 'remark-heading-id';
import remarkSqueezeGrafs from 'remark-squeeze-paragraphs';
import remarkPrism from 'remark-prism';
import remarkHTML from 'remark-html';
import { JSDOM } from 'jsdom';
import {visit} from 'unist-util-visit';
import { defaultSchema } from 'hast-util-sanitize';
import { toString } from 'mdast-util-to-string';
import pluralize from 'pluralize';
import sectionise from './html/sections.js';
import toc from './html/toc.js';
import sectionals from './html/sectionals.js';
import cleanHeadingIDs from './html/clean-heading-id.js';
import references from './html/references.js';
import { makeEl } from './html/utils.js';
import makeRel from './rel.js';
import saveJSON from './save-json.js';

const rel = makeRel(import.meta.url);
const { isPlural, plural, singular } = pluralize;
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
  const ctx = {
    definitions: {},
    error (err) {
      // XXX this needs something better
      console.error(err);
    },
  };
  const html = await remark()
    .use(remarkDirective)
    .use(makeRemarkExtendedDirectives(ctx))
    .use(remarkSqueezeGrafs)
    .use(remarkHeadingID)
    .use(remarkPrism)
    .use(remarkHTML, { sanitize: sanitiseSchema })
    .process(md)
  ;
  return generateHTML(String(html), opt, ctx);
}

// maybe we should consider a grown-up templating system at some point
// TODO:
//  - monetization
//  - cards
async function generateHTML (body, opt, ctx) {
  console.warn(opt);
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
  await references(doc, opt, ctx);
  toc(doc);
  cleanHeadingIDs(doc);
  sectionals(doc);
  const citeMeta = {
    title: doc.title,
    editors: opt.editors,
    lastModified: lm.toISOString(),
    shortName: opt.page.fileSlug,
    url: `https://specs.ipfs.tech${opt.page.url}`,
  };
  await saveJSON(rel(`../refs/cite/${citeMeta.shortName}.json`), citeMeta);
  await saveJSON(rel(`../refs/dfn/${citeMeta.shortName}.json`), ctx.definitions);
  return dom.serialize();
}

function makeRemarkExtendedDirectives (ctx) {
  return () => {
    const blockTypes = new Set(['note', 'issue', 'warning', 'example']);
    return (tree) => {
      visit(tree, (node) => {
        if (
          node.type === 'textDirective' ||
          // node.type === 'leafDirective' || // these are ::block, not inline but not a container
          node.type === 'containerDirective'
        ) {
          const data = node.data || (node.data = {});
          if (blockTypes.has(node.name)) {
            data.hName = 'div';
            data.hProperties = { className: node.name };
          }
          else if (node.name === 'dfn') {
            const primaryDef = toString(node);
            let defs = [primaryDef];
            if (node.attributes && node.attributes.also) defs.push(...node.attributes.also.split(/\s*,\s*/));
            defs = defs.map(cleanText);
            defs.push(...defs.map(df => isPlural(df) ? singular(df) : plural(df)));
            defs = [...new Set(defs)];
            const id = `dfn-${primaryDef}`;
            defs.forEach(df => {
              if (ctx.definitions[df]) return ctx.error(`Duplicate definition: ${df}`);
              ctx.definitions[df] = `#${id}`;
            });
            data.hName = 'dfn';
            data.hProperties = { id };
          }
          else if (node.name === 'ref') {
            const to = cleanText(toString(node));
            data.hName = 'a';
            data.hProperties = { className: 'ipseity-unresolved-ref', href: to };
          }
          else if (node.name === 'cite') {
            const to = cleanText(toString(node));
            data.hName = 'a';
            data.hProperties = { className: 'ipseity-unresolved-cite', href: to };
          }
        }
      })
    }
  };
}

function cleanText (txt) {
  return (txt || '').trim().toLocaleLowerCase();
}

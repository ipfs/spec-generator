
import { join } from 'path';
import { remark } from 'remark';
import remarkDirective from 'remark-directive';
import remarkHeadingID from 'remark-heading-id';
import remarkSqueezeGrafs from 'remark-squeeze-paragraphs';
import remarkPrism from 'remark-prism';
import remarkHTML from 'remark-html';
import { JSDOM } from 'jsdom';
import headerMaterial from './html/header-material.js';
import sectionise from './html/sections.js';
import toc from './html/toc.js';
import sectionals from './html/sectionals.js';
import dataTables from './html/data-tables.js';
import references from './html/references.js';
import reportErrors from './html/report-errors.js';
import sanitiseSchema from './md/sanitise-schema.js';
import makeRemarkExtendedDirectives from './md/extended-directives.js';
import remarkRFC2119 from './md/rfc2119.js';
import makeRel from './rel.js';
import saveJSON from './save-json.js';

const rel = makeRel(import.meta.url);

export default class IpseityProcessor {
  constructor ({ template }) {
    this.template = template;
  }
  async processMD (md, opt = {}) {
    if (!opt.lastModified) {
      if (opt.page && opt.page.date) opt.lastModified = opt.page.date;
      else opt.lastModified = new Date();
    }
    const ctx = {
      definitions: {},
      errors: [],
      warnings: [],
      inputPath: join(rel('..'), opt.page.inputPath),
      error (err, errObj = '') {
        console.error(err, errObj);
        ctx.errors.push({ err, errObj });
      },
      warning (err, errObj = '') {
        console.warn(err, errObj);
        ctx.warnings.push({ err, errObj });
      },
    };
    const html = await remark()
      .use(remarkDirective)
      .use(remarkRFC2119)
      .use(makeRemarkExtendedDirectives(ctx))
      .use(remarkSqueezeGrafs)
      .use(remarkHeadingID)
      .use(remarkPrism)
      .use(remarkHTML, { sanitize: sanitiseSchema })
      .process(md)
    ;
    if (html.messages) {
      html.messages.forEach(msg => {
        ctx[msg.fatal ? 'error' : 'warning'](msg.reason, msg.stack);
      });
    }
    return this.generateHTML(String(html), opt, ctx);
  }

  async generateHTML (body, opt, ctx) {
    const dom = new JSDOM(this.template.replace(/\$\{\s*body\s*\}/, body));
    const { window: { document: doc } } = dom;
    // if this grows, these could benefit from a unified signature
    headerMaterial(doc, opt, ctx);
    sectionise(doc.body);
    await references(doc, opt, ctx);
    toc(doc);
    sectionals(doc);
    await dataTables(doc, ctx);
    reportErrors(doc, ctx);
    const citeMeta = {
      title: doc.title,
      authors: (opt.editors || []).map(ed => ed.name),
      date: opt.lastModified.toISOString().replace(/T.*/, ''),
      shortName: opt.page.fileSlug,
      href: `https://specs.ipfs.tech${opt.page.url}`,
    };
    await saveJSON(rel(`../refs/cite/${citeMeta.shortName}.json`), citeMeta);
    await saveJSON(rel(`../refs/dfn/${citeMeta.shortName}.json`), ctx.definitions);
    return dom.serialize();
  }

  disable () {}
}

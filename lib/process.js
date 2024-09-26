
import { join } from 'path';
import { readFile, mkdir } from 'fs/promises';
import { remark } from 'remark';
import remarkDirective from 'remark-directive';
import remarkHeadingID from 'remark-heading-id';
import remarkSqueezeGrafs from 'remark-squeeze-paragraphs';
import remarkHTML from 'remark-html';
import { JSDOM } from 'jsdom';
import chalk from 'chalk';
import headerMaterial from './html/header-material.js';
import sectionise from './html/sections.js';
import toc from './html/toc.js';
import sectionals from './html/sectionals.js';
import dataTables from './html/data-tables.js';
import references from './html/references.js';
import acknowledgments from './html/acknowledgments.js';
import reportErrors from './html/report-errors.js';
import sanitiseSchema from './md/sanitise-schema.js';
import makeRemarkExtendedDirectives from './md/extended-directives.js';
import remarkRFC2119 from './md/rfc2119.js';
import makeRel from './rel.js';
import saveJSON from './save-json.js';
import loadJSON from './load-json.js';
import { definitionsToWebRef } from './reference-manager.js';

const rel = makeRel(import.meta.url);

export default class IpseityProcessor {
  constructor ({ template, output, baseURL, quietMode, github }) {
    this.template = template;
    this.output = output;
    this.baseURL = baseURL;
    this.quietMode = quietMode;
    this.github = github;
  }
  async render (md, opt = {}) {
    if (!opt.lastModified) {
      if (opt.page?.date) opt.lastModified = opt.page.date;
      else opt.lastModified = new Date();
    }
    const citesFile = join(this.output, `.well-known/spec-generator/references.json`);
    const defsPath = join(this.output, `.well-known/spec-generator/definitions/`);
    await mkdir(defsPath, { recursive: true });
    const quietMode = this.quietMode;
    const ctx = {
      definitions: {},
      errors: [],
      warnings: [],
      inputPath: join(rel('..'), opt.page.inputPath),
      baseURL: this.baseURL,
      output: this.output,
      citesFile,
      defsPath,
      github: this.github,
      error (err, errObj = '') {
        ctx.errors.push({ err, errObj });
        if (quietMode) return;
        console.error(chalk.red.bold(err), errObj);
      },
      warning (err, errObj = '') {
        ctx.warnings.push({ err, errObj });
        if (quietMode) return;
        console.warn(chalk.yellow.bold(err), errObj);
      },
    };
    const html = await remark()
      .use(remarkDirective)
      .use(remarkRFC2119)
      .use(makeRemarkExtendedDirectives(ctx))
      .use(remarkSqueezeGrafs)
      .use(remarkHeadingID)
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
    const tmpl = await readFile(this.template, 'utf-8');
    const dom = new JSDOM(tmpl.replace(/\$\{\s*body\s*\}/, body));
    const { window: { document: doc } } = dom;
    await headerMaterial(doc, opt, ctx);
    await sectionise(doc, opt, ctx);
    await references(doc, opt, ctx);
    await acknowledgments(doc, opt, ctx);
    await toc(doc, opt, ctx);
    await sectionals(doc, opt, ctx);
    await dataTables(doc, opt, ctx);
    await reportErrors(doc, opt, ctx);

    const shortName = opt.page.fileSlug;
    const url = `${this.baseURL}${opt.page.url}`;
    let cites;
    try {
      cites = await loadJSON(ctx.citesFile);
    }
    catch (err) {
      cites = {};
    }
    cites[shortName] = {
      title: doc.title,
      authors: (opt.editors || []).map(ed => ed.name),
      date: opt.lastModified.toISOString().replace(/T.*/, ''),
      shortName,
      href: url,
    };
    const defsMeta = definitionsToWebRef(ctx.definitions, doc.title, url);
    await saveJSON(ctx.citesFile, cites);
    await saveJSON(join(ctx.defsPath, `${shortName}.json`), defsMeta);
    const linkCanonical = doc.querySelector('link[rel=canonical]');
    if (linkCanonical) linkCanonical.href = url;
    return dom.serialize();
  }

  async maybeLoad(file) {
    try {
      return await loadJSON(file);
    }
    catch (err) {
      return {};
    }
  }

  disable () {}
}

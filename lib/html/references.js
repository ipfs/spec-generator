
import bibref from 'specref/lib/bibref.js';
import makeRel from '../rel.js';
import loadJSON from '../load-json.js';
import { makeEl } from './utils.js';

const rel = makeRel(import.meta.url);

export default async function run (doc, opt, ctx) {
  const el = makeEl(doc);
  let allDefs = {};
  if (opt && opt.xref) {
    for (const defSrc of opt.xref.reverse()) {
      try {
        const defMap = await indexDefinitions(defSrc);
        allDefs = { ...allDefs, ...defMap };
      }
      catch (err) {
        ctx.error(`Could not load data for spec "${defSrc}"`, err);
      }
    }
  }
  allDefs = { ...allDefs, ...ctx.definitions };
  for (const ref of doc.querySelectorAll('a.ipseity-unresolved-ref')) {
    const term = ref.getAttribute('href');
    if (allDefs[term]) ref.setAttribute('href', allDefs[term]);
    else ctx.error(`No definition for term "${term}".`);
    ref.removeAttribute('class');
  }
  const citeKeys = new Set([...doc.querySelectorAll('a.ipseity-unresolved-cite')].map(cite => cite.getAttribute('href')));
  if (doc.querySelector('em.rfc2119')) citeKeys.add('rfc2119');
  const allCites = {};
  const specRefKeys = [];
  for (const key of citeKeys) {
    try {
      allCites[key] = await loadJSON(rel(`../../refs/cite/${key}.json`));
    }
    catch (err) {
      specRefKeys.push(key);
    }
  }
  Object.assign(allCites, bibref.getRefs(specRefKeys));
  const idMap = {};
  const killKeys = new Set();
  Object.keys(allCites).forEach(k => {
    let refContent = allCites[k];
    let key = k;
    const circular = new Set([key]);
    while (refContent && refContent.aliasOf) {
      killKeys.add(key);
      if (circular.has(refContent.aliasOf)) {
        refContent = null;
        ctx.error(`Circular reference in biblio DB between "${k}" and "${key}".`);
      }
      else {
        key = refContent.aliasOf;
        refContent = allCites[key];
        circular.add(key);
      }
    }
    idMap[k] = refContent.id || key.toLowerCase();
  });
  [...killKeys].forEach(k => delete allCites[k]);
  for (const ref of doc.querySelectorAll('a.ipseity-unresolved-cite')) {
    const term = ref.getAttribute('href');
    if (idMap[term]) {
      ref.setAttribute('href', `#ref-${idMap[term]}`);
      ref.before(doc.createTextNode('['));
      ref.after(doc.createTextNode(']'));
    }
    else ctx.error(`No bibliographic reference for key "${term}".`);
    ref.setAttribute('class', 'bibref');
  }

  const sec = el('section', { class: 'appendix' }, [el('h2', {}, ['References'])]);
  doc.querySelector('section:last-of-type').after(sec);
  const citeDefs = [];
  Object.keys(allCites).sort().forEach(cite => {
    citeDefs.push(el('dt', { id: `ref-${allCites[cite].id || cite.toLowerCase()}`}, ['[', cite, ']']));
    const ref = allCites[cite];
    if (typeof ref === 'string') {
      citeDefs.push(el('dd', {}, [ref]));
      return;
    }
    const { title, href, authors, etAl, publisher, date, status } = ref;
    const output = [];
    const titEl = el('cite', {}, [title]);
    output.push(
      href
      ? el('a', { href }, [titEl])
      : titEl
    );
    output.push('. ');
    if (authors && authors.length) {
      output.push(authors.join('; '));
      if (etAl) output.push(' et al');
      output.push('. ');
    }
    if (publisher) output.push(`${publisher.replace(/\.\s*/, '')}. `);
    if (date) output.push(`${date}. `);
    if (status) output.push(`${status}. `);
    if (href) output.push('URL: ', el('a', { href }, [href]));
    citeDefs.push(el('dd', {}, output));
  });
  sec.appendChild(el('dl', { class: 'bibliography' }, citeDefs));
}

async function indexDefinitions (shortName) {
  const data = await loadJSON(rel(`../../node_modules/webref/ed/dfns/${shortName}.json`));
  const defs = {};
  data
    .dfns
    .filter(({ type }) => type === 'dfn')
    .forEach(({ definedIn, linkingText, href }) => {
      const ids = (definedIn === 'pre') ? linkingText : linkingText.map(lt => lt.toLowerCase());
      ids.forEach(id => defs[id] = href);
    })
  ;
  return defs;
}

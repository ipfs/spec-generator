
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
  for (const ref of doc.querySelectorAll('a.ipseity-unresolved-cite')) {
    const term = ref.getAttribute('href');
    if (allCites[term]) ref.setAttribute('href', `#ref-${term}`);
    else ctx.error(`No bibliographic reference for key "${term}".`);
    ref.removeAttribute('class');
  }

  const sec = el('section', { class: 'appendix' }, [el('h2', {}, ['References'])]);
  doc.querySelector('section:last-of-type').after(sec);
  // XXX
  // - generate appendix
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


import { readFile } from 'node:fs/promises';
import axios from "axios";
import bibref from 'specref/lib/bibref.js';
import makeRel from './rel.js';
import { join } from 'node:path';
import loadJSON from './load-json.js';

const rel = makeRel(import.meta.url);
const webrefPath = rel('../node_modules/webref/ed/dfns/');

const definitionSources = [
  'https://specs.ipfs.tech/.well-known/definitions/',
];
const referenceSources = [
  'https://specs.ipfs.tech/.well-known/references.json',
];
// these are meant to be global and used as a singleton
const allDefinitions = {};
const defsCacheByShortname = {};
const citeCache = {};
const idMapCache = {};
let hasInit = false;


export async function init (ctx) {
  if (hasInit) return;
  hasInit = true;
  if (ctx.citesFile) {
    try {
      Object.assign(citeCache, await loadJSON(ctx.citesFile));
    }
    catch (err) {/*noop*/}
  }
  for (const src of referenceSources) {
    try {
      const res = await axios.get(src, { timeout: 2000 });
      if (res.status !== 200) continue;
      Object.assign(citeCache, await res.data);
    }
    catch (err) {/*noop*/}
  }
}

// the list of citeKeys is resolved using cache, URLs, and bibref
// what is resolved is put in the cache and citeForID uses that
// this returns a list of biblio references that does *not* include all the data that was resolved by citeKeys
// that's because that data has aliases from bibref and so there are dupe entries
// we're happy with dupes in the cache, but not in the biblio - the list is what should be used for the biblio
export async function resolveReferences (citeKeys) {
  const allCites = {};
  const specRefKeys = [];
  for (const key of citeKeys) {
    if (citeCache[key]) allCites[key] = citeCache[key];
    else specRefKeys.push(key);
  }
  const bibData = bibref.getRefs(specRefKeys);
  Object.assign(citeCache, bibData);
  Object.assign(allCites, bibData);
  const killKeys = new Set();
  Object.keys(allCites).forEach(k => {
    let refContent = allCites[k];
    let key = k;
    const circular = new Set([key]);
    while (refContent && refContent.aliasOf) {
      killKeys.add(key);
      if (circular.has(refContent.aliasOf)) {
        refContent = null;
        // ctx.error(`Circular reference in biblio DB between "${k}" and "${key}".`);
      }
      else {
        key = refContent.aliasOf;
        refContent = allCites[key];
        circular.add(key);
      }
    }
    idMapCache[k] = refContent?.id || key.toLowerCase();
  });
  [...killKeys].forEach(k => delete allCites[k]);
  return allCites;
}

export function citeForID (id) {
  return citeCache[id];
}

export function idMap (id) {
  return idMapCache[id];
}

export function linkForTerm (term) {
  return allDefinitions[term]?.href;
}

export function dataForTerm (term) {
  return allDefinitions[term];
}

// xref is the list of xref sources, definitions is the definitions from the spec
export async function indexDefinitions (xref, definitions, ctx) {
  const defData = await Promise.all(xref.reverse().map(shortName => defsForShortname(shortName, ctx)));
  defData
    .map(webRefToDefinitions)
    .forEach(defMap => Object.assign(allDefinitions, defMap))
  ;
  Object.assign(allDefinitions, definitions);
}

export async function defsForShortname (shortName, ctx) {
  if (defsCacheByShortname[shortName]) return defsCacheByShortname[shortName];
  try {
    const defs = JSON.parse(await readFile(join(webrefPath, `${shortName}.json`)));
    defsCacheByShortname[shortName] = defs;
    return defs;
  }
  catch (err) {/*noop*/}
  try {
    const defs = JSON.parse(await readFile(join(ctx.defsPath, `${shortName}.json`)));
    defsCacheByShortname[shortName] = defs;
    return defs;
  }
  catch (err) {/*noop*/}
  // XXX also look from IDL and friends
  try {
    const defs = await Promise.any(definitionSources.map(src => `${src}${shortName}.json`).map(must200));
    defsCacheByShortname[shortName] = defs;
    return defs;
  }
  catch (err) {
    return null;
  }
}

async function must200 (url) {
  const res = await axios.get(url, { timeout: 5000 });
  if (res.status !== 200) throw new Error(`We only accept success!`);
  return await res.data;
}

export function definitionsToWebRef (definitions, title, url) {
  return {
    spec: {
      title,
      url,
    },
    dfns: Object.entries(definitions || {}).map(([text, id]) => {
      return {
        id: id.replace(/^#/, ''),
        href: `${url}${id}`,
        linkingText: [text],
        type: 'dfn',
        access: 'public',
        definedIn: 'prose',
      }
    }),
  }
}

function webRefToDefinitions (data) {
  const defs = {};
  ((data || [])
    .dfns || [])
    // .filter(({ type }) => type === 'dfn')
    .forEach(({ definedIn, linkingText, href, type }) => {
      const ids = (definedIn === 'pre') ? linkingText : linkingText.map(lt => lt.toLowerCase());
      ids.forEach(id => defs[id] = { href, type });
    })
  ;
  return defs;
}

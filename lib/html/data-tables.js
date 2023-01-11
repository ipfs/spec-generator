
import { resolve, dirname } from 'path';
import loadJSON from '../load-json.js';
import { makeEl } from './utils.js';

export default async function run (doc, ctx) {
  const el = makeEl(doc);
  const dataTables = doc.querySelectorAll(`ipseity-data-table`);
  for (const tbl of dataTables) {
    const src = tbl.getAttribute('src');
    const configPath = tbl.getAttribute('config');
    if (!src) {
      ctx.error(`Data table leaf node requires an src attribute.`);
      continue;
    }
    let json, config = {};
    try {
      json = await loadJSON(resolve(dirname(ctx.inputPath), src));
      if (!Array.isArray(json)) {
        ctx.error(`Data for ${src} isn't an array.`);
        continue;
      }
    }
    catch (err) {
      ctx.error(`Couldn't load data from ${src}`, err);
      continue;
    }
    if (configPath) {
      try {
        config = await loadJSON(resolve(dirname(ctx.inputPath), configPath));
      }
      catch (err) {
        ctx.error(`Couldn't load configuration from ${configPath}`, err);
        continue;
      }
    }
    const cols = config.columns || Object.keys(json[0] || {});
    if (!cols.length) {
      ctx.error(`No columns for ${src}`);
      continue;
    }
    const ths = cols.map(k => {
      const th = el('th', {}, [config.labels?.[k] || k]);
      if (config.sorts?.[k]) th.setAttribute('data-ipseity-sort', config.sorts[k]);
      return th;
    });
    const trs = json.map(line => {
      const tds = cols.map(k => el('td', {}, [line[k] || '\xa0']));
      return el('tr', {}, tds);
    });
    const table = el('table', { class: 'ipseity-data-table' }, [
      el('thead', {}, [
        el('tr', {}, ths),
      ]),
      el('tbody', {}, trs),
    ]);
    tbl.replaceWith(table);
  }
  if (dataTables.length) {
    doc.body.appendChild(el('script', { src: '/data-tables.js' }))
  }
}

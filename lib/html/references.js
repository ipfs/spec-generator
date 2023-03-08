
import { makeEl } from './utils.js';
import { indexDefinitions, linkForTerm, resolveReferences, citeForID } from '../reference-manager.js';

export default async function run (doc, opt, ctx) {
  const el = makeEl(doc);
  console.warn(`indexDefinitions`);
  await indexDefinitions(opt?.xref || [], ctx.definitions || {});
  for (const ref of doc.querySelectorAll('a.ipseity-unresolved-ref')) {
    const term = ref.getAttribute('href');
    if (linkForTerm(term)) ref.setAttribute('href', linkForTerm(term));
    else ctx.error(`No definition for term "${term}".`);
    ref.removeAttribute('class');
  }
  const citeKeys = new Set([...doc.querySelectorAll('a.ipseity-unresolved-cite')].map(cite => cite.getAttribute('href')));
  if (doc.querySelector('em.rfc2119')) citeKeys.add('rfc2119');
  console.warn(`resolveReferences`, citeKeys);
  const allCites = await resolveReferences(citeKeys);
  console.warn(`OK…`);

  for (const ref of doc.querySelectorAll('a.ipseity-unresolved-cite')) {
    const term = ref.getAttribute('href');
    if (citeForID(term)) {
      ref.setAttribute('href', `#ref-${citeForID(term)}`);
      ref.before(doc.createTextNode('['));
      ref.after(doc.createTextNode(']'));
    }
    else ctx.error(`No bibliographic reference for key "${term}".`);
    ref.setAttribute('class', 'bibref');
  }

  if (!Object.keys(allCites).length) return;
  const sec = el('section', { class: 'appendix' }, [el('h2', {}, ['References'])]);
  const lastSection = doc.querySelector('body > section:last-child');
  if (lastSection) lastSection.after(sec);
  else doc.body.appendChild(sec);
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

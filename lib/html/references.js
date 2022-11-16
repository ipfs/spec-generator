
export default async function run (doc, ctx) {
  for (const ref of doc.querySelectorAll('a.ipseity-unresolved-ref')) {
    const term = ref.getAttribute('href');
    if (ctx.definitions[term]) ref.setAttribute('href', ctx.definitions[term]);
    // XXX look up in other ways
    else ctx.error(`No definition for term "${term}".`);
    ref.removeAttribute('class');
  }
  // XXX
  //  - links to inner dfns
  //  - failed links to dfns
  //  - local lookups for imported xrefs either local or from webref
  //  - local lookups for SpecRef data
  // const headings = doc.querySelectorAll(
  //   `section h2, h3, h4, h5, h6`
  // );
  // for (const h of headings) {
  //   const id = h.id || h.parentNode.id;
  //   const label = `${h.closest(".appendix") ? "Appendix" : "Section"} ${h.querySelector(":scope > bdi.secno").textContent.trim()}`;
  //   const wrapper = doc.createElement('div');
  //   wrapper.setAttribute('class', 'header-wrapper');
  //   h.replaceWith(wrapper);
  //   const selfLink = doc.createElement('a');
  //   selfLink.setAttribute('href', `#${id}`);
  //   selfLink.setAttribute('class', 'self-link');
  //   selfLink.setAttribute('aria-label', label);
  //   wrapper.append(h, selfLink);
  // }
}

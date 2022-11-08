
// This borrows heavily from https://github.com/w3c/respec/blob/main/src/core/structure.js
// See https://github.com/w3c/respec/blob/main/LICENSE

export default function run (doc) {
  const headings = doc.querySelectorAll(
    `section h2, h3, h4, h5, h6`
  );
  for (const h of headings) {
    const id = h.id || h.parentNode.id;
    const label = `${h.closest(".appendix") ? "Appendix" : "Section"} ${h.querySelector(":scope > bdi.secno").textContent.trim()}`;
    const wrapper = doc.createElement('div');
    wrapper.setAttribute('class', 'header-wrapper');
    h.replaceWith(wrapper);
    const selfLink = doc.createElement('a');
    selfLink.setAttribute('href', `#${id}`);
    selfLink.setAttribute('class', 'self-link');
    selfLink.setAttribute('aria-label', label);
    wrapper.append(h, selfLink);
  }
}

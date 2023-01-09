
import { makeEl } from './utils.js';

// This borrows heavily from https://github.com/w3c/respec/blob/main/src/core/structure.js
// See https://github.com/w3c/respec/blob/main/LICENSE

export default function run (doc) {
  const el = makeEl(doc);
  const headings = doc.querySelectorAll(
    `section h2, h3, h4, h5, h6`
  );
  for (const h of headings) {
    const id = h.id || h.parentNode.id;
    const label = `${h.closest(".appendix") ? "Appendix" : "Section"} ${h.querySelector(":scope > bdi.secno").textContent.trim()}`;
    // const wrapper = el('div', { class: 'header-wrapper' });
    // h.replaceWith(wrapper);
    const selfLink = el('a', {
      href: `#${id}`,
      class: 'self-link',
      'aria-label': label,
    });
    h.after(selfLink);
    // wrapper.append(h, selfLink);
  }
}

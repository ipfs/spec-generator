
import { makeEl } from './utils.js';

// This borrows heavily from https://github.com/w3c/respec/blob/main/src/core/structure.js
// See https://github.com/w3c/respec/blob/main/LICENSE

import { addId, parents, renameElement } from "./utils.js";

const lowerHeaderTags = ["h2", "h3", "h4", "h5", "h6"];

function scanSections(el, sections, { prefix = "" } = {}) {
  let appendixMode = false;
  let lastNonAppendix = 0;
  let index = 1;
  if (prefix.length && !prefix.endsWith(".")) prefix += ".";
  if (sections.length === 0) return null;
  const ol = el('ol', { class: 'toc' });
  for (const section of sections) {
    if (section.isAppendix && !prefix && !appendixMode) {
      lastNonAppendix = index;
      appendixMode = true;
    }
    let secno = section.isIntro
      ? ""
      : appendixMode
      ? appendixNumber(index - lastNonAppendix + 1)
      : prefix + index;
    const level = secno.split(".").length;
    if (level === 1) secno += ".";

    if (!section.isIntro) {
      index += 1;
      const bdi = el('bdi', { class: 'secno' }, [`${secno} `]);
      section.header.prepend(bdi);
    }

    const id = section.header.id || section.element.id;
    const item = createTocListItem(el, section.header, id);
    const sub = scanSections(el, section.subsections, { prefix: secno });
    if (sub) item.append(sub);
    ol.append(item);
  }
  return ol;
}

function appendixNumber (num) {
  let s = '';
  while (num > 0) {
    num -= 1;
    s = String.fromCharCode(65 + (num % 26)) + s;
    num = Math.floor(num / 26);
  }
  return s;
}

function getSectionTree (parent) {
  const sectionElements = parent.querySelectorAll(":scope > section");
  const sections = [];

  for (const section of sectionElements) {
    const noToc = section.classList.contains("notoc");
    if (!section.children.length || noToc) continue;
    const header = section.children[0];
    if (!lowerHeaderTags.includes(header.localName)) continue;
    const title = header.textContent;
    addId(section, null, title);
    sections.push({
      element: section,
      header,
      title,
      isIntro: false,
      isAppendix: section.classList.contains("appendix"),
      subsections: getSectionTree(section),
    });
  }
  return sections;
}

function createTocListItem (el, header, id) {
  const anchor = el('a', { href: `${`#${id}`}`, class: `tocxref` }, [...header.cloneNode(true).childNodes]);
  filterHeader(anchor);
  return el('li', {}, [anchor]);
}

function filterHeader (h) {
  h.querySelectorAll("a").forEach(anchor => {
    const span = renameElement(anchor, "span");
    span.className = "formerLink";
    span.removeAttribute("href");
  });
  h.querySelectorAll("dfn").forEach(dfn => {
    const span = renameElement(dfn, "span");
    span.removeAttribute("id");
  });
}

export default async function run (doc) {
  const el = makeEl(doc);
  renameSectionHeaders(doc);
  const sectionTree = getSectionTree(doc.body);
  const result = scanSections(el, sectionTree);
  if (result) createTableOfContents(doc, el, result);
}

function renameSectionHeaders (doc) {
  const headers = [
    ...doc.querySelectorAll(
      "section :is(h1,h2,h3,h4,h5,h6):first-child"
    ),
  ];
  if (!headers.length) return;
  headers.forEach(header => {
    const depth = Math.min(parents(header, "section").length + 1, 6);
    const h = `h${depth}`;
    if (header.localName !== h) renameElement(header, h);
  });
}

function createTableOfContents (doc, el, ol) {
  if (!ol) return;
  const nav = el('nav', { id: 'toc' });
  const h2 = el('h2', {}, ['Table of Contents']);
  // h2.setAttribute('class', 'introductory');
  addId(h2);
  // special behaviour if there's no subsectioning
  if (!ol.querySelector('li li')) ol.classList.add('no-depth');
  nav.append(h2, ol);
  const section = doc.querySelector('section');
  if (section) {
    section.before(nav);
  }
  else {
    const header = doc.querySelector('header');
    header.after(nav);
  }

  doc.body.append(el('p', { role: 'navigation', id: 'back-to-top' }, [
    el('a', { href: '#title' }, [
      el('abbr', { title: 'Back to top' }, ['↑'])
    ])
  ]));
}

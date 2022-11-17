
// This borrows heavily from https://github.com/w3c/respec/blob/main/src/core/utils.js
// See https://github.com/w3c/respec/blob/main/LICENSE

export function addId (elem, pfx = '', txt = '', noLC = false) {
  if (elem.id) return elem.id;
  if (!txt) txt = (elem.title ? elem.title : elem.textContent).trim();
  let id = noLC ? txt : txt.toLowerCase();
  id = id
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\W+/gim, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
  ;

  if (!id) {
    id = "generatedID";
  }
  else if (/\.$/.test(id) || !/^[a-z]/i.test(pfx || id)) {
    id = `x${id}`; // trailing . doesn't play well with jQuery
  }
  if (pfx) id = `${pfx}-${id}`;
  if (elem.ownerDocument.getElementById(id)) {
    let i = 0;
    let nextId = `${id}-${i}`;
    while (elem.ownerDocument.getElementById(nextId)) {
      i += 1;
      nextId = `${id}-${i}`;
    }
    id = nextId;
  }
  elem.id = id;
  return id;
}

export function parents (element, selector) {
  const list = [];
  let parent = element.parentElement;
  while (parent) {
    const closest = parent.closest(selector);
    if (!closest) break;
    list.push(closest);
    parent = closest.parentElement;
  }
  return list;
}

export function renameElement (elem, newName, options = { copyAttributes: true }) {
  if (elem.localName === newName) return elem;
  const newElement = elem.ownerDocument.createElement(newName);
  if (options.copyAttributes) {
    for (const { name, value } of elem.attributes) {
      newElement.setAttribute(name, value);
    }
  }
  newElement.append(...elem.childNodes);
  elem.replaceWith(newElement);
  return newElement;
}

export function el (doc, name, attr, content) {
  let elt = doc.createElement(name);
  if (attr) {
    Object.keys(attr).forEach(k => elt.setAttribute(k, attr[k]));
  }
  if (content) {
    content
      .filter(Boolean)
      .forEach(obj => {
        if (typeof obj === 'string') obj = doc.createTextNode(obj);
        else if (typeof obj === 'number') obj = doc.createTextNode(String(obj));
        elt.appendChild(obj);
      })
    ;
  }
  return elt;
}

export function makeEl (doc) {
  return (name, attr, content) => el(doc, name, attr, content);
}

import { makeEl } from './utils.js';

export default async function run (doc, opt, ctx) {
  const el = makeEl(doc);

  const sec = el('section', { class: 'appendix' }, [el('h2', {}, ['Acknowledgments'])]);
  const lastSection = doc.querySelector('body > section:last-child');
  if (lastSection) lastSection.after(sec);
  else doc.body.appendChild(sec);

  const metaEls = [];

  // Extra preface if more than one person contributed.
  const all = [...(opt.editors || []), ...(opt.former_editors || []), ...(opt.acknowledgements || [])];
  if (all.length > 1) {
    let thanks = 'We gratefully acknowledge the following individuals for their valuable contributions, ranging from minor suggestions to major insights, which have shaped and improved this specification.'
    sec.appendChild(el('p', {}, [thanks]));
  }

  if (opt.editors) {
    appendIndividuals(el, metaEls, opt.editors, `Editor${opt.editors.length > 1 ? 's' : ''}`, ctx)
  } else {
    ctx.error(`Frontmatter must have at least one editor.`);
  }

  if (opt.former_editors) {
    appendIndividuals(el, metaEls, opt.former_editors, `Former Editor${opt.former_editors.length > 1 ? 's' : ''}`, ctx)
  }

  if (opt.acknowledgments) {
    appendIndividuals(el, metaEls, opt.acknowledgments, 'Acknowledgments', ctx)
  }

  // TODO>: editors or former editors should not be mepty

  sec.appendChild(el('dl', { class: 'bibliography' }, metaEls));
}

function appendIndividuals (el, metaEls, optList, groupTitle, ctx) {
  metaEls.push(el('dt', {}, [groupTitle]));
  optList.forEach(
    ({ name, email, url, github, twitter, mastodon, affiliation: { name: affiliationName, url: affiliationURL } = {}}) => {
      if (!name) {
        ctx.error(`Every person must have a name in acknowledgments/editors list.`);
        return;
      }
      const person = [];
      if (url) person.push(el('a', { href: url }, [name]));
      else person.push(el('span', {}, [name]));
      if (affiliationName) {
        person.push(' (');
        if (affiliationURL) person.push(el('a', { href: affiliationURL }, [affiliationName]));
        else person.push(el('span', {}, [affiliationName]));
        person.push(')');
      }
      if (email) {
        person.push(' ');
        person.push(el('a', { href: `mailto:${email}` }, [
          el('img', { src: '/img/email.svg', width: '16', height: '16', alt: `Email: ${email}` })
        ]));
      }
      if (github) {
        person.push(' ');
        person.push(el('a', { href: `https://github.com/${github.replace('@', '')}` }, [
          el('img', { src: '/img/gh.png', width: '16', height: '16', alt: 'GitHub' })
        ]));
      }
      if (twitter) {
        person.push(' ');
        person.push(el('a', { href: `https://x.com/${twitter.replace('@', '')}` }, [
          el('img', { src: '/img/twitter.svg', width: '16', height: '16', alt: 'Twitter' })
        ]));
      }
      if (mastodon) {
        person.push(' ');
        const [user, domain] = mastodon.replace(/^@/, '').split('@');
        person.push(el('a', { href: `https://${domain}/@${user}` }, [
          el('img', { src: '/img/mastodon.png', width: '16', height: '16', alt: 'Mastodon' })
        ]));
      }
      metaEls.push(el('dd', {}, person));
    });
}


import { makeEl } from './utils.js';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                'September', 'October', 'November', 'December'];

export default function run (doc, opt, ctx) {
  const el = makeEl(doc);
  let h1 = doc.querySelector('h1');
  if (!h1) {
    h1 = el('h1', {}, ['Untitled']);
    ctx.error(`Document does not have a title, you need to add a '# My Doc' near the top.`);
  }
  h1.setAttribute('id', 'title');
  doc.title = h1.textContent;
  const lm = opt.lastModified;
  const pDate = el('p', { id: 'last-modified' }, [
    el('time', { datetime: lm.toISOString() }, [`${lm.getDate()} ${months[lm.getMonth()]} ${lm.getFullYear()}`])
  ]);
  const metaEls = [];
  if (opt.editors) {
    metaEls.push(el('dt', {}, [`Editor${opt.editors.length > 1 ? 's' : ''}`]));
    opt.editors.forEach(
      ({ name, email, url, github, twitter, mastodon, affiliation: { name: affiliationName, url: affiliationURL } = {}}) => {
        if (!name) {
          ctx.error(`Every person must have a name in editors list.`);
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
            el('img', { src: '/email.svg', width: '16', height: '16', alt: `Email: ${email}` })
          ]));
        }
        if (github) {
          person.push(' ');
          person.push(el('a', { href: `https://github.com/${github.replace('@', '')}` }, [
            el('img', { src: '/gh.png', width: '16', height: '16', alt: 'GitHub' })
          ]));
        }
        if (twitter) {
          person.push(' ');
          person.push(el('a', { href: `https://twitter.com/${twitter.replace('@', '')}` }, [
            el('img', { src: '/twitter.svg', width: '16', height: '16', alt: 'Twitter' })
          ]));
        }
        if (mastodon) {
          person.push(' ');
          const [user, domain] = mastodon.replace(/^@/, '').split('@');
          person.push(el('a', { href: `https://${domain}/@${user}` }, [
            el('img', { src: '/mastodon.png', width: '16', height: '16', alt: 'Mastodon' })
          ]));
        }
        metaEls.push(el('dd', {}, person));
      });
  }
  else ctx.error(`Frontmatter must have an editors field.`);
  const dl = metaEls.length ? el('dl', null, metaEls) : null;
  const header = el('header', {}, [h1, pDate, dl]);
  doc.querySelector('#ipseity-back-to-root').after(header);
}


import { makeEl } from './utils.js';
import { relative } from 'path';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                'September', 'October', 'November', 'December'];
const maturityColours = {
  draft: 'yellow',
  wip: 'orange',
  reliable: 'green',
  stable: 'brightgreen',
  permanent: 'blue',
  deprecated: 'red',
};

export default async function run (doc, opt, ctx) {
  const el = makeEl(doc);
  let h1 = doc.querySelector('h1');
  if (opt.title) {
    h1 = el('h1', {}, [opt.title])
  } else {
    h1 = el('h1', {}, ['Untitled']);
    ctx.error(`Document does not have a title, you need to add a 'title: My Doc' in the frontmatter.`);
  }
  h1.setAttribute('id', 'title');
  doc.title = h1.textContent;
  if (opt.description) {
    const description = doc.querySelector('meta[name="description"]')
    if (!description) {
      ctx.error('Template file should contain a <meta> tag for the description.')
    } else {
      description.setAttribute('content', opt.description.replaceAll('\n', ' ').trim())
    }
  }
  const lm = opt.lastModified;
  const pDate = el('p', { id: 'last-modified' }, [
    el('time', { datetime: lm.toISOString() }, [`${lm.getUTCDate()} ${months[lm.getUTCMonth()]} ${lm.getUTCFullYear()}`])
  ]);
  let maturity;
  if (opt.maturity) {
    let col = maturityColours[opt.maturity];
    if (!col) {
      ctx.warning(`Unknown maturity "${opt.maturity}".`);
      col = 'ff96b4';
    }
    maturity = el('div', { class: 'ipseity-maturity'}, [
      el('img', {
        src: `https://img.shields.io/badge/status-${opt.maturity}-${col}.svg?style=flat-square`,
        height: 20,
        alt: `status: ${opt.maturity}`,
      })
    ]);
  }
  if (opt.ipip) {
    doc.querySelector('body').classList.add(`ipip-${opt.ipip}`)
  }
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
          person.push(el('a', { href: `https://twitter.com/${twitter.replace('@', '')}` }, [
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
  else ctx.error(`Frontmatter must have an editors field.`);
  if (opt.relatedIssues) {
    metaEls.push(el('dt', {}, [`Related Issue${opt.relatedIssues.length > 1 ? 's' : ''}`]));
    opt.relatedIssues.forEach(urlStr => {
      let url = new URL(urlStr);
      let name = url.hostname + url.pathname;
      if (url.hostname == 'github.com') name = url.pathname;
      if (name.startsWith('/')) name = name.substring(1);
      metaEls.push(el('dd', {}, [el('a', { href: url.toString() }, [name])]));
    })
  }
  if (ctx.github) {
    const { repository, defaultBranch = 'main' } = ctx.github
    if (!repository) {
      ctx.error('github.repository must be defined if github is defined');
      return;
    }
    const filepath = relative(opt.eleventy.env.root, opt.page.inputPath)
    metaEls.push(el('dt', {}, ['History']));11
    metaEls.push(el('dd', {}, [el('a', { href: `https://github.com/${repository}/commits/${defaultBranch}/${filepath}` }, ['Commit History'])]));
    metaEls.push(el('dt', {}, ['Feedback']));
    metaEls.push(el('dd', {}, [
      el('a', { href: `https://github.com/${repository}` }, [`GitHub ${repository}`]),
      el('span', {}, [' (']),
      el('a', { href: `https://github.com/${repository}/pulls` }, ['pull requests']),
      el('span', {}, [', ']),
      el('a', { href: `https://github.com/${repository}/issues/new/choose` }, ['new issue']),
      el('span', {}, [', ']),
      el('a', { href: `https://github.com/${repository}/issues` }, ['open issues']),
      el('span', {}, [')']),
    ]));
  }
  const dl = metaEls.length ? el('dl', null, metaEls) : null;
  const abstractContent = [];
  let nxt = doc.querySelector('ipseity-header + *');
  while (nxt) {
    if (nxt.nodeType == 1 && /^h\d/i.test(nxt.localName)) break;
    abstractContent.push(nxt);
    nxt = nxt.nextSibling;
  }
  const abstract = el('div', { id: 'abstract' }, abstractContent);
  const header = el('header', {}, [h1, pDate, maturity, dl, abstract].filter(Boolean));
  const headerPosition = doc.querySelector('ipseity-header');
  if (headerPosition) headerPosition.replaceWith(header);
  else doc.body.insertBefore(header, doc.body.firstChild);
}

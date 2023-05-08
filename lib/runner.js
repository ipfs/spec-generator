
import Eleventy from '@11ty/eleventy';
import { join } from "node:path";
import IpseityProcessor from './process.js';
import makeRel from './rel.js';

const rel = makeRel(import.meta.url);

export default class IpseityRunner {
  constructor ({ input, output, template, baseURL, runMode = 'build', quietMode = false, github = null } = {}) {
    if (!baseURL) {
      console.warn(`Defaulting baseURL configuration to "", this is probably not what you want.`);
      baseURL = '';
    }
    else {
      baseURL = baseURL.replace(/\/+$/, '');
    }
    this.elev = new Eleventy(input, output, {
      runMode,
      quietMode,
      markdownTemplateEngine: false,
      htmlTemplateEngine: false,
      config: (config) => {
        const staticDir = rel('../static');
        config.addPassthroughCopy({
          [join(staticDir, 'css')]: 'css',
          [join(staticDir, 'fonts')]: 'fonts',
          [join(staticDir, 'img')]: 'img',
          [join(staticDir, 'js')]: 'js',
        });
        const pthrough = input.replace(/\/$/, '');
        config.addPassthroughCopy(`${pthrough}/**/*.html`);
        config.addPassthroughCopy(`${pthrough}/**/*.css`);
        config.addPassthroughCopy(`${pthrough}/**/*.svg`);
        config.addPassthroughCopy(`${pthrough}/**/*.png`);
        config.addPassthroughCopy(`${pthrough}/**/*.jpg`);
        config.addPassthroughCopy(`${pthrough}/**/*.gif`);
        config.addPassthroughCopy(`${pthrough}/**/*.webp`);
        config.addPassthroughCopy(`${pthrough}/**/*.js`);
        config.addPassthroughCopy(`${pthrough}/**/*.woff`);
        config.addPassthroughCopy(`${pthrough}/**/*.woff2`);
        config.addPassthroughCopy(`${pthrough}/**/*.ttf`);
        config.addFilter('permalink', url => `${baseURL}${url}`);
        config.addFilter('singleLine', str => str.replaceAll('\n', ' ').trim());
        config.addFilter('sortByOrder', arr => [...arr].sort((a, b) => Math.sign((a.data.order ?? 999) - (b.data.order ?? 999))));
        // config.setUseGitIgnore(false); // don't know if we'll need this
        const processor = new IpseityProcessor({ template, output, baseURL, quietMode, github });
        config.ignores.add('README.md');
        config.setLibrary('md', processor);
        config.setServerOptions({
          port: 8642,
          liveReload: true,
          domDiff: true,
        });
      },
    });
  }
  async run () {
    await this.elev.init();
    await this.elev.write();
  }
  async serve () {
    await this.elev.init();
    await this.elev.watch();
    await this.elev.serve();
  }
}


import Eleventy from '@11ty/eleventy';
import { processCSS } from 'cssn';
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import IpseityProcessor from './process.js';
import makeRel from './rel.js';

const rel = makeRel(import.meta.url);
const coreCSS = await readFile(rel('../ipseity.css'), 'utf-8');

export default class IpseityRunner {
  constructor ({ input, output, template, baseURL, runMode = 'build' } = {}) {
    this.elev = new Eleventy(input, output, {
      runMode,
      markdownTemplateEngine: false,
      htmlTemplateEngine: false,
      config: (config) => {
        config.addTemplateFormats('css');
        config.addExtension('css', {
          outputFileExtension: 'css',
          compile: async function (inputContent) {
            inputContent = inputContent.replace(/@import\s+(?:url\(\s*)?(?:"|')?(ipseity|spec-generator)(?:"|')?\s*\)?\s*;/, coreCSS)
            const { css } = await processCSS(inputContent, { production: true });
            return async () => {
              return css;
            };
          }
        });
        const staticDir = rel('../static');
        config.addPassthroughCopy({
          [join(staticDir, 'fonts')]: 'fonts',
          [join(staticDir, 'img')]: 'img',
          [join(staticDir, 'js')]: 'js',
        });
        // config.setUseGitIgnore(false); // don't know if we'll need this
        const processor = new IpseityProcessor({ template, output, baseURL });
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

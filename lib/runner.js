
import Eleventy from '@11ty/eleventy';
import { processCSS } from 'cssn';
import IpseityProcessor from './process.js';
import makeRel from './rel.js';

const rel = makeRel(import.meta.url);

export default class IpseityRunner {
  constructor ({ input, output, template, runMode = 'build' } = {}) {
    console.warn(input, output, template);
    this.elev = new Eleventy(input, output, {
      runMode,
      markdownTemplateEngine: false,
      config: (config) => {
        config.addTemplateFormats('css');
        config.addExtension('css', {
          outputFileExtension: 'css',
          compile: async function (inputContent) {
            const { css } = await processCSS(inputContent, { production: true });
            return async () => {
              return css;
            };
          }
        });
        const staticDir = rel('../static');
        config.addPassthroughCopy({ [staticDir]: output });
        // config.setUseGitIgnore(false); // don't know if we'll need this
        const processor = new IpseityProcessor({ template });
        config.ignores.add('README.md');
        config.setLibrary('md', processor);
      },
    });
  }
  async run () {
    await this.elev.write();
  }
}

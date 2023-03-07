
import Eleventy from '@11ty/eleventy';
import { processCSS } from 'cssn';
import processMD from './process.js';

export default class IpseityRunner {
  constructor (input, output, { runMode = 'build' } = {}) {
    this.elev = new Eleventy(input, output, {
      runMode,
      markdownTemplateEngine: false,
      config: (config) => {
        config.addTemplateFormats('css');
        // XXX
        // make sure that CSS files are in site root, except core and ipseity that get built separately
        // move a number of things to core?
        config.addExtension('css', {
          outputFileExtension: 'css',
          compile: async function (inputContent) {
            const { css } = await processCSS(inputContent, { production: true });
            return async () => {
              return css;
            };
          }
        });
        // XXX is this correct and do we need more? maybe from config?
        config.addPassthroughCopy({ static: '/' });
        // config.setUseGitIgnore(false); // don't know if we'll need this
        config.ignores.add('README.md');
        config.setLibrary('md', {
          disable: () => {},
          render: processMD,
        });
      },
    });
  }
  async run () {
    await this.elev.write();
  }
}

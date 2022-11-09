

module.exports = function (config) {
  config.addPassthroughCopy({ static: '/' });

  // XXX
  // - need to expose mtime as a variable to the templating
  //  const { mtime } = await stat(input);
  //

  // with some help from eleventy-plugin-unified
  config.setLibrary('md', {
    disable: () => {},
    render: async (content, pageContext) => {
      const { processMD } = await import('./lib/process.js');
      return processMD(content, pageContext);
    },
  });
  return {
    markdownTemplateEngine: false,
    dir: {
      input: 'specs',
      output: 'public',
    },
  };
}


// {
//   editors: [ { 'Robin Berjon': [Object] } ],
//   page: {
//     date: 2022-11-08T20:34:51.171Z,
//     inputPath: './specs/meta/spec-for-specs.md',
//     fileSlug: 'spec-for-specs',
//     filePathStem: '/meta/spec-for-specs',
//     outputFileExtension: 'html',
//     url: '/meta/spec-for-specs/',
//     outputPath: 'public/meta/spec-for-specs/index.html'
//   },
//   collections: { all: [ [Object] ] }
// }

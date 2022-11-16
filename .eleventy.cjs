

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

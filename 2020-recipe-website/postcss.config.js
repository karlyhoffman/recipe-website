module.exports = ctx => {
  const plugins = {
    autoprefixer: {
      ...ctx.options.autoprefixer,
      flexbox: 'no-2009'
    },
    'postcss-nested': {}
  };

  return { plugins };
};
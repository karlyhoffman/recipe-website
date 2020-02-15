/* eslint-disable global-require */
/* eslint-disable no-param-reassign */
module.exports = {
  webpack: (config, { defaultLoaders }) => {
    const originalEntry = config.entry;
    config.entry = async () => {
      const entries = await originalEntry();
      if (
        entries['main.js'] &&
        !entries['main.js'].includes('./polyfills.js')
      ) {
        entries['main.js'].unshift('./polyfills.js');
      }
      return entries;
    };

    config.module.rules.push({
      test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
      use: {
        loader: 'url-loader',
        options: {
          limit: 100000
        }
      }
    });

    config.module.rules.push({
      test: /\.scss$/,
      use: [
        defaultLoaders.babel,
        {
          loader: require('styled-jsx/webpack').loader,
          options: {
            type: 'scoped'
          }
        },
        'sass-loader',
        {
          loader: 'sass-resources-loader',
          options: {
            resources: [
              './styles/vendor/bootstrap/bootstrap-grid.scss',
              './styles/global/variables.scss',
              './styles/global/fonts.scss'
            ]
          }
        }
      ]
    });

    return config;
  }
};

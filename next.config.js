/* eslint-disable global-require */
/* eslint-disable no-param-reassign */
const withSass = require('@zeit/next-sass');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.build' });

module.exports = withSass({
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
  },
  env: {
    PRISMIC_REPOSITORY_NAME: process.env.PRISMIC_REPOSITORY_NAME,
    PRISMIC_API_URL: process.env.PRISMIC_API_URL,
    PRISMIC_ACCESS_TOKEN: process.env.PRISMIC_ACCESS_TOKEN
  }
});

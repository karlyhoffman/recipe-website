const path = require('path');

module.exports = {
  env: {
    PRISMIC_REPOSITORY_NAME: process.env.PRISMIC_REPOSITORY_NAME,
    PRISMIC_API_URL: process.env.PRISMIC_API_URL,
    PRISMIC_ACCESS_TOKEN: process.env.PRISMIC_ACCESS_TOKEN,
    GOOGLE_TAG_ID: process.env.GOOGLE_TAG_ID,
    GOOGLE_TAG_MANAGER_ID: process.env.GOOGLE_TAG_MANAGER_ID,
  },
  webpack(config, { defaultLoaders }) {
    config.module.rules.push(
      {
        test: /\.(png|jpg|gif|svg|eot|otf|ttf|woff|woff2)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 100000,
          },
        },
      },
      // {
      //   test: /\.module\.(sa|sc|c)ss$/,
      //   use: [
      //     {
      //       loader: 'sass-resources-loader',
      //       options: {
      //         resources: [
      //           path.join(__dirname, 'styles/variables/breakpoints.scss'),
      //           path.join(__dirname, 'styles/variables/colors.scss'),
      //           path.join(__dirname, 'styles/variables/fonts.scss'),
      //           path.join(__dirname, 'styles/variables/layout.scss'),
      //           path.join(__dirname, 'styles/variables/misc.scss'),
      //           path.join(__dirname, 'styles/variables/mixins.scss'),
      //         ],
      //       },
      //     },
      //   ],
      // }
    );

    return config;
  },
};

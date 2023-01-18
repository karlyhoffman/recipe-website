const path = require('path');

module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.prismic.io',
        port: '',
        pathname: '/5047cooking/**',
      },
    ],
  },
  webpack(config, { defaultLoaders }) {
    config.module.rules.push(
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 100000,
          },
        },
      },
      {
        test: /\.module\.(sa|sc|c)ss$/,
        use: [
          {
            loader: 'sass-resources-loader',
            options: {
              resources: [
                path.join(__dirname, 'styles/variables/breakpoints.scss'),
                path.join(__dirname, 'styles/variables/colors.scss'),
                path.join(__dirname, 'styles/variables/fonts.scss'),
                path.join(__dirname, 'styles/variables/layout.scss'),
                path.join(__dirname, 'styles/variables/misc.scss'),
              ],
            },
          },
        ],
      }
    );

    return config;
  },
};

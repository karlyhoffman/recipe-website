const withCSS = require("@zeit/next-css");

module.exports = withCSS({
  target: "serverless",
  webpack(config, { defaultLoaders }) {

    /** Uncomment if polyfills are needed */
    // const originalEntry = config.entry;
    // config.entry = async () => {
    //   const entries = await originalEntry();
    //   if (
    //     entries["main.js"] &&
    //     !entries["main.js"].includes("./polyfills.js")
    //   ) {
    //     entries["main.js"].unshift("./polyfills.js");
    //   }
    //   return entries;
    // };
    /***/

    config.module.rules.push({
      test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
      use: {
        loader: "url-loader",
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
          loader: require("styled-jsx/webpack").loader,
          options: {
            type: "scoped"
          }
        },
        "sass-loader"
      ]
    });

    return config;
  }
});

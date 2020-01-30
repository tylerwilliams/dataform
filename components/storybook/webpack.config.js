const path = require("path");

module.exports = ({ config }) => {
  config.resolve.alias["dfco"] = path.resolve(__dirname, "../../");
  // Remove existing loader rules and add custom ones.
  config.module.rules = [];
  config.module.rules.push(
    {
      test: /\.jsx$/,
      loader: "babel-loader",
      options: {
        presets: ["@babel/preset-react"]
      }
    },
    {
      test: /\.css$/,
      exclude: /node_modules/,
      use: [
        { loader: "style-loader" },
        {
          loader: "css-loader",
          query: {
            modules: true
          }
        }
      ]
    },
    {
      // For Bazel generated code.
      test: /\.jsx?$/,
      exclude: /node_modules/,
      use: [{ loader: "umd-compat-loader" }]
    },
    {
      test: /stories\/.*\.[tj]sx?$/,
      loader: require.resolve("@storybook/source-loader"),
      exclude: [/node_modules/],
      enforce: "pre"
    }
  );

  return config;
};

const path = require("path");
const webpack = require("webpack");
const fs = require("fs");

// Notable things:
// - We don't set the output, must be set on the command line
// - We have seperate CSS loaders for our code and modules
// - We user require.resolve so that webpack can find these modules in a Bazel context
// - The tsconfig paths plugin fixes file resolution in a bazel context (dfco/)

module.exports = (env, argv) => {
  const config = {
    mode: argv.mode || "development",
    entry: [path.resolve(process.env.RUNFILES, "df/server/client/index")],
    output: {
      path: path.dirname(path.resolve(argv.output)),
      filename: path.basename(argv.output)
    },
    optimization: {
      minimize: argv.mode === "production"
    },
    watchOptions: {
      ignored: [/node_modules/]
    },
    stats: {
      warnings: true
    },
    node: {
      fs: "empty",
      child_process: "empty"
    },
    devServer: {
      port: 8080,
      open: false,
      publicPath: "/",
      contentBase: path.resolve("./server/client"),
      stats: {
        colors: true
      }
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json", ".css"],
      alias: {
        "@dataform": path.resolve(process.env.RUNFILES, "df"),
        df: path.resolve(process.env.RUNFILES, "df")
      }
    },

    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({
        // Unfortunately chunking is having some issues. I think we can live with a big chunk for now.
        maxChunks: 1
      })
    ],
    module: {
      rules: [
        {
          test: /\.css$/,
          include: /node_modules/,
          use: ["style-loader", "css-loader"]
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
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: [{ loader: "umd-compat-loader" }]
        }
      ]
    }
  };
  // Only add the babel transpilation in production mode.
  if (argv.mode === "production") {
    config.module.rules.push({
      test: /\.jsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "babel-loader",
          options: {
            presets: [["env", { targets: { browsers: ["defaults"] } }]],
            plugins: [
              [
                "transform-runtime",
                {
                  polyfill: false,
                  regenerator: true
                }
              ]
            ]
          }
        }
      ]
    });
  }
  return config;
};

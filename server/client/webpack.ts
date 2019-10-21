import { BazelResolverPlugin, IBazelWebpackConfiguration, run } from "df/tools/webpack";
import * as path from "path";
import * as webpack from "webpack";

// Notable things:
// - We don't set the output, must be set on the command line
// - We have seperate CSS loaders for our code and modules
// - We user require.resolve so that webpack can find these modules in a Bazel context
// - The tsconfig paths plugin fixes file resolution in a bazel context (dfco/)

run(options => {
  const config: IBazelWebpackConfiguration = {
    mode: options.mode,
    entry: [options.entry],
    output: {
      path: path.dirname(path.resolve(options.output)),
      filename: path.basename(options.output)
    },
    optimization: {
      minimize: options.mode === "production"
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
      plugins: [new BazelResolverPlugin()]
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
          use: [require.resolve("style-loader"), require.resolve("css-loader")]
        },
        {
          test: /\.css$/,
          exclude: /node_modules/,
          use: [
            { loader: require.resolve("style-loader") },
            {
              loader: require.resolve("css-loader"),
              query: {
                modules: true,
                namedExport: true,
                localIdentName: "[name]__[local]___[hash:base64:5]"
              }
            }
          ]
        },
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: [{ loader: require.resolve("umd-compat-loader") }]
        }
      ]
    }
  };
  // Only add the babel transpilation in production mode.
  if (options.mode === "production") {
    config.module.rules.push({
      test: /\.jsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve("babel-loader"),
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
});

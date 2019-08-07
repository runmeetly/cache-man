/* global __dirname, require, process */

const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const path = require("path");

const libraryName = "cache-man";
const mode = process.env.NODE_ENV;
const plugins = [];
let outputFile;

if (mode === "production") {
  plugins.push(
    new UglifyJsPlugin({
      test: /\.js($|\?)/i,
      cache: true,
      parallel: true,
      sourceMap: true,
      uglifyOptions: {
        mangle: true,
        compress: true
      }
    })
  );
  outputFile = libraryName + ".min.js";
} else {
  outputFile = libraryName + ".js";
}

const config = {
  mode: mode || "none",
  entry: "./src/CacheMan.js",
  devtool: "source-map",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: outputFile,
    library: "CacheMan",
    libraryTarget: "umd",
    umdNamedDefine: true,
    globalObject: `typeof self !== 'undefined' ? self : this`
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: ["@babel/plugin-proposal-class-properties"]
          }
        }
      }
    ]
  },
  resolve: {
    modules: [path.resolve("./node_modules"), path.resolve("./src")],
    extensions: [".js"]
  },
  plugins: plugins,
  externals: {
    promise: {
      commonjs: "promise",
      commonjs2: "promise",
      amd: "promise",
      root: "Promise"
    }
  }
};

module.exports = config;

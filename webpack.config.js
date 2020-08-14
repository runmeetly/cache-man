/*
 *  Copyright 2019 Meetly Inc.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

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
  entry: "./src/index.js",
  devtool: "source-map",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: outputFile,
    library: libraryName,
    libraryTarget: "umd",
    umdNamedDefine: true
  },
  module: {
    rules: [
      // Disable require.ensure as it's not a standard language feature.
      { parser: { requireEnsure: false } },

      // First, run the linter.
      // It's important to do this before Babel processes the JS.
      {
        test: /\.js$/,
        exclude: /(node_modules|build|devel)/,
        enforce: "pre",
        use: [
          {
            options: {
              cache: true,
              eslintPath: require.resolve("eslint"),
            },
            loader: require.resolve("eslint-loader"),
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /(build|devel)/,
        enforce: "pre",
        loader: "source-map-loader",
      },
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
  plugins,
};

module.exports = config;

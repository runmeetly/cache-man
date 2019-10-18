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

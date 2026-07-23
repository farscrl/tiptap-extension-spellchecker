const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    hunspell: './src/hunspell/main.ts',
    local: './src/local/main.ts'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  externals: {
    // @farscrl/hunspell-wasm's compiled wasm glue guards a `require("node:module")`
    // call behind a Node-only runtime check; it's never reached in the browser bundle,
    // but webpack still needs telling not to try to resolve/bundle it.
    'node:module': 'commonjs node:module'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'public/index.html'
    }),
    new HtmlWebpackPlugin({
      filename: 'local.html',
      template: 'public/local.html',
      chunks: ['local']
    }),
    new HtmlWebpackPlugin({
      filename: 'hunspell.html',
      template: 'public/hunspell.html',
      chunks: ['hunspell']
    })
  ],
  devServer: {
    static: path.join(__dirname, 'dist'),
    compress: true,
    port: 9001,
    open: true
  }
};

const path = require('path')
const toml = require('toml')
const webpack = require('webpack')
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
const nodeExternals = require('webpack-node-externals')

module.exports = {
  mode: 'development',
  target: 'node',
  entry: {
    app: './server/app.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.toml$/i,
        type: 'json',
        parser: {
          parse: toml.parse,
        },
      }
    ],
  },
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
      async_hooks: false,
      fs: false,
      net: false,
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    }),
    new NodePolyfillPlugin()
  ]
}
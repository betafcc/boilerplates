const {join, parse} = require('path');
const {readdirSync, lstatSync} = require('fs');
const camelCase = require('lodash.camelcase');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');


const package = require('./package.json');
const {NODE_ENV='production', PORT=3000} = process.env;


const hasIndex = path =>
  readdirSync(path)
    .some(n => parse(n).name === 'index');

const discoverComponents = basePath => {
  const ls = readdirSync(basePath)
    .map(n => [parse(n).name, join(basePath, n)]);

  const simpleFiles = ls
    .filter(([n, path]) => lstatSync(path).isFile())
    .filter(([n, path]) => base.resolve.extensions.includes(parse(path).ext));

  const indexFromFolders = ls
    .filter(([n, path]) => lstatSync(path).isDirectory())
    .filter(([n, path]) => hasIndex(path))
    .map(([n, path]) => [n, join(path, 'index')]);

  return simpleFiles
    .concat(indexFromFolders)
    .reduce((acc, [name, path]) => (acc[name] = path, acc)
    , {});
};


const base = {
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    library: [camelCase(package.name), '[name]'],
    libraryTarget: 'umd',
    path: join(__dirname, parse(package.main).dir),
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
        include: readdirSync(__dirname)
          .filter(n => n !== 'node_modules')
          .map(n => join(__dirname, n))
          .filter(n => lstatSync(n).isDirectory())
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        use: 'file-loader'
      },
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(NODE_ENV)
      }
    })
  ]

};


const env = {
  production: {
    entry: discoverComponents(join(__dirname, 'src', 'components')),

    externals: Object.keys(package.dependencies),

    module: {
      rules: [
        ...base.module.rules,
        {
          test: /\.css$/,
          use: ExtractTextWebpackPlugin.extract({
            fallback: 'style-loader',
            use: [
              { loader: 'css-loader', options: {importLoaders: 1, minimize: true } },
              'postcss-loader'
            ]
          })
        }
      ]
    },

    plugins: [
      ...base.plugins,

      new webpack.optimize.CommonsChunkPlugin({
        name: ['commons', 'bootstrap']
      }),

      new ExtractTextWebpackPlugin({
        filename: '[name].css',
        allChunks: true,
      }),

      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new webpack.optimize.UglifyJsPlugin(),
    ]
  },

  development: {
    entry: join(__dirname, 'example', 'index'),

    module: {
      rules: [
        ...base.module.rules,
        {
          test: /\.css$/,
          use: [
            'style-loader',
            { loader: 'css-loader', options: { importLoaders: 1} },
            'postcss-loader'
          ]
        }
      ]
    },

    plugins: [
      ...base.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NamedModulesPlugin(),
      new HtmlWebpackPlugin({
        template: join(__dirname, 'example', 'index.html'),
        filename: 'index.html',
        inject: 'body'
      })
    ],

    devtool: 'source-map',

    devServer: {
      hot: true,
      inline: true,
      historyApiFallback: true,
      port: PORT,
      publicPath: '/',
      contentBase: join(__dirname, 'example'),
      stats: {
        colors: true
      }
    },
  }
};


module.exports = Object.assign(base, env[NODE_ENV]);

const {join, parse} = require('path');
const {readdirSync, lstatSync} = require('fs');
const camelCase = require('lodash.camelcase');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');

const package = require('./package.json');
const {PORT=3000, NODE_ENV='production'} = process.env;



const getEntries = basePath =>
  discoverComponents(basePath)
    .reduce((acc, [name, path]) =>
      (acc[name] = path, acc)
    , {});

const discoverComponents = basePath =>
  [
    ...discoverFileComponents(basePath),
    ...discoverFolderComponents(basePath)
  ];

const discoverFileComponents = basePath =>
  readdirSync(basePath)
    .map(n => [parse(n).name, join(basePath, n)])
    .filter(([_, path]) => lstatSync(path).isFile())
    .filter(([_, path]) => base.resolve.extensions.includes(parse(path).ext));

const discoverFolderComponents = basePath =>
  readdirSync(basePath)
    .map(n => [n, join(basePath, n)])
    .filter(([name, path]) => lstatSync(path).isDirectory())
    .filter(([name, path]) => hasIndex(path))
    .map(([name, path]) => [name, join(path, 'index')]);

const hasIndex = path =>
  readdirSync(path)
    .map(n => parse(n))
    .some(({name, ext}) =>
      name === 'index'
      && base.resolve.extensions.includes(ext)
    );


const base = {
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    library: [camelCase(package.name), '[name]'],
    libraryTarget: 'umd',
    path: join(__dirname, parse(package.main).dir),
    publicPath: '/',
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
      }
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
    entry: getEntries(join(__dirname, 'src', 'components')),

    externals: Object.keys(package.dependencies),

    module: {
      rules: [
        ...base.module.rules,
        {
          test: /\.css$/,
          use: ExtractTextWebpackPlugin.extract({
            fallback: 'style-loader',
            use: [
              { loader: 'css-loader', options: {importLoaders: 1, minimize: true} },
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
            { loader: 'css-loader', options: { importLoaders: 1 }},
            'postcss-loader'
          ]
        }
      ]
    },

    plugins: [
      ...base.plugins,

      new HtmlWebpackPlugin({
        template: join(__dirname, 'example', 'index.html'),
        filename: 'index.html',
        inject: 'body',
      }),

      new webpack.HotModuleReplacementPlugin(),
      new webpack.NamedModulesPlugin(),
    ],

    devtool: 'source-map',

    devServer: {
      hot: true,
      inline: true,
      historyApiFallback: true,
      port: 3000,
      publicPath: '/',
      contentBase: join(__dirname, 'example'),
      stats: {
        colors: true,
      }
    }
  }

};


module.exports = Object.assign({}, base, env[NODE_ENV]);

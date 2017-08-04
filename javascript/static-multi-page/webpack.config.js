const {join, parse} = require('path');
const {readdirSync, lstatSync} = require('fs');
const camelCase = require('lodash.camelcase');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');

const package = require('./package.json');
const {NODE_ENV='production', PORT=3000} = process.env;


const paths = {};
paths.src      = join(__dirname, 'src');
paths.dist     = join(__dirname, 'dist');
paths.public   = join(__dirname, 'public');
paths.template = join(paths.src, 'template.ejs');
paths.entries  = readdirSync(join(paths.src, 'entries'))
  .map(n => join(paths.src, 'entries', n));


const base = {
  entry: paths.entries
    .reduce((acc, n) => (acc[parse(n).name] = n, acc), {
      vendor: Object.keys(package.dependencies)
    }),
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[name]-[chunkHash].js',
    library: [camelCase(package.name), '[name]'],
    libraryTarget: 'umd',
    path: paths.dist,
    publicPath: '/',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        use: 'babel-loader',
        include: paths.src
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        use: 'file-loader'
      },
    ]
  }
};

base.plugins = [
  new webpack.optimize.CommonsChunkPlugin({
    name: ['commons', 'vendor', 'bootstrap']
  }),

  ...Object
    .entries(base.entry)
    .filter(([name, _]) => name !== 'vendor')
    .map(([name, _]) => 
      new HtmlWebpackPlugin({
        title: name,
        filename: `${name}.html`,
        template: paths.template,
        inject: 'body',
        chunks: ['bootstrap', 'vendor', 'commons', name],
        minify: (NODE_ENV === 'production')
          ? {
            collapseWhitespace: true,
            removeComments: true,
            preserveLineBreaks: false,
          }
          : undefined,
      })
    ),

  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(NODE_ENV)
    }
  })
];


const env = {
  production: {
    module: {
      rules: [
        ...base.module.rules,
        {
          test: /\.css$/,
          use: ExtractTextWebpackPlugin.extract({
            fallback: 'style-loader',
            use: [
              { loader: 'css-loader', options: { importLoaders: 1, minimize: true } },
              'postcss-loader'
            ]
          })
        }
      ]
    },

    plugins: [
      ...base.plugins,
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
    module: {
      rules: [
        ...base.module.rules,
        {
          test: /\.css$/,
          use: [
            'style-loader',
            { loader: 'css-loader', options: { importLoaders: 1 } },
            'postcss-loader'
          ]
        }
      ]
    },

    plugins: [
      ...base.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NamedModulesPlugin(),
    ],

    devtool: 'source-map',

    devServer: {
      hot: true,
      inline: true,
      historyApiFallback: true,
      port: PORT,
      publicPath: base.output.publicPath,
      contentBase: paths.public,
      stats: {
        colors: true
      }
    }
  },
};


module.exports = Object.assign(base, env[NODE_ENV]);

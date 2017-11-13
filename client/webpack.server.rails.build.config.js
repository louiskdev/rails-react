// Common webpack configuration for server bundle

const webpack = require('webpack');
const path = require('path');

const devBuild = process.env.NODE_ENV !== 'production';
const nodeEnv = devBuild ? 'development' : 'production';

module.exports = {

  // the project dir
  context: __dirname,
  entry: [
    'babel-polyfill',
    './app/src/startup/serverRegistration',
  ],
  output: {
    filename: 'server-bundle.js',
    path: '../public/assets',
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
    alias: {
      '@common': path.join(__dirname, './app/src/app/Common'),
      '@config': path.join(__dirname, './app/src/config'),
      '@store': path.join(__dirname, './app/src/store'),
      '@components': path.join(__dirname, './app/src/resources/components'),
      '@layouts': path.join(__dirname, './app/src/resources/layouts'),
      '@utils': path.join(__dirname, './app/src/utils'),
      '@dashboard': path.join(__dirname, './app/src/app/Dashboard'),
      '@userprofile': path.join(__dirname, './app/src/app/UserProfile'),
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(nodeEnv),
      },
    }),
  ],
  module: {
    rules: [
      { test: /\.jsx?$/, loader: 'babel-loader', exclude: /node_modules/ },
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        include: [
          /node_modules\/acorn\-jsx/,
          /node_modules\/acorn/,
          /node_modules\/apollo\-client/,
          /node_modules\/Qarticles/,
        ],
        query: {
          presets: [
            'babel-preset-react',
            'babel-preset-stage-0',
            'babel-preset-es2015',
          ].map(require.resolve),
        },
      },
      {
        test: /(\.scss|\.css)$/,
        use: [
          'style-loader',
          'css-loader?modules',
        ],
        include: /flexboxgrid/,
      },
    ],
  },

};

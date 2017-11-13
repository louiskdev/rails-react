// Run like this:
// cd client && npm run build:client
// Note that Foreman (Procfile.dev) has also been configured to take care of this.

const webpack = require('webpack');

const config = require('./webpack.client.base.config');

// See use of 'vendor' in the CommonsChunkPlugin inclusion below.
config.entry.vendor = [
  'babel-polyfill',
];

config.output = {
  filename: '[name]-bundle.js',
  path: '../public/assets',
};

// See webpack.common.config for adding modules common to both the webpack dev server and rails
config.module.rules.push(
  {
    test: /\.jsx?$/,
    loader: 'babel-loader',
    exclude: /node_modules/,
  },
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
    test: require.resolve('react'),
    loader: 'imports-loader?shim=es5-shim/es5-shim&sham=es5-shim/es5-sham',
  },
  {
    test: /(\.scss|\.css)$/,
    use: [
      'style-loader',
      'css-loader?modules',
    ],
    include: /flexboxgrid/,
  },
  {
    test: /(\.scss|\.css)$/,
    use: [
      'style-loader',
      'css-loader?importLoaders=1',
    ],
    include: /cropper/,
  }
);

config.plugins.push(
  // https://webpack.github.io/docs/list-of-plugins.html#2-explicit-vendor-chunk
  new webpack.optimize.CommonsChunkPlugin({

    // This name 'vendor' ties into the entry definition
    name: 'vendor',

    // We don't want the default vendor.js name
    filename: 'vendor-bundle.js',

    // Passing Infinity just creates the commons chunk, but moves no modules into it.
    // In other words, we only put what's in the vendor entry definition in vendor-bundle.js
    minChunks: Infinity,
  }),
  new webpack.DefinePlugin({
    // A common mistake is not stringifying the "production" string.
    'process.env.NODE_ENV': JSON.stringify('production'),
  }),
  new webpack.optimize.UglifyJsPlugin()
);

console.log('Webpack client production build for Rails'); // eslint-disable-line no-console

module.exports = config;

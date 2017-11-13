// Run with Rails server like this:
// rails s
// cd client && babel-node server-rails-hot.js
// Note that Foreman (Procfile.dev) has also been configured to take care of this.

const path = require('path');
const webpack = require('webpack');

const config = require('./webpack.client.base.config');

const hotRailsPort = process.env.HOT_RAILS_PORT || 3500;

config.entry.app.push(
  `webpack-dev-server/client?http://localhost:${hotRailsPort}`,
  'webpack/hot/only-dev-server'
);

config.output = {
  filename: '[name]-bundle.js',
  path: path.join(__dirname, 'public'),
  publicPath: `http://localhost:${hotRailsPort}/`,
};

config.module.rules.push(
  {
    test: /\.jsx?$/,
    loader: 'babel-loader',
    exclude: /node_modules/,
    query: {
      plugins: [
        [
          'react-transform',
          {
            superClasses: ['React.Component', 'BaseComponent', 'Component'],
            transforms: [
              {
                transform: 'react-transform-hmr',
                imports: ['react'],
                locals: ['module'],
              },
            ],
          },
        ],
      ],
    },
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
    minChunks: ({ userRequest }) => (
      userRequest &&
      userRequest.indexOf('node_modules') >= 0 &&
      userRequest.match(/\.js$/)
    ),
  }),
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoEmitOnErrorsPlugin()
);

config.devtool = 'eval';

console.log('Webpack HOT dev build for Rails'); // eslint-disable-line no-console

module.exports = config;

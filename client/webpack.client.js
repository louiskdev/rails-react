const path = require('path');

module.exports = {
  entry: [
    'babel-polyfill',
    'src/startup/clientRegistration',
  ],
  output: {
    path: '../app/assets/webpack',
    filename: 'client.js',
    devtoolModuleFilenameTemplate: '[resourcePath]',
    devtoolFallbackModuleFilenameTemplate: '[resourcePath]?[hash]',
  },
  resolve: {
    modules: [
      path.join(__dirname, 'app'),
    ],
    extensions: ['*', '.js', '.jsx'],
    fallback: [path.join(__dirname, 'node_modules')],
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },

  // same issue, for loaders like babel
  resolveLoader: {
    fallback: [path.join(__dirname, 'node_modules')],
  },
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
      { test: require.resolve('jquery'), loader: 'expose-loader?jQuery' },
      { test: require.resolve('jquery'), loader: 'expose-loader?$' },
    ],
  },
};

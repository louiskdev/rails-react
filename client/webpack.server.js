const path = require('path');

module.exports = {
  entry: [
    'babel-polyfill',
    'src/startup/serverRegistration',
  ],
  output: {
    path: '../app/assets/webpack',
    filename: 'server.js',
  },
  resolve: {
    modules: [
      path.join(__dirname, 'app'),
    ],
    extensions: ['', '.js', '.jsx'],
    fallback: [path.join(__dirname, 'node_modules')],
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
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
    ],
  },
};

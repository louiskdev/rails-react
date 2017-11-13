// Common client-side webpack configuration used by webpack.hot.config and webpack.rails.config.

const webpack = require('webpack');
const path = require('path');

const devBuild = process.env.NODE_ENV !== 'production';
const nodeEnv = devBuild ? 'development' : 'production';

module.exports = {

  // the project dir
  context: __dirname,
  entry: {
    // This will contain the app entry points defined by webpack.hot.config and webpack.rails.config
    app: [
      './app/src/startup/clientRegistration',
    ],
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
    alias: {
      '@common': path.join(__dirname, './app/src/app/Common'),
      '@config': path.join(__dirname, './app/src/config'),
      '@store': path.join(__dirname, './app/src/store'),
      '@components': path.join(__dirname, './app/src/resources/components'),
      '@layouts': path.join(__dirname, './app/src/resources/layouts'),
      '@utils': path.join(__dirname, './app/src/utils'),
      '@dashboard': path.join(__dirname, './app/src/app/Dashboard'),
      '@userprofile': path.join(__dirname, './app/src/app/UserProfile'),
      '@admin': path.join(__dirname, './app/src/app/Admin'),
    },
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(nodeEnv),
      },
      TRACE_TURBOLINKS: devBuild,
    }),
  ],
  module: {
    rules: [
      { test: /\.(woff2?|svg)$/, loader: 'url-loader?limit=10000' },
      { test: /\.(ttf|eot)$/, loader: 'file-loader' },
      { test: /\.(jpe?g|png|gif|svg|ico)$/, loader: 'url-loader?limit=10000' },

      { test: require.resolve('jquery'), loader: 'expose-loader?jQuery' },
      { test: require.resolve('jquery'), loader: 'expose-loader?$' },

    ],
  },
};

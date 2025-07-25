const path = require('path');
const webpack = require('webpack');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Add fallbacks for Node.js modules
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          http: require.resolve('stream-http'),
          https: require.resolve('https-browserify'),
          stream: require.resolve('stream-browserify'),
          buffer: require.resolve('buffer/'),
          crypto: require.resolve('crypto-browserify'),
          os: require.resolve('os-browserify/browser'),
          path: require.resolve('path-browserify'),
          process: require.resolve('process/browser.js'),
          util: require.resolve('util/'),
          assert: require.resolve('assert/'),
          vm: require.resolve('vm-browserify'),
          fs: false,
          net: false,
          tls: false,
        },
      };
      console.log('webpackConfig.resolve.fallback:', webpackConfig.resolve.fallback);

      // Add plugins for global variables
      webpackConfig.plugins = [
        ...(webpackConfig.plugins || []),
        new webpack.ProvidePlugin({
          process: 'process/browser.js',
          Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        }),
      ];

      // Ignore specific warnings
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /Module not found: Can't resolve 'encoding'/,
      ];

      return webpackConfig;
    },
  },
};
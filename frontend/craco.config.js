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
          crypto: path.resolve(__dirname, 'src/polyfills/crypto-polyfill.js'),
          os: require.resolve('os-browserify/browser'),
          path: require.resolve('path-browserify'),
          process: require.resolve('process/browser.js'),
          util: path.resolve(__dirname, 'src/polyfills/util-polyfill.js'),
          assert: require.resolve('assert/'),
          vm: require.resolve('vm-browserify'),
          fs: path.resolve(__dirname, 'src/polyfills/fs-polyfill.js'),
          'fs/constants': path.resolve(__dirname, 'src/polyfills/constants-polyfill.js'),
          constants: path.resolve(__dirname, 'src/polyfills/constants-polyfill.js'),
          errno: path.resolve(__dirname, 'src/polyfills/errno-polyfill.js'),
          net: false,
          tls: false,
          readline: false,
          tty: false,
          child_process: false,
          'stream/promises': path.resolve(__dirname, 'src/polyfills/stream-promises-polyfill.js'),
          tmp: path.resolve(__dirname, 'src/polyfills/tmp-polyfill.js'),
          'tmp-promise': path.resolve(__dirname, 'src/polyfills/tmp-promise-polyfill.js'),
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
          'global': 'globalThis',
        }),
        new webpack.NormalModuleReplacementPlugin(
          /node:crypto/,
          path.resolve(__dirname, 'src/polyfills/crypto-polyfill.js')
        ),
        new webpack.NormalModuleReplacementPlugin(
          /node:os/,
          require.resolve('os-browserify/browser')
        ),
        new webpack.NormalModuleReplacementPlugin(
          /node:path/,
          require.resolve('path-browserify')
        ),
        new webpack.NormalModuleReplacementPlugin(
          /node:stream/,
          require.resolve('stream-browserify')
        ),
        new webpack.NormalModuleReplacementPlugin(
           /node:util/,
           path.resolve(__dirname, 'src/polyfills/util-polyfill.js')
         ),
        new webpack.NormalModuleReplacementPlugin(
          /^tmp$/,
          path.resolve(__dirname, 'src/polyfills/tmp-polyfill.js')
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^tmp-promise$/,
          path.resolve(__dirname, 'src/polyfills/tmp-promise-polyfill.js')
        ),
        new webpack.NormalModuleReplacementPlugin(
          /@irys\/bundles/,
          path.resolve(__dirname, 'src/polyfills/irys-bundles-polyfill.js')
        ),
      ];

      // Handle node: scheme imports
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'node:crypto': path.resolve(__dirname, 'src/polyfills/crypto-polyfill.js'),
        'node:stream': 'stream-browserify',
        'node:buffer': 'buffer',
        'node:util': path.resolve(__dirname, 'src/polyfills/util-polyfill.js'),
        'node:path': 'path-browserify',
        'node:os': 'os-browserify/browser',
        'node:process': 'process/browser.js',
        'stream/promises': path.resolve(__dirname, 'src/polyfills/stream-promises-polyfill.js'),
        'tmp': path.resolve(__dirname, 'src/polyfills/tmp-polyfill.js'),
        'tmp-promise': path.resolve(__dirname, 'src/polyfills/tmp-promise-polyfill.js'),
      };

      // Ignore specific warnings
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /Module not found: Can't resolve 'encoding'/,
        /Reading from "node:.*" is not handled by plugins/,
      ];

      return webpackConfig;
    },
  },
};
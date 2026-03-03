const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

const env = dotenv.config().parsed || {};

module.exports = {
  entry: './tsc-out/main.js',
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'main.js',
    libraryTarget: 'commonjs2',
  },
  target: 'electron-renderer',
  node: {
    __dirname: false,
    __filename: false,
  },
  // These modules are provided by Mailspring at runtime - do NOT bundle them.
  // Use 'commonjs2 X' format to ensure webpack generates real require() calls
  // (not webpack's internal __webpack_require__) for these externals.
  externals: {
    'react': 'commonjs2 react',
    'react-dom': 'commonjs2 react-dom',
    'electron': 'commonjs2 electron',
    'mailspring-exports': 'commonjs2 mailspring-exports',
    'mailspring-component-kit': 'commonjs2 mailspring-component-kit',
    'mailspring-store': 'commonjs2 mailspring-store',
    'mailspring-observables': 'commonjs2 mailspring-observables',
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID || ''),
      'process.env.GOOGLE_CLIENT_SECRET': JSON.stringify(env.GOOGLE_CLIENT_SECRET || ''),
    }),
    // Patch require() so that externals (react, electron, etc.) fall back
    // to Mailspring's app.asar/node_modules when normal resolution fails.
    // IMPORTANT: This is NOT wrapped in an IIFE so that the `require`
    // reassignment persists in the module scope for webpack's external modules.
    new webpack.BannerPlugin({
      banner: [
        'var __origRequire = require;',
        'var __path = __origRequire("path");',
        'var __appNM = __path.join(process.resourcesPath || "/app/share/mailspring/resources", "app.asar", "node_modules");',
        'require = function(id) {',
        '  try { return __origRequire(id); }',
        '  catch(e) {',
        '    if (typeof id === "string" && id[0] !== "." && id[0] !== "/") {',
        '      try { return __origRequire(__path.join(__appNM, id)); }',
        '      catch(e2) {}',
        '    }',
        '    throw e;',
        '  }',
        '};',
        'require.resolve = __origRequire.resolve;',
        'require.cache = __origRequire.cache;',
        'require.main = __origRequire.main;',
        'require.extensions = __origRequire.extensions;',
      ].join('\n'),
      raw: true,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        type: 'javascript/auto',
      },
    ],
  },
};

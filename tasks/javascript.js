/* eslint-disable no-console */

const gulp = require('gulp');
const md5 = require('md5');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');
const {addAsset, getManifest, getRevisionedAssetUrl} =
    require('./utils/assets');
const config = require('../config.json');


const buildCache = {};

const initPlugins = () => {
  return [
    // Identify each module by a hash, so caching is more predictable.
    new webpack.HashedModuleIdsPlugin(),

    // Create manifest of the original filenames to their hashed filenames.
    new ManifestPlugin({
      seed: getManifest(),
      fileName: config.manifestFileName,
      generate: (seed, files) => {
        return files.reduce((manifest, opts) => {
          // Needed until this issue is resolved:
          // https://github.com/danethurber/webpack-manifest-plugin/issues/159
          const unhashedName = path.basename(opts.path)
              .replace(/[_\.\-][0-9a-f]{10}/, '')

          addAsset(unhashedName, opts.path);
          return getManifest();
        }, seed);
      },
    }),

    // Allows minifiers to removed dev-only code.
    new webpack.DefinePlugin({
      'process.env.NODE_ENV':
          JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
  ];
};

const generateBabelEnvLoader = (targets) => {
  return {
    test: /\.m?js$/,
    use: {
      loader: 'babel-loader',
      options: {
        babelrc: false,
        presets: [
          ['@babel/env', {
            // debug: true,
            modules: false,
            useBuiltIns: 'entry',
            targets,
          }],
        ],
      },
    },
  };
};

const baseConfig = () => ({
  mode: process.env.NODE_ENV || 'development',
  plugins: initPlugins(),
  devtool: '#source-map',
  cache: buildCache,
});

const getMainConfig = () => Object.assign(baseConfig(), {
  entry: {
    'main': './assets/javascript/main.js',
  },
  output: {
    path: path.resolve(__dirname, '..', config.publicStaticDir),
    publicPath: '/',
    filename: '[name]-[chunkhash:10].mjs',
  },
  // TODO: removing this for now, as it adds to many unnecessary
  // polyfills, even with preset-env's `usage` options.
  // module: {
  //   rules: [
  //     generateBabelEnvLoader({
  //       browsers: [
  //         // The last two versions of each browser, excluding versions
  //         // that don't support <script type="module">.
  //         'last 2 Chrome versions', 'not Chrome < 60',
  //         'last 2 Safari versions', 'not Safari < 10.1',
  //         'last 2 iOS versions', 'not iOS < 10.3',
  //         'last 2 Firefox versions', 'not Firefox < 60',
  //         'last 2 Edge versions', 'not Edge < 15',
  //       ]
  //     }),
  //   ],
  // },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          name: (mod) => {
            const pkgName = mod.context.match(/node_modules\/([^\/]+)/)[1];
            return `vendor.${pkgName}`;
          },
        },
      },
    },
    minimizer: [new TerserPlugin({
      test: /\.m?js$/,
      sourceMap: true,
      terserOptions: {
        mangle: {
          properties: {
            regex: /(^_|_$)/,
          }
        },
        safari10: true,
      },
    })],
  },
});

const getLegacyConfig = () => Object.assign(baseConfig(), {
  entry: {
    'main': './assets/javascript/main-legacy.js',
  },
  output: {
    path: path.resolve(__dirname, '..', config.publicStaticDir),
    publicPath: '/',
    filename: '[name]-[chunkhash:10].es5.js',
  },
  module: {
    rules: [
      generateBabelEnvLoader({browsers: ['last 2 versions']}),
    ],
  },
  optimization: {
    minimizer: [new TerserPlugin({
      test: /\.m?js$/,
      sourceMap: true,
      terserOptions: {
        // Don't mangle properties in legacy config
        // because it breaks polyfills.
        mangle: true,
        safari10: true,
      },
    })],
  },
});

const getSwConfig = () => ({
  mode: process.env.NODE_ENV || 'development',
  entry: {
    'sw': './assets/sw.js',
  },
  output: {
    path: path.resolve(__dirname, '..', config.publicDir),
    filename: '[name].js',
  },
  cache: buildCache,
  devtool: '#source-map',
  plugins: [
    new webpack.DefinePlugin({
      MAIN_CSS_URL: JSON.stringify(getRevisionedAssetUrl('main.css')),
      MAIN_JS_URL: JSON.stringify(getRevisionedAssetUrl('main.mjs')),
      MAIN_RUNTIME_URL: JSON.stringify(getRevisionedAssetUrl('runtime.mjs')),

      // Hard code here until switching to workbox.
      VENDOR_AUTOTRACK_URL: JSON.stringify(
          getRevisionedAssetUrl('vendor.autotrack.mjs')),
      VENDOR_IDLIZE_URL: JSON.stringify(
          getRevisionedAssetUrl('vendor.idlize.mjs')),
      VENDOR_DOM_UTILS_URL: JSON.stringify(
          getRevisionedAssetUrl('vendor.dom-utils.mjs')),
    }),
  ],
  module: {
    rules: [
      generateBabelEnvLoader({
        browsers: [
          // Browsers that support service worker.
          'last 2 Chrome versions', 'not Chrome < 45',
          'last 2 Firefox versions', 'not Firefox < 44',
          'last 2 Edge versions', 'not Edge < 17',
          'last 2 Safari versions', 'not Safari < 11.1',
        ],
      }),
    ],
  },
  optimization: {
    minimizer: [new TerserPlugin({
      sourceMap: true,
      terserOptions: {
        // TODO(philipwalton): mangling properties in the service worker
        // breaks dependencies for some reason.
        // mangle: {
        //   properties: {
        //     regex: /(^_|_$)/,
        //   }
        // },
        mangle: true,
      },
    })],
  },
});

const createCompiler = (config) => {
  const compiler = webpack(config);
  return () => {
    return new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) return reject(err);
        console.log(stats.toString({
          colors: true,
          // Uncomment to see all bundled modules.
          // maxModules: Infinity,
        }));
        resolve();
      });
    });
  };
};

gulp.task('javascript', async () => {
  try {
    const compileMainBundle = createCompiler(getMainConfig());
    await compileMainBundle();

    const compileSwBundle = createCompiler(getSwConfig());
    await compileSwBundle();

    if (['debug', 'production'].includes(process.env.NODE_ENV)) {
      // Generate the main-legacy bundle.
      const compileLegacyBundle = createCompiler(getLegacyConfig());
      await compileLegacyBundle();
    }
  } catch (err) {
    console.error(err);
  }
});

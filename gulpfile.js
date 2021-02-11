const { src, dest, watch, series, parallel } = require('gulp');
const plugin = require('gulp-load-plugins')({
  rename: {
    'gulp-clean-css': 'cleanCSS',
    'gulp-group-css-media-queries': 'gcmq',
    'gulp-webp-html': 'webpHTML',
  },
});

const del = require('del');
const imagemin = require('gulp-imagemin');

const browserSync = require('browser-sync').create();

const webpack = require('webpack');
const stream = require('webpack-stream');

const dev = plugin.environments.development;
const prod = plugin.environments.production;

const onError = (err) => {
  plugin.notify.onError({
    title: `Error in ${err.plugin}`,
    message: '<%= error.message %>',
    sound: 'Pop',
    onLast: true,
  })(err);
  this.emit('end');
};

const path = {
  src: {
    root: 'src/',
    js: 'src/assets/js/',
    img: 'src/assets/images/',
    fonts: 'src/assets/fonts/',
    styles: 'src/assets/styles/',
    data: 'src/assets/data/',
  },
  dist: {
    root: 'dist/',
    assets: 'dist/assets/',
  },
};

/* ===============   webpackConfig  =============== */

const webpackConfig = {
  mode: dev() ? 'development' : 'production',
  output: {
    filename: `[name].js`,
  },
  devtool: dev() ? 'eval-source-map' : 'none',
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
    },
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }),
  ],
  resolve: {
    modules: ['node_modules'],
  },
};

/* ===================   serve  =================== */

function serve() {
  browserSync.init({
    server: path.dist.root,
    // tunnel: 'project', // Demonstration page: http://project.localtunnel.me
    // online: false, // Work Offline Without Internet Connection
  });
}

/* =====================  html  ==================== */

function html() {
  return src([`${path.src.root}*.html`, `!${path.src.root}_*.html`])
    .pipe(
      plugin.include({
        includePaths: [
          `${__dirname}/${path.src.root}`,
          `${__dirname}/${path.src.img}`,
          `${__dirname}/${path.src.img}*`,
        ],
      })
    )
    .pipe(plugin.webpHTML())
    .pipe(plugin.beautify.html({ indent_size: 2 }))
    .pipe(dest(path.dist.root))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
}

/* ===================  styles  =================== */

function styles() {
  return src(`${path.src.styles}*.+(scss|sass)`)
    .pipe(dev(plugin.sourcemaps.init()))
    .pipe(
      plugin.plumber({
        errorHandler: onError,
      })
    )
    .pipe(
      plugin.sass({
        outputStyle: 'expanded',
      })
    )
    .pipe(plugin.autoprefixer())
    .pipe(plugin.gcmq())
    .pipe(
      prod(
        plugin.cleanCSS(
          {
            level: 2,
            debug: true,
          },
          (details) => {
            console.log(`${details.name}: ${details.stats.originalSize}`);
            console.log(`${details.name}: ${details.stats.minifiedSize}`);
          }
        )
      )
    )
    .pipe(dev(plugin.sourcemaps.write('.')))
    .pipe(
      plugin.rename({
        suffix: '.min',
      })
    )
    .pipe(dest(`${path.dist.assets}css`))
    .pipe(browserSync.stream());
}

/* =====================  js  ===================== */
function js() {
  return src(`${path.src.js}main.js`)
    .pipe(
      plugin.plumber({
        errorHandler: onError,
      })
    )
    .pipe(stream(webpackConfig))
    .pipe(
      plugin.rename({
        suffix: '.min',
      })
    )
    .pipe(dest(`${path.dist.assets}js`))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
}

/* ===================  images  =================== */

function img() {
  return src(`${path.src.img}**/*.*`)
    .pipe(
      plugin.webp({
        quality: 90,
      })
    )
    .pipe(dest(`${path.dist.assets}images`))
    .pipe(src(`${path.src.img}**/*.*`))
    .pipe(
      plugin.cache(
        imagemin([
          imagemin.gifsicle({ interlaced: true }),
          imagemin.mozjpeg({ quality: 90, progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
          imagemin.svgo({
            plugins: [
              { removeViewBox: false },
              { cleanupIDs: false },
              { removeUnknownsAndDefaults: false },
            ],
          }),
        ])
      )
    )
    .pipe(dest(`${path.dist.assets}images`));
}

/* ===================  fontgen  ================== */

function fontgen() {
  return src(`${path.src.fonts}**/*.ttf`)
    .pipe(plugin.fontmin())
    .pipe(plugin.ttf2woff2())
    .pipe(dest(path.src.fonts));
}

/* ====================  fonts  =================== */

function fonts() {
  return src(`${path.src.fonts}**/*.{svg,eot,ttf,woff,woff2}`).pipe(
    dest(`${path.dist.assets}fonts`)
  );
}

/* =====================  data  =================== */

function data() {
  return src(`${path.src.data}**/*`).pipe(dest(`${path.dist.assets}data`));
}

/* ====================  watch  =================== */

function watchFiles() {
  watch(`${path.src.root}**/*.html`, html);
  watch(path.src.root, styles);
  watch(path.src.js, js);
  watch(path.src.img, img);
  watch(path.src.data, data);
}

/* ====================  clean  =================== */

function clean() {
  plugin.cache.clearAll();
  return del([path.dist.root, `${path.src.fonts}**/*.css`]).then((dir) => {
    console.log('Deleted files and folders:\n', dir.join('\n'));
  });
}

/* ===================  exports  ================== */

exports.html = html;
exports.styles = styles;
exports.js = js;
exports.img = img;
exports.fontgen = fontgen;
exports.fonts = fonts;
exports.data = data;
exports.clean = clean;
exports.watch = watchFiles;

/* ====================  dev  ===================== */

exports.default = series(
  clean,
  parallel(html, styles, js, img, fonts, data),
  parallel(watchFiles, serve)
);

/* ===================  build  ==================== */

exports.build = series(clean, parallel(html, styles, js, img, fonts, data));

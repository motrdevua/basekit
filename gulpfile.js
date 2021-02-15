const { src, dest, watch, series, parallel } = require('gulp');
const plugin = require('gulp-load-plugins')({
  rename: {
    'gulp-group-css-media-queries': 'gcmq',
    'gulp-webp-in-html': 'GulpWebpHtml2',
    'gulp-tinypng-extended': 'tinypng',
  },
});

const del = require('del');

const browserSync = require('browser-sync').create();

const webpack = require('webpack');
const stream = require('webpack-stream');

const dev = plugin.environments.development;
const prod = plugin.environments.production;
const fs = require('fs');

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
  app: {
    root: 'app/',
    assets: 'app/assets/',
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
    server: path.app.root,
    // tunnel: 'project', // Demonstration page: http://project.localtunnel.me
    // online: false, // Work Offline Without Internet Connection
  });
}

/* =====================  html  ==================== */

function html() {
  return (
    src([`${path.src.root}*.html`, `!${path.src.root}_*.html`])
      .pipe(
        plugin.include({
          includePaths: [
            `${__dirname}/${path.src.root}`,
            `${__dirname}/${path.src.img}`,
            `${__dirname}/${path.src.img}*`,
          ],
        })
      )
      // .pipe(plugin.GulpWebpHtml2())
      .pipe(dest(path.app.root))
      .pipe(
        browserSync.reload({
          stream: true,
        })
      )
  );
}

/* ===================  styles  =================== */

function styles() {
  return (
    src(`${path.src.styles}*.+(scss|sass)`)
      .pipe(dev(plugin.sourcemaps.init()))
      .pipe(plugin.plumber({ errorHandler: onError }))
      .pipe(plugin.sass.sync({ outputStyle: 'expanded' }))
      .pipe(plugin.autoprefixer())
      // .pipe(plugin.gcmq())
      .pipe(plugin.csso({ restructure: false }))
      .pipe(dev(plugin.sourcemaps.write('.')))
      .pipe(plugin.rename({ suffix: '.min' }))
      .pipe(dest(`${path.app.assets}css`))
      .pipe(browserSync.stream())
  );
}

/* =====================  js  ===================== */
function js() {
  return src(`${path.src.js}main.js`)
    .pipe(plugin.plumber({ errorHandler: onError }))
    .pipe(stream(webpackConfig))
    .pipe(plugin.rename({ suffix: '.min' }))
    .pipe(dest(`${path.app.assets}js`))
    .pipe(browserSync.reload({ stream: true }));
}

/* ===================  images  =================== */

function img() {
  return src(`${path.src.img}**/*.{png,jpg,jpeg}`)
    .pipe(plugin.plumber({ errorHandler: onError }))
    .pipe(plugin.webp({ quality: 100 }))
    .pipe(dest(`${path.app.assets}images`))
    .pipe(src(`${path.src.img}**/*.{png,jpg,jpeg}`))
    .pipe(
      prod(
        plugin.tinypng({
          key: 'JBK36rHvht6hyW3MM7jQYzbx53hgWF2R',
          sigFile: './src/assets/images/.tinypng-sigs',
          log: true,
        })
      )
    )
    .pipe(dest(`${path.app.assets}images`))
    .pipe(src(`${path.src.img}**/*.svg`))
    .pipe(dest(`${path.app.assets}images`));
}

/* ====================  fonts  =================== */

function fonts() {
  return src(`${path.src.fonts}**/*.ttf`)
    .pipe(plugin.ttf2woff())
    .pipe(dest(`${path.app.assets}fonts`))
    .pipe(src(`${path.src.fonts}**/*.ttf`))
    .pipe(plugin.ttf2woff2())
    .pipe(dest(`${path.app.assets}fonts`));
}

const cb = () => {};
const fontsStyleSheet = `${path.src.styles}utils/_fontstylesheet.scss`;
const fontsPath = `${path.app.assets}fonts`;

const fontsStyle = (done) => {
  fs.readFileSync(fontsStyleSheet);
  fs.writeFile(fontsStyleSheet, '', cb);
  fs.readdir(fontsPath, (err, items) => {
    if (items) {
      let cFontname;
      for (let i = 0; i < items.length; i += 1) {
        let fontname = items[i].split('.');
        [fontname] = fontname;
        if (cFontname !== fontname) {
          fs.appendFile(
            fontsStyleSheet,
            `@include font-face("./${fontsPath}${fontname}", "${fontname}", 400);\r\n`,
            cb
          );
        }
        cFontname = fontname;
      }
    }
  });

  done();
};

/* =====================  data  =================== */

function data() {
  return src(`${path.src.data}**/*`).pipe(dest(`${path.app.assets}data`));
}

/* ====================  watch  =================== */

function watchFiles() {
  watch(`${path.src.root}**/*.html`, html);
  watch(path.src.root, styles);
  watch(path.src.js, js);
  watch(path.src.img, img);
  watch(path.src.fonts, series(fonts, fontsStyle));
  watch(path.src.data, data);
}

/* ====================  clean  =================== */

function clean() {
  plugin.cache.clearAll();
  return del([path.app.root, `${path.src.img}/.tinypng-sigs`]).then((dir) => {
    console.log('Deleted files and folders:\n', dir.join('\n'));
  });
}

/* ===================  exports  ================== */

exports.html = html;
exports.styles = styles;
exports.js = js;
exports.img = img;
exports.fonts = fonts;
exports.fontsStyle = fontsStyle;
exports.data = data;
exports.clean = clean;
exports.watch = watchFiles;

/* ====================  dev  ===================== */

exports.default = series(
  clean,
  fonts,
  fontsStyle,
  parallel(html, styles, js, img, data),
  parallel(watchFiles, serve)
);

/* ===================  build  ==================== */

exports.build = series(
  clean,
  fonts,
  fontsStyle,
  parallel(html, styles, js, img, data)
);

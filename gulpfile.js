"use strict";
const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("autoprefixer");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const cssnano = require("cssnano");
const streamqueue = require("streamqueue");
const imagemin = require("gulp-imagemin");
const concat = require("gulp-concat");
const terser = require("gulp-terser");
const browserSync = require("browser-sync");
const removeCode = require("gulp-remove-code");
const inject = require("gulp-inject-string");

// --------------------------------------------------
// For dev
// --------------------------------------------------

gulp.task("sassTask", function () {
  return gulp
    .src("./src/assets/scss/all.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(concat("all.css"))
    .pipe(gulp.dest("./src/assets/scss"))
    .pipe(browserSync.stream());
});

gulp.task("serve-dev", function () {
  browserSync.init({
    server: "./src",
  });

  gulp.watch("./src/assets/css/**/*.css").on("change", browserSync.reload);

  gulp.watch("./src/assets/scss/**/*.scss", gulp.series("sassTask"));

  gulp.watch("./src/assets/js/**/*.js").on("change", browserSync.reload);

  gulp.watch("./src/*.html").on("change", browserSync.reload);
});

// --------------------------------------------------
// For build
// --------------------------------------------------

gulp.task("buildStyle", function () {
  var cssStream = gulp
    .src("./src/assets/css/**/*.css")
    .pipe(concat("css-files.css"));

  var scssStream = gulp
    .src("./src/assets/scss/all.css")
    .pipe(concat("scss-files.css"));

  var mergedStream = streamqueue({ objectMode: true }, cssStream, scssStream)
    .pipe(sourcemaps.init())
    .pipe(concat("style.css"))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist/assets/css"))
    .pipe(browserSync.stream());

  return mergedStream;
});

gulp.task("buildJs", function () {
  return gulp
    .src("./src/assets/js/**/*.js")
    .pipe(sourcemaps.init())
    .pipe(concat("all.js"))
    .pipe(terser())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist/assets/js"))
    .pipe(browserSync.stream());
});

gulp.task("imgTask", function () {
  return gulp
    .src(["./src/assets/img/**/*", "!./src/assets/img/**/*.gif"])
    .pipe(imagemin())
    .pipe(gulp.dest("dist/assets/img"))
    .pipe(browserSync.stream());
});

gulp.task("htmlTask", function () {
  return gulp
    .src("./src/index.html")
    .pipe(removeCode({ production: true }))
    .pipe(
      inject.before(
        "<title",
        '<link rel="stylesheet" href="./assets/css/style.css" />\n'
      )
    )
    .pipe(
      inject.before("</body", '<script src="./assets/js/all.js"></script>\n')
    )
    .pipe(gulp.dest("dist"))
    .pipe(browserSync.stream());
});

gulp.task("serve-build", function () {
  browserSync.init({
    server: "./dist",
    port: 5000,
  });
});

// --------------------------------------------------
// Commands
// --------------------------------------------------
gulp.task("start", gulp.series("sassTask", "serve-dev"));

gulp.task(
  "build",
  gulp.series("sassTask", gulp.parallel(["buildStyle", "buildJs", "imgTask", "htmlTask"]), "serve-build")
);

'use strict';

const testdir = "../..";
const refdir = "../../reference";

var browserSync = null;
var gulp = require("gulp");
var ejs = require("gulp-ejs");
var rename = require("gulp-rename");

gulp.task("default", [
  "snap-width",
]);

gulp.task("snap-width", function () {
  return generate({
    source: "snap-width.ejs",
    name: "snap-width-001",
  });
});

function generate(options) {
  options.isReference = options.isReference || false;
  options.destname = options.name + ".html";
  options.destdir = options.isReference ? refdir : testdir;
  return gulp.src(options.source)
    .pipe(ejs(options))
    .pipe(rename(options.destname))
    .pipe(gulp.dest(options.destdir))
    .on("end", function () {
      if (!options.isReference)
        return generate(extend(options, { isReference: true }));
    });
}

function extend(obj, props) {
  for (var p in props)
    if (props.hasOwnProperty(p))
      obj[p] = props[p];
  return obj;
}

gulp.task("test", ["browser-sync", "watch"]);

gulp.task("watch", function () {
  gulp.watch("snap-width.ejs", ["snap-width"]);
});

gulp.task("browser-sync", function () {
  if (!browserSync)
    browserSync = require("browser-sync");
  browserSync({
    server: {
      baseDir: "../../..",
      directory: true,
    },
    files: [testdir + "/*", refdir + "/*"],
    startPath: "css-snap-size-1/",
  });
});

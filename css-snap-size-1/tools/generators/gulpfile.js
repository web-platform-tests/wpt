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

var snapWidthFiles = [
  { name: "snap-width-block-available-001" },
  { name: "snap-width-block-fixed-001" },
  { name: "snap-width-block-max-001" },
  { name: "snap-width-001", isReference: true },
]

gulp.task("snap-width", function () {
  return generateFiles(snapWidthFiles);
});

function generateFiles(files) {
  return generateFile(files[0])
    .on("end", function () {
      if (files.length > 1)
        return generateFiles(files.slice(1));
    });
}

function generateFile(options) {
  options.isReference = options.isReference || false;
  options.destname = options.name + ".html";
  options.destdir = options.isReference ? refdir : testdir;
  return gulp.src("snap-width.ejs")
    .pipe(ejs(options))
    .pipe(rename(options.destname))
    .pipe(gulp.dest(options.destdir));
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

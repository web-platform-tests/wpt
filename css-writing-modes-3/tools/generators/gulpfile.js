var gulp = require("gulp");
var ejs = require("gulp-ejs");
var rename = require("gulp-rename");
var orientation = require("./text-orientation-generator.js");

gulp.task("orthogonal-parent-shrink-to-fit", function () {
    for (var i = -1; i < 24; ++i) {
        var affix = i < 0 ? "" : String.fromCharCode("a".charCodeAt(0) + i);
        gulp.src("orthogonal-parent-shrink-to-fit.ejs")
            .pipe(ejs({ index: i }))
            .pipe(rename("orthogonal-parent-shrink-to-fit-001" + affix + ".html"))
            .pipe(gulp.dest("../.."));
    }
});

gulp.task("text-orientation", function () {
    return orientation.generate();
});

gulp.task("default", [
    "orthogonal-parent-shrink-to-fit",
    "text-orientation"]);

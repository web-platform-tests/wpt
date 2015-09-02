var gulp = require("gulp");
var ejs = require("gulp-ejs");
var rename = require("gulp-rename");
var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));
var orientation = require("./text-orientation-generator.js");

gulp.task("default", [
    "orthogonal-parent-shrink-to-fit",
    "text-orientation"]);

gulp.task("watch", function () {
    gulp.watch("orthogonal-parent-shrink-to-fit.ejs", ["orthogonal-parent-shrink-to-fit"]);
    gulp.watch("text-orientation.ejs", ["text-orientation"]);
});

gulp.task("orthogonal-parent-shrink-to-fit", function () {
    generateWithAffixes("orthogonal-parent-shrink-to-fit", "-001", -1, 24);
});

gulp.task("text-orientation", function () {
    return orientation.generate(argv);
});

function generateWithAffixes(name, suffix, min, lim) {
    if (argv.nocombo && min < 0)
        min = 0;
    if (argv.nochild && lim > 0)
        lim = 0;
    gulp.task(name, function () {
        for (var i = min; i < lim; ++i) {
            gulp.src(name + ".ejs")
                .pipe(ejs({ index: i }))
                .pipe(rename(name + suffix + affixFromIndex(i) + ".html"))
                .pipe(gulp.dest("../.."));
        }
    });
}

function affixFromIndex(index) {
    if (index < 0)
        return "";
    if (index >= 26)
        throw new Error("Affix index too large (" + index + ")");
    return String.fromCharCode("a".charCodeAt(0) + index);
}

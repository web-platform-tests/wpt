var gulp = require("gulp");
var ejs = require("gulp-ejs");
var rename = require("gulp-rename");
var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));
var orientation = require("./text-orientation-generator.js");
console.log(argv);

var templates = [
    ["orthogonal-parent-shrink-to-fit", "orthogonal-parent-shrink-to-fit-001", -1, 24],
];

function affixFromIndex(index) {
    if (index < 0)
        return "";
    if (index >= 26)
        throw new Error("Affix index too large (" + index + ")");
    return String.fromCharCode("a".charCodeAt(0) + index);
}

for (var template of templates) {
    var name = template[0];
    var min = template[2];
    var lim = template[3];
    if (argv.nocombo && min < 0)
        min = 0;
    if (argv.nochild && lim > 0)
        lim = 0;
    gulp.task(name, function () {
        for (var i = min; i < lim; ++i) {
            var target = template[1] + affixFromIndex(i);
            gulp.src(name + ".ejs")
                .pipe(ejs({ index: i }))
                .pipe(rename(target + ".html"))
                .pipe(gulp.dest("../.."));
        }
    });
}

gulp.task("text-orientation", function () {
    return orientation.generate(argv);
});

gulp.task("default", [
    "orthogonal-parent-shrink-to-fit",
    "text-orientation"]);

gulp.task("watch", function () {
    for (var template of templates) {
        var name = template[0];
        gulp.watch(name  + ".ejs", [name]);
    }
});

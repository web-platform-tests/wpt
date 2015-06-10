var gulp = require("gulp");
var ejs = require("gulp-ejs");
var rename = require("gulp-rename");
var orientation = require("./text-orientation-generator.js");

var templates = [
    ["orthogonal-parent-shrink-to-fit", -1, 24],
];

for (var template of templates) {
    var name = template[0];
    gulp.task(name, function () {
        for (var i = template[1]; i < template[2]; ++i) {
            var affix = i < 0 ? "" : String.fromCharCode("a".charCodeAt(0) + i);
            gulp.src(name + ".ejs")
                .pipe(ejs({ index: i }))
                .pipe(rename(name + affix + ".html"))
                .pipe(gulp.dest("../.."));
        }
    });
}

gulp.task("text-orientation", function () {
    return orientation.generate();
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

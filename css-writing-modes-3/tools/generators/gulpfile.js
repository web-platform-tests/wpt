var gulp = require("gulp");
var ejs = require("gulp-ejs");
var rename = require("gulp-rename");
var orientation = require("./text-orientation-generator.js");

var templates = [
    ["orthogonal-parent-shrink-to-fit", "orthogonal-parent-shrink-to-fit-001", -1, 24],
];

for (var template of templates) {
    var name = template[0];
    gulp.task(name, function () {
        for (var i = template[2]; i < template[3]; ++i) {
            var target = template[1];
            if (i >= 0)
                target += String.fromCharCode("a".charCodeAt(0) + i);
            gulp.src(name + ".ejs")
                .pipe(ejs({ index: i }))
                .pipe(rename(target))
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

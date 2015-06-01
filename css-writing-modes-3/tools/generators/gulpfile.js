var gulp = require("gulp");
var orientation = require("./text-orientation-generator.js");

gulp.task("text-orientation", function () {
    return orientation.generate();
});

gulp.task("default", ["text-orientation"]);

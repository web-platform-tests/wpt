#!/usr/bin/env node
// node.js program to split a combo test to units.
// Each test must begin with <h3>.
// The last test must have a blank line between the test and post-common text.
// See orthogonal-parent-shrink-to-fit-001.html for an example.
var fs = require("fs")
    path = require("path");

process.argv.slice(2).forEach(function (arg) {
    console.log("Reading " + arg);
    var source = fs.readFileSync(arg, {encoding:"utf-8"});
    var tests = source.split("<h3");
    if (tests.length <= 1)
        throw new Error("Test patterns not found");
    var pre = tests[0];
    tests = tests.slice(1).map(function (str) { return "<h3" + str; });
    var last = tests[tests.length - 1].split("\n\n");
    var post = null;
    if (last.length >= 2) {
        tests[tests.length - 1] = last[0] + "\n";
        post = last.slice(1).join("\n\n");
    }
    pre = pre.replace(/\s*combo\s*/, "");

    var name = path.parse(arg);
    var suffix = 'a'.charCodeAt(0);
    tests.forEach(function (test) {
        var outputName = name.name + String.fromCharCode(suffix) + name.ext;
        suffix++;
        console.log("Writing " + outputName);
        var output = fs.openSync(outputName, "w");
        var match = /^<h3>(.+)<\/h3>/.exec(test);
        if (match) {
            var title = match[1];
            console.log("Title: " + title);
            fs.writeSync(output, pre.replace(/<\/title>/, ": " + title + "</title>"));
        } else {
            fs.writeSync(output, pre);
        }
        fs.writeSync(output, test);
        fs.writeSync(output, post);
        fs.closeSync(output);
    })
})

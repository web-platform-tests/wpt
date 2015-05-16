// node.js program to split a combo test to units.
// See orthogonal-parent-shrink-to-fit-001.html for an example.
var fs = require("fs")
    path = require("path");

process.argv.slice(2).forEach(function (arg) {
    console.log("Reading " + arg);
    var source = fs.readFileSync(arg, {encoding:"utf-8"});
    var pre = null;
    var tests = [];
    for (;;) {
        var result = /^<div class="test".*/m.exec(source);
        if (!result)
            break;
        if (tests.length == 0)
            pre = source.substr(0, result.index);
        else if (result.index)
            tests[tests.length - 1] += source.substr(0, result.index);
        source = source.substr(result.index);
        result = /^<\/div>\n/m.exec(source);
        if (!result)
            throw new Error("Test closing pattern not found");
        var next = result.index + result[0].length;
        tests.push(source.substr(0, next));
        source = source.substr(next);
    }
    if (tests.length == 0)
        throw new Error("Test patterns not found");
    var post = source;
    pre = pre.replace(/\s*combo\s*/, "");

    var name = path.parse(arg);
    var suffix = 'a'.charCodeAt(0);
    tests.forEach(function (test) {
        var outputName = name.name + String.fromCharCode(suffix) + name.ext;
        suffix++;
        console.log("Writing " + outputName);
        var output = fs.openSync(outputName, "w");
        var match = /^<div class="test" title="([^"]+)"/.exec(test);
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

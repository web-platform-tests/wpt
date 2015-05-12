var fs = require("fs"),
    http = require("http"),
    path = require("path"),
    stream = require("stream"),
    url = require("url");

process.argv.slice(2).forEach(function (arg) {
    var pre = [];
    var tests = [];
    var test = null;
    var post = null;
    console.log("Reading " + arg);
    fs.readFileSync(arg, {encoding:"utf-8"}).split("\n").forEach(function (line) {
        if (post) {
            post.push(line);
        } else if (/^<div class="test"/.test(line)) {
            test = [line];
        } else if (test) {
            test.push(line);
            if (line == "</div>") {
                tests.push(test.join("\n"));
                test = null;
            }
        } else if (tests.length) {
            post = [line];
        } else {
            pre.push(line);
        }
    });
    pre = pre.join("\n")
        .replace(/\s*combo\s*/, "")
        + "\n";
    post = post.join("\n") + "\n";
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
        fs.writeSync(output, test + "\n");
        fs.writeSync(output, post);
        fs.closeSync(output);
    })
})

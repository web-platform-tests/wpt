// This is a node.js program to generate text-orientation-script test files.
var fs = require("fs"),
    http = require("http"),
    path = require("path"),
    stream = require("stream");

var unicodeData = {
    url: {
        gc: "http://www.unicode.org/Public/UCD/latest/ucd/extracted/DerivedGeneralCategory.txt",
        vo: "http://www.unicode.org/Public/vertical/revision-13/VerticalOrientation-13.txt",
    },
    get: function (url, formatter) {
        formatter = formatter || this.formatAsArray;
        var defer = Promise.defer();
        var buffer = "";
        var parser = new stream.Writable();
        parser._write = function (chunk, encoding, next) {
            buffer += chunk;
            next();
        };
        parser.on("finish", function () {
            var results = null;
            for (var line of buffer.split("\n"))
                results = unicodeData.parseLine(line, formatter, results);
            defer.resolve(results);
        });
        http.get(url, function (res) {
            res.pipe(parser);
        });
        return defer.promise;
    },
    parseLine: function (line, formatter, results) {
        if (!line.length || line[0] == "#")
            return results;
        var match = /([0-9A-F]+)(\.\.([0-9A-F]+))?\s*;\s*(\w+)/.exec(line);
        if (!match)
            throw new Error("Inavlid format: " + line);
        var from = parseInt(match[1], 16);
        var to = match[3] ? parseInt(match[3], 16) : from;
        var value = match[4];
        return formatter(results, from, to, value);
    },
    formatAsArray: function (results, from, to, value) {
        results = results || [];
        for (var code = from; code <= to; code++)
            results[code] = value;
        return results;
    },
    formatAsRangesByValue: function (results, from, to, value) {
        results = results || {};
        var list = results[value];
        if (!list) {
            list = [];
            results[value] = list;
        } else {
            var last = list[list.length - 1];
            if (last == from - 1) {
                list[list.length - 1] = to;
                return results;
            }
        }
        list.push(from);
        list.push(to);
        return results;
    },
    arrayFromRangesByValue: function (dict) {
        var array = [];
        for (var value in dict) {
            var ranges = dict[value];
            for (var i = 0; i < ranges.length; i += 2) {
                var to = ranges[i+1];
                for (var code = ranges[i]; code <= to; code++)
                    array[code] = value;
            }
        }
        return array;
    },
};

Promise.all([
    unicodeData.get(unicodeData.url.vo, unicodeData.formatAsRangesByValue),
    unicodeData.get(unicodeData.url.gc),
]).then(function (results) {
    generate(results[0], results[1]);
});

function generate(rangesByVO, gc) {
    var template = fs.readFileSync("text-orientation-template.html", {encoding:"utf-8"})
        .split("INSERT-DATA-HERE");
    for (var value in rangesByVO)
        writeHtml(value, rangesByVO[value], template, gc);
}

function writeHtml(value, ranges, template, gc) {
    template = template.map(function (text) { return text
        .replace("<!--META-->",
            '<link rel="help" href="http://www.w3.org/TR/css-writing-modes-3/#text-orientation">\n' +
            '<meta name="assert" content="Test orientation of characters where vo=' + value + '.">');
    });
    var path = "../../text-orientation-script-" + value.toLowerCase() + "-001.html";
    console.log("Writing " + path);
    var output = fs.openSync(path, "w");
    fs.writeSync(output, template[0]);
    var chars = [];
    fs.writeSync(output, '<div data-vo="' + value + '"><div class="test">\n');
    var linesInBlock = 0;
    for (var i = 0; i < ranges.length; i += 2) {
        var code = ranges[i];
        var to = ranges[i+1];
        for (; code <= to; code++) {
            // TODO: non-BMP not supported yet
            if (code > 0xFFFF)
                break;
            // CJK Unified Ideographs (Han) is omitted except the first and the last to make smaller
            if (code > 0x4E00 && code < 0x9FCC)
                continue;
            var gc0 = gc[code][0];
            // General Category M* and C* are omitted as they're likely to not render well
            if (gc0 == "M" || gc0 == "C")
                continue;
            chars.push(code);
            if (chars.length >= 64) {
                writeLine(output, chars);
                chars = [];
                if (++linesInBlock >= 64) {
                    fs.writeSync(output, '</div><div class="test">\n');
                    linesInBlock  = 0;
                }
            }
        }
    }
    if (chars.length)
        writeLine(output, chars);
    fs.writeSync(output, "</div></div>\n");
    fs.writeSync(output, template[1]);
    fs.closeSync(output);
}

function writeLine(output, chars) {
    var line = String.fromCharCode.apply(String, chars);
    fs.writeSync(output, "<div>" + line + "</div>\n");
}

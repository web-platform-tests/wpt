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
    codePointsFromRanges: function (ranges, gc) {
        var codePoints = [];
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
                codePoints.push(code);
            }
        }
        return codePoints;
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
        writeHtml(value, unicodeData.codePointsFromRanges(rangesByVO[value], gc), template);
}

function writeHtml(value, codePoints, template) {
    var pageSize = 64 * 64;
    var pages = Math.floor(codePoints.length / pageSize) + 1;
    var index = 0;
    for (var page = 1; index < codePoints.length; page++) {
        var max = Math.min(index + pageSize, codePoints.length);
        var path = "../../text-orientation-script-" + value.toLowerCase() + "-" + padZero(page, 3) + ".html";
        var rangeText = " (#" + page + "/" + pages +
            ", " + (max - index) + " code points in U+" +
            toHex(codePoints[index]) + "-" + toHex(codePoints[max-1]) + ")";
        var title = "Test orientation of characters where vo=" + value + rangeText;
        console.log("Writing " + path + rangeText);
        var output = fs.openSync(path, "w");
        fs.writeSync(output, template[0]
            .replace("<!--META-->",
                '<title>CSS Writing Modes Test: ' + title + '.</title>\n' +
                '<link rel="help" href="http://www.w3.org/TR/css-writing-modes-3/#text-orientation">\n' +
                '<meta name="assert" content="' + title + '">'));
        fs.writeSync(output, '<div data-vo="' + value + '" class="test">\n');
        var line = [];
        for (; index < max; index++) {
            var code = codePoints[index];
            line.push(code);
            if (line.length >= 64) {
                writeLine(output, line);
                line = [];
            }
        }
        if (line.length)
            writeLine(output, line);
        fs.writeSync(output, "</div>\n");
        fs.writeSync(output, template[1]);
        fs.closeSync(output);
    }
}

function writeLine(output, line) {
    line = String.fromCharCode.apply(String, line)
        .replace(/&/, "&amp;")
        .replace(/</, "&lt;");
    fs.writeSync(output, "<div>" + line + "</div>\n");
}

function toHex(value) {
    return padZero(value.toString(16).toUpperCase(), 4);
}

function padZero(value, digits) {
    value = "0000" + value;
    return value.substr(value.length - digits);
}

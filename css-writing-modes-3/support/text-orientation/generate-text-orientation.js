// This is a node.js program to generate text-orientation-script test files.
var fs = require("fs"),
    http = require("http"),
    path = require("path"),
    stream = require("stream");

var unicodeData = {
    url: {
        blocks: "http://www.unicode.org/Public/UCD/latest/ucd/Blocks.txt",
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
                if (code >= 0xD800 && code <= 0xDFFF) { // Surrogate Pairs
                    continue;
                }
                // To make tests smaller, omit some obvious ranges except the first and the last
                if (code > 0x3400 && code < 0x4DB5 || // CJK Unified Ideographs Extension A
                    code > 0x4E00 && code < 0x9FCC || // CJK Unified Ideographs (Han)
                    code > 0xAC00 && code < 0xD7A3 || // Hangul Syllables
                    code > 0x20000 && code < 0x2A6D6 || // CJK Unified Ideographs Extension B
                    code > 0x2A700 && code < 0x2B734 || // CJK Unified Ideographs Extension C
                    code > 0x2B740 && code < 0x2B81D) { // CJK Unified Ideographs Extension D
                    continue;
                }
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
    unicodeData.get(unicodeData.url.blocks, unicodeData.formatAsRangesByValue),
]).then(function (results) {
    generate(results[0], results[1]);
    console.log("Writing unicode-data.js");
    var output = fs.openSync("unicode-data.js", "w");
    fs.writeSync(output, "var rangesByBlock = ");
    fs.writeSync(output, JSON.stringify(results[2], null, "\t"));
    fs.writeSync(output, ";\n");
    fs.closeSync(output);
}).catch(function (e) {
    console.log(e);
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
    if (pages > 1)
        writeHtmlPage(value, codePoints, template, "combo dom font", 0, codePoints.length);
    var index = 0;
    for (var page = 1; index < codePoints.length; page++) {
        var lim = Math.min(index + pageSize, codePoints.length);
        index = writeHtmlPage(value, codePoints, template, "dom font", index, lim, page, pages);
    }
}

function writeHtmlPage(value, codePoints, template, flags, index, lim, page, pages) {
    var path = "../../text-orientation-script-" + value.toLowerCase();
    var rangeText = (lim - index) + " code points in U+" +
        toHex(codePoints[index]) + "-" + toHex(codePoints[lim-1]);
    if (page) {
        path += "-" + padZero(page, 3);
        rangeText = "#" + page + "/" + pages + ", " + rangeText;
    }
    path += ".html";
    rangeText = " (" + rangeText + ")";
    var title = "Test orientation of characters where vo=" + value + rangeText;
    console.log("Writing " + path + rangeText);
    var output = fs.openSync(path, "w");
    fs.writeSync(output, template[0].replace("<!--META-->",
        '<title>CSS Writing Modes Test: ' + title + '.</title>\n' +
        '<link rel="help" href="http://www.w3.org/TR/css-writing-modes-3/#text-orientation">\n' +
        '<meta name="assert" content="' + title + '">\n' +
        '<meta name="flags" content="' + flags + '">'));
    fs.writeSync(output, '<div data-vo="' + value + '" class="test">\n');
    var line = [];
    for (; index < lim; index++) {
        var code = codePoints[index];
        if (code >= 0x10000) {
            code -= 0x10000;
            line.push(code >>> 10 & 0x3FF | 0xD800);
            code = 0xDC00 | code & 0x3FF;
        }
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
    return index;
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
    if (value.length >= digits)
        return value;
    value = "0000" + value;
    return value.substr(value.length - digits);
}

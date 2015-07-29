// This is a node.js program to generate text-orientation-script test files.
var ejs = require("ejs");
var fs = require("fs");
var http = require("http");
var path = require("path");
var stream = require("stream");
var url = require("url");

var unicodeData = {
    url: {
        blocks: "http://www.unicode.org/Public/UCD/latest/ucd/Blocks.txt",
        gc: "http://www.unicode.org/Public/UCD/latest/ucd/extracted/DerivedGeneralCategory.txt",
        vo: "http://www.unicode.org/Public/vertical/revision-13/VerticalOrientation-13.txt",
    },
    get: function (source, formatter) {
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
        var basename = path.basename(url.parse(source).path);
        var local = "ucd/" + basename;
        if (fs.existsSync(local)) {
            fs.createReadStream(local)
                .pipe(parser);
        } else {
            http.get(source, function (res) {
                res.pipe(parser);
            });
        }
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
    isSkipGeneralCategory: function (code, gc) {
        var gc0 = gc[code][0];
        // General Category M* and C* are omitted as they're likely to not render well
        return gc0 == "M" || gc0 == "C";
    },
    isCJKMiddle: function (code) {
        // To make tests smaller, omit some obvious ranges except the first and the last
        return code > 0x3400 && code < 0x4DB5 || // CJK Unified Ideographs Extension A
            code > 0x4E00 && code < 0x9FCC || // CJK Unified Ideographs (Han)
            code > 0xAC00 && code < 0xD7A3 || // Hangul Syllables
            code > 0x20000 && code < 0x2A6D6 || // CJK Unified Ideographs Extension B
            code > 0x2A700 && code < 0x2B734 || // CJK Unified Ideographs Extension C
            code > 0x2B740 && code < 0x2B81D; // CJK Unified Ideographs Extension D
    },
    codePointsFromRanges: function (ranges, skipFunc) {
        var codePoints = [];
        for (var i = 0; i < ranges.length; i += 2) {
            var code = ranges[i];
            var to = ranges[i+1];
            for (; code <= to; code++) {
                if (code >= 0xD800 && code <= 0xDFFF) // Surrogate Pairs
                    continue;
                if (skipFunc && skipFunc(code))
                    continue;
                codePoints.push(code);
            }
        }
        return codePoints;
    },
    splitCodePoints: function (codePoints, values) {
        var results = [];
        var currentCodePoints = [];
        var currentValue = null;
        for (var code of codePoints) {
            var value = values[code];
            if (value != currentValue) {
                results.push([currentCodePoints, currentValue]);
                currentValue = value;
                currentCodePoints = [];
            }
            currentCodePoints.push(code);
        }
        if (currentCodePoints.length)
            results.push([currentCodePoints, currentValue]);
        return results.slice(1);
    },
};

var Generator = function (rangesByVO, gc, blocks) {
    this.rangesByVO = rangesByVO;
    this.gc = gc;
    this.blocks = blocks;
    var template = fs.readFileSync("text-orientation.ejs", "utf-8");
    this.template = ejs.compile(template);
    this.charactersPerLine = 32;
};
Generator.prototype.generate = function (argv) {
    var codePointsByVO = {};
    var gc = this.gc;
    function skipDefault(code) {
        return unicodeData.isCJKMiddle(code) || unicodeData.isSkipGeneralCategory(code, gc) ||
            code == 0x0E33 || // Thai U+0E33 is class AM: https://www.microsoft.com/typography/OpenTypeDev/thai/intro.htm
            code == 0x0EB3; // Lao U+0EB3 is class AM: https://www.microsoft.com/typography/OpenTypeDev/lao/intro.htm
    }
    function skipNoSkip(code) {
        return unicodeData.isSkipGeneralCategory(code, gc) ||
            code == 0x0E33 || // Thai U+0E33 is class AM: https://www.microsoft.com/typography/OpenTypeDev/thai/intro.htm
            code == 0x0EB3; // Lao U+0EB3 is class AM: https://www.microsoft.com/typography/OpenTypeDev/lao/intro.htm
    }
    var skipFunc = argv.noskip ? skipNoSkip : skipDefault;
    for (var value in this.rangesByVO)
        codePointsByVO[value] = unicodeData.codePointsFromRanges(this.rangesByVO[value], skipFunc);

    this.codePointsByVO = codePointsByVO;
    this.prefix = argv.prefix ? "-" + argv.prefix + "-" : "";

    if (!argv.nocombo)
        this.generateFile();
    if (argv.nochild)
        return;

    var pageSize = this.charactersPerLine * 64;
    var fileIndex = 0;
    for (var vo in codePointsByVO) {
        var codePoints = codePointsByVO[vo];
        var limit = codePoints.length;
        var pages = Math.ceil(limit / pageSize);
        for (var min = 0, page = 1; min < limit; ++page, ++fileIndex) {
            var nextLimit = Math.min(limit, min + pageSize);
            this.codePointsByVO = {};
            this.codePointsByVO[vo] = codePoints.slice(min, nextLimit);
            this.generateFile(vo, fileIndex, page, pages);
            min = nextLimit;
        }
    }
};
Generator.prototype.generateFile = function (vo, fileIndex, page, pages) {
    var path = "../../text-orientation-script-001";
    this.title = "Test orientation of characters";
    this.flags = "dom font";
    // if (fileIndex)
    //     path += "-" + padZero(fileIndex, 3);
    if (fileIndex === undefined)
        this.flags += " combo";
    else
        path += affixFromIndex(fileIndex);
    if (vo) {
        this.title += " where vo=" + vo;
        var codePoints = this.codePointsByVO[vo];
        var rangeText = codePoints.length + " code points in U+" + toHex(codePoints[0]) + "-" + toHex(codePoints[codePoints.length - 1]);
        if (page && pages > 1)
            rangeText = "#" + page + "/" + pages + ", " + rangeText;
        this.title += " (" + rangeText + ")";
    }
    path += ".html";
    console.log("Writing " + path + ": " + this.title);
    var output = fs.openSync(path, "w");
    fs.writeSync(output, this.template(this));
    fs.closeSync(output);
};
Generator.prototype.splitCodePointsByBlocks = function (codePoints) {
    return unicodeData.splitCodePoints(codePoints, this.blocks);
};
Generator.prototype.linesFromCodePoints = function (codePoints) {
    var lines = [];
    var limit = codePoints.length;
    for (var index = 0; index < limit; ) {
        var lineLimit = Math.min(limit, index + this.charactersPerLine);
        var line = [];
        for (; index < lineLimit; ++index) {
            var code = codePoints[index];
            if (code >= 0x10000) {
                code -= 0x10000;
                line.push(code >>> 10 & 0x3FF | 0xD800);
                code = 0xDC00 | code & 0x3FF;
            }
            line.push(code);
        }
        lines.push(String.fromCharCode.apply(String, line));
    }
    return lines;
};

function toHex(value) {
    return padZero(value.toString(16).toUpperCase(), 4);
}

function padZero(value, digits) {
    if (value.length >= digits)
        return value;
    value = "0000" + value;
    return value.substr(value.length - digits);
}

function affixFromIndex(index) {
    if (index < 0)
        return "";
    if (index >= 26)
        throw new Error("Affix index too large (" + index + ")");
    return String.fromCharCode("a".charCodeAt(0) + index);
}

module.exports.generate = function (argv) {
    return Promise.all([
        unicodeData.get(unicodeData.url.vo, unicodeData.formatAsRangesByValue),
        unicodeData.get(unicodeData.url.gc),
        unicodeData.get(unicodeData.url.blocks),
    ]).then(function (results) {
        var generator = new Generator(results[0], results[1], results[2]);
        generator.generate(argv);
    });
};

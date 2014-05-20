var fs = require("fs")
,   pth = require("path")
,   exec = require("child_process").execFile
,   phanthomScript = pth.join(__dirname, "get-analysis-for.phjs")
,   specs = require("./specs")
,   perSec = JSON.parse(fs.readFileSync(pth.join(__dirname, "tests-per-section.json"), "utf8"))
;

function analyseSpec (url, isMultipage, shortName, cb) {
    exec("/usr/local/bin/phantomjs", [phanthomScript, url], { timeout: 60000 }, function (err, stdout, stderr) {
        var output;
        if (err || stderr) {
            console.log("[ERROR] " + (err || stderr) + " (" + shortName + ': ' + url + ")");
            cb(err || stderr);
            return;
        }
        try {
            output = JSON.parse(stdout);
            var filename = url.split('/');
                filename = filename[filename.length - 1];
            var page = {
                url: url,
                id: filename,
                original_id: filename,
                level: 1,
                algorithmicSteps: 0,
                idlComplexity: 0,
                normativeStatements: 0,
                propdef: 0,
                wordCount: 0,
                tests: 0
            };
            output.forEach(function(section) {
                if (isMultipage) {
                    if (section.level == 1) {
                        page.algorithmicSteps += section.algorithmicSteps;
                        page.idlComplexity += section.idlComplexity;
                        page.normativeStatements += section.normativeStatements;
                        page.propdef += section.propdef;
                        page.wordCount += section.wordCount;
                        page.tests += section.tests;
                    }
                    section.level++;
                    section.id = filename + '#' + section.id;
                }
                section.url = url + '#' + section.original_id;
            });
            if (isMultipage) output.unshift(page);
            
            console.log("OK: " + shortName + ' (' + url + ')');
            cb(null, output);
        }
        catch (e) {
            console.log("[ERROR] " + e + " (" +  + shortName + ': ' + url  + ") received: <<<" + stdout + ">>>");
            cb(e);
        }
    });
}

function extract(specs) {
    var spec = specs.pop()
    ,   shortName = spec.shortName;
    console.log("Launching extraction for " + shortName);
    var isMultipage = !!spec.pages;
    var pages = isMultipage ? spec.pages.splice(0) : [spec.href];
    var result = [];
    
    function handleOuput(err, output) {
        if (err) {
            if (isMultipage) {
                console.log("ERROR: failed to fully extract '" + shortName + "': " + err);
            } else {
                console.log("ERROR: " + err);
            }
            if (specs.length) extract(specs);
        } else {
            result.push.apply(result, output);
            if (pages.length) {
                analyseSpec(pages.shift(), isMultipage, shortName, handleOuput);
            } else {
                result.forEach(function(section) {
                    if (shortName in perSec) section.tests = perSec[shortName][section.id] || 0;

                });
                fs.writeFileSync(pth.join(__dirname, "spec-data-" + shortName + ".json"), JSON.stringify(result, null, 4), "utf8");
                if (specs.length) extract(specs);
            }
        }
    }
    analyseSpec(pages.shift(), isMultipage, shortName, handleOuput);
}

var w3cSpecs = Object.keys(specs).map(function(k) {
    return specs[k];
}).filter(function(s) {
    return s.publisher === "W3C";
});

if (process.argv.length > 2) {
    var spec = w3cSpecs.filter(function(s) {
        return s.shortName === process.argv[2];
    });
    if (spec.length) {
        extract(spec);
    } else {
        console.log("Can't find a W3C spec of that name: '" + process.argv[2] + "'.");
        process.exit(1);
    }
} else {
    extract(w3cSpecs);
}
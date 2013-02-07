
var fs = require("fs")
,   pth = require("path")
,   exec = require("child_process").execFile
,   phanthomScript = pth.join(__dirname, "get-analysis-for.phjs")
,   specs = {
        html:       "http://www.w3.org/html/wg/drafts/html/master/single-page.html"
    ,   canvas2d:   "http://www.w3.org/html/wg/drafts/2dcontext/html5_canvas/Overview.html"
    // ,   microdata:  "http://www.w3.org/html/wg/drafts/microdata/master/Overview.html"
    }
,   data = {}
,   ranges = {}
;

function analyseSpec (spec, cb) {
    exec("/usr/local/bin/phantomjs", [phanthomScript, specs[spec]], { timeout: 30000 }, function (err, stdout, stderr) {
        if (err || stderr) {
            console.log("[ERROR] " + (err || stderr) + " (" + specs[spec] + ")");
        }
        else {
            try {
                var res = JSON.parse(stdout);
                data[spec] = res;
                console.log(spec + " OK");
            }
            catch (e) {
                console.log("[ERROR] " + e + " (" + spec + ") received: <<<" + stdout + ">>>");
            }
        }
        cb(null, spec);
    });
}

for (var spec in specs) {
    console.log("Launching extraction for " + spec);
    data[spec] = [];
    ranges[spec] = {};
    analyseSpec(spec, function (err, spec) {
        if (err) return console.log("ERROR: " + err);
        fs.writeFileSync(pth.join(__dirname, "spec-data-" + spec + ".json"), JSON.stringify(data[spec], null, 4), "utf8");
    });
}



// XXX
//  - output data that matches that to the tests we have
//  - the output data needs to keep the ToCs in order



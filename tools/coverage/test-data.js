
var fs = require("fs")
,   pth = require("path")
,   wrench = require("wrench")
,   exec = require("child_process").execFile
,   express = require("express")
,   phanthomScript = pth.join(__dirname, "get-data-for.phjs")
,   port = 3017
,   loaderURL = "http://localhost:" + port + "/tools/coverage/loader.html?"
,   concurrentPhantoms = 5
,   concurrent = 0
,   spawnTimeOut = 30000
,   rootDir = pth.join(__dirname, "../..")
,   sources = ["html", "canvas2d", "microdata"]
,   candidates = []
,   results = {}
;

// serve pages ourselves
var app = express();
app.configure(function () {
    app.use(express["static"](rootDir));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.listen(port);

function listCandidates (src) {
    var files = wrench.readdirSyncRecursive(pth.join(rootDir, src))
                      .filter(function (f) { return (/\.(x)?htm(l)?$/).test(f); })
                      .map(function (f) { return pth.join("/" + src, f); })
    ;
    candidates = candidates.concat(files);
}
for (var i = 0, n = sources.length; i < n; i++) listCandidates(sources[i]);

function processNext () {
    if (!candidates.length) {
        if (concurrent) return;
        fs.writeFileSync(pth.join(__dirname, "test-data.json"), JSON.stringify(results, null, 4), "utf8");
        process.exit(0);
    }
    var urlPath = candidates.shift()
    ,   url = loaderURL + urlPath;
    concurrent++;
    exec("/usr/local/bin/phantomjs", [phanthomScript, url], { timeout: spawnTimeOut }, function (err, stdout, stderr) {
        concurrent--;
        if (err || stderr) {
            console.log("[ERROR] " + (err || stderr) + " (" + url + ")");
            results[urlPath] = 0;
        }
        else {
            try {
                var res = JSON.parse(stdout);
                results[res.path] = res.tests;
                console.log(url + " OK");
            }
            catch (e) {
                console.log("[ERROR] " + e + " (" + url + ") received: <<<" + stdout + ">>>");
                results[urlPath] = 0;
            }
        }
        processNext();
    });
}
// XXX DEBUG
// candidates = ["/html/dom/documents/dom-tree-accessors/Element.getElementsByClassName-null-undef.html"];
for (var i = 0; i < concurrentPhantoms; i++) processNext();


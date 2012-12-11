
// convert from old-style test structure to new style

// XXX changes
//  - turn everything outside [a-zA-Z0-9-] to "-"
//  - add an "original-id.json" file with the original ID
//  - make a master/ED and a CR branch (make that temp/CR and temp/unicorn)
//  - make this into a tool in the repo
//      - get the spec off the Web
//      - be non-destructive, just add missing directories when applicable
//  - then move stuff around


var fs = require("fs")
,   pth = require("path")
,   _ = require("underscore")
,   jsdom = require("jsdom")
,   wrench = require("wrench")
,   mkdirp = require("mkdirp").sync
,   testDir = pth.join(__dirname, "../../tests")
,   MAX_DEPTH = 3
;

if (process.argv[2] !== "--force") {
    console.log([
        "################ WARNING #########################################"
    ,   "   As currently implemented, this script is very much destructive."
    ,   "   It will destroy the entire tests directory. For real."
    ,   "   If you *really* wish to run it, run it with --force."
    ,   "   Eventually, it will simply update the directory tree."
    ,   "################ /WARNING ########################################"
    ].join("\n"));
    process.exit(1);
}

console.log("Move harness and reporting dirs out of test.");
wrench.copyDirSyncRecursive(pth.join(testDir, "harness"), pth.join(testDir, "../harness"));
wrench.copyDirSyncRecursive(pth.join(testDir, "reporting"), pth.join(testDir, "../reporting"));

console.log("Delete the test directory.");
if (fs.existsSync(testDir)) wrench.rmdirSyncRecursive(testDir);
mkdirp(testDir);

var sections = {
    html:       "/Projects/htmlwg.org/drafts/output/html/master/Overview.html"
,   canvas2d:   "/Projects/htmlwg.org/drafts/output/2dcontext/html5_canvas/Overview.html"
,   microdata:  "/Projects/htmlwg.org/drafts/output/microdata/master/Overview.html"
};

function walkTree ($, $el, list) {
    $el.find("> li").each(function () {
        var $li = $(this)
        ,   $a = $li.find("> a").first()
        ;
        // skip sections that don't have a number
        if (!/^\s*\d+/.test($a.text())) return;
        var def = { id: $a.attr("href").replace(/^.*#/, "") }
        ,   $ol = $li.find("> ol").first()
        ;
        if ($ol.length) {
            def.children = [];
            walkTree($, $ol, def.children);
        }
        list.push(def);
    });
}

function extractSections (sec, secDir, spec, cb) {
    jsdom.defaultDocumentFeatures.FetchExternalResources = false;
    jsdom.defaultDocumentFeatures.ProcessExternalResources = false;
    jsdom.defaultDocumentFeatures.MutationEvents = "2.0";
    jsdom.defaultDocumentFeatures.SkipExternalResources = true;
    jsdom.env(
        spec
    ,   function (err, window) {
            if (err) return cb(err);
            jsdom.jQueryify(window, "/Projects/COMMON/jquery.min.js", function (window, $) {
                if (!$) return cb("$ was not defined");
                var $root = $("body > ol.toc").first()
                ,   tree = []
                ;
                walkTree($, $root, tree);
                cb(null, tree, sec, secDir);
            }
        );
    });
}

function makeDirs (base, tree, depth) {
    console.log("Making " + base + " at depth " + depth);
    for (var i = 0, n = tree.length; i < n; i++) {
        var sec = tree[i]
        ,   sane = sec.id.replace(/\//g, "_")
        ,   path = pth.join(base, sane)
        ;
        mkdirp(path);
        fs.writeFileSync(pth.join(path, ".gitkeep"), "", "utf8");
        if (sec.children && sec.children.length) {
            if (depth === 3) {
                fs.writeFileSync(pth.join(path, "contains.json"), JSON.stringify(sec.children, null, 4), "utf8");
            }
            else {
                makeDirs(path, sec.children, depth + 1);
            }
        }
    }
}

for (var sec in sections) {
    var secDir = pth.join(testDir, sec);
    mkdirp(secDir);
    console.log("Launching extraction for " + sec);
    extractSections(sec, secDir, sections[sec], function (err, toc, sec, secDir) {
        if (err) console.log("ERROR: " + err);
        makeDirs(secDir, toc, 1);
    });
}


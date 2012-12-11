
// convert from old-style test structure to new style

// XXX changes
//  - turn everything outside [a-zA-Z0-9-] to "-"
//  - add an "original-id.json" file with the original ID
//  - merge 5+5.1, etc. build on latest and greatest spec
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
    // use hg for source, gh for target
,   sourceDir = pth.join(__dirname, "../html")
,   targetDir = pth.join(__dirname, "../html-testsuite")
,   sourceTestDir = pth.join(sourceDir, "tests")
,   testDir = pth.join(targetDir, "tests")
,   MAX_DEPTH = 3
;

console.log("Reset target.");
if (fs.existsSync(testDir)) wrench.rmdirSyncRecursive(testDir);

console.log("Move harness and reporting dirs out of test.");
mkdirp(testDir);
wrench.copyDirSyncRecursive(pth.join(sourceDir, "tests/harness"), pth.join(targetDir, "harness"));
wrench.copyDirSyncRecursive(pth.join(sourceDir, "tests/reporting"), pth.join(targetDir, "reporting"));

// build a demonstration directory structure with no content in order to show
// how it could work
// at the root: html5, html51, canvas2d, canvas2d2, microdata
// in each of those, extract relevant sections from relevant specs (from ToC)
//  use IDs for directory names, sanitised
//  build directories three levels deep
//  put a .gitkeep in each directory
//  when there are sections beyond the third level, place a contains.json that has the subsections there

var sections = {
    html5:      "/Projects/htmlwg.org/drafts/output/html/CR/Overview.html"
,   html51:     "/Projects/htmlwg.org/drafts/output/html/master/Overview.html"
,   canvas2d:   "/Projects/htmlwg.org/drafts/output/2dcontext/html5_canvas_CR/Overview.html"
,   canvas2d2:  "/Projects/htmlwg.org/drafts/output/2dcontext/html5_canvas/Overview.html"
,   microdata:  "/Projects/htmlwg.org/drafts/output/microdata/CR/Overview.html"
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


// take all tests from approved
//  - for each, if it identifies a section of the specification, move it to
//    the correct directory structure
//  - if not, move it to UNSORTED, and under that maintain its original path
//  - add all tests to approved.json (explain why JSON)
// console.log("Finding all approved tests.");
// var approved = wrench.readdirSyncRecursive(pth.join(sourceDir, "tests/approved"))
// ,   approvedDir = pth.join(sourceTestDir, "approved")
// ;
// wrench.copyDirSyncRecursive(pth.join(approvedDir, "common"), pth.join(testDir, "common"));
// wrench.copyDirSyncRecursive(pth.join(approvedDir, "fonts"), pth.join(testDir, "fonts"));
// wrench.copyDirSyncRecursive(pth.join(approvedDir, "images"), pth.join(testDir, "images"));
// approved = approved.filter(function (it) {
//     if (it === "common" || it.indexOf("common/") === 0 ||
//         it === "fonts"  || it.indexOf("fonts/") === 0 ||
//         it === "images" || it.indexOf("images/") === 0 ||
//         /MANIFEST$/.test(it) || /approvedtests\.txt/.test(it) ||
//         fs.statSync(pth.join(approvedDir, it)).isDirectory()
//     ) return false;
//     return true;
// });
// var bundles = {};
// approved.forEach(function (it) { bundles[it] = true; });
// function bundleIt (bund, orig, base, ext) {
//     if (!bund[base + ext]) return false;
//     if (!_.isArray(bund[base + ext])) bund[base + ext] = [];
//     bund[base + ext].push(orig);
//     delete bund[orig];
//     return true;
// }
// for (var k in bundles) {
//     if (k.indexOf(".htm") === -1 && k.indexOf(".xhtm") === -1) {
//         var base = k.replace(/\.(?:x)?htm(?:l)?$/, "");
//         console.log(base, k);
//         bundleIt(bundles, k, base, ".html") ||
//         bundleIt(bundles, k, base, ".xhtml") ||
//         bundleIt(bundles, k, base, ".htm") ||
//         console.log("Couldn't bundle: " + k);
//     }
// }
// console.log(approved);


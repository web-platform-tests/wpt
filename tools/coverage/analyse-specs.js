var fs = require("fs")
,   pth = require("path")
,   exec = require("child_process").execFile
,   phanthomScript = pth.join(__dirname, "get-analysis-for.phjs")
,   allSpecs = {
		html:       		"http://www.w3.org/html/wg/drafts/html/master/single-page.html"
,		canvas2d:   		"http://www.w3.org/html/wg/drafts/2dcontext/html5_canvas/Overview.html"
,		microdata:  		"http://www.w3.org/html/wg/drafts/microdata/master/Overview.html"
,		css21:      		"http://www.w3.org/TR/CSS21/Overview.html"
,		css3_animations: 	"http://dev.w3.org/csswg/css3-animations/Overview.html"
,		css3_background: 	"http://dev.w3.org/csswg/css3-background/Overview.html"
,		css3_color:  		"http://www.w3.org/TR/css3-color/Overview.html"
,		css3_fonts:  		"http://dev.w3.org/csswg/css3-fonts/Overview.html"
,		css3_transforms: 	"http://dev.w3.org/csswg/css3-transforms/Overview.html"
,		css3_transitions:	"http://dev.w3.org/csswg/css3-transitions/Overview.html"
,		cssom:      		"http://dev.w3.org/csswg/cssom/Overview.html"
,		cssom_view:  		"http://dev.w3.org/csswg/cssom-view/Overview.html"
,		css_device_adapt: 	"http://dev.w3.org/csswg/css-device-adapt/Overview.html"
,		css3_flexbox:    	"http://www.w3.org/TR/css3-flexbox/Overview.html"
,		css3_images: 		"http://dev.w3.org/csswg/css3-images/Overview.html"
,		css3_mediaqueries: 	"http://dev.w3.org/csswg/css3-mediaqueries/Overview.html"
,		css3_selectors:  	"http://www.w3.org/TR/css3-selectors/Overview.html"
,		css3_text:   		"http://dev.w3.org/csswg/css3-text/Overview.html"
,		css3_ui:     		"http://dev.w3.org/csswg/css3-ui/Overview.html"
,		css3_values: 		"http://dev.w3.org/csswg/css3-values/Overview.html"
    }
,   specName = "html"
,   specUrl = allSpecs["html"]
,   specSectionData = "tests-per-section.json"
,   data = {}
,   ranges = {}
;

if(process.argv.length > 2) {
	specName = process.argv[2];
	specSectionData = specName +"-tests-per-section.json";
	specKey = specName.replace(/-/g,'_');
	specUrl = allSpecs[specKey];
}

try {
	perSec = JSON.parse(fs.readFileSync(pth.join(__dirname, specSectionData), "utf8"));
} catch (err) {
	console.log("Unable to find " + specSectionData);
	process.exit(1);
}

console.log("Launching extraction for " + specUrl);
data[specName] = [];
ranges[specName] = {};

analyseSpec(specUrl, specName, function (err, spec) {
	if (err) return console.log("ERROR: " + err);
	for (var i = 0, n = data[spec].length; i < n; i++) {
		var sec = data[spec][i];
		var tests = perSec[spec];
        sec.tests = tests[sec.id] || 0;
	}
    fs.writeFileSync(pth.join(__dirname, "spec-data-" + spec + ".json"), JSON.stringify(data[spec], null, 4), "utf8");
});

function analyseSpec (url, name, cb) {
    exec("/usr/local/bin/phantomjs", [phanthomScript, url], { timeout: 30000 }, function (err, stdout, stderr) {
        if (err || stderr) {
            console.log("[ERROR] " + (err || stderr) + " (" + url + ")");
        }
        else {
            try {
                var res = JSON.parse(stdout);
                data[name] = res;
                console.log(url + " OK");
            }
            catch (e) {
                console.log("[ERROR] " + e + " (" + url + ") received: <<<" + stdout + ">>>");
            }
        }
        cb(null, name);
    });
}



// XXX
//  - output data that matches that to the tests we have
//  - the output data needs to keep the ToCs in order



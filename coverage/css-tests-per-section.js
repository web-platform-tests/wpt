var request = require('request'),
    fs = require('fs'),
    specs = require('./specs'),
    output = require('./tests-per-section.json');

function getTestResults(specs, output) {
    if (!specs.length) {
        fs.writeFileSync('./tests-per-section.json', JSON.stringify(output, null, 4));
        return;
    }
    var spec = specs.pop(),
        url;
    if (spec.testType === 'css') {
        console.log("Fetching test results for " + spec.title + '...');
        request({
            url: "http://test.csswg.org/shepherd/api/coverage?spec=" + spec.shortName
        }, function(err, response, body) {
            if (!err && response.statusCode == 200) {
                output[spec.shortName] = extractData(JSON.parse(body));
                console.log("Found it.");
            } else {
                console.error(err)
            }
            getTestResults(specs, output);
        });
    } else {
        getTestResults(specs, output);
    }

}

function extractData(json, output) {
    var output = output || {};
    json.forEach(function(obj) {
        output[obj.uri.replace(/^#/, '')] = obj.tests;
        if (obj.children) extractData(obj.children, output);
    });
    return output;
}

specs = Object.keys(specs).map(function(k) { return specs[k]; })
getTestResults(specs, output);
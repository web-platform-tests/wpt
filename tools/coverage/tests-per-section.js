var fs = require("fs")
,   pth = require("path")
,   data = JSON.parse(fs.readFileSync(pth.join(__dirname, "test-data.json"), "utf8"))
,   perSpec = {}
;

for (var k in data) {
    var parts = k.split("/");
    parts.shift();
    var spec = parts.shift();
    parts.pop();
    if (!perSpec[spec]) perSpec[spec] = {};
    while (parts.length) {
        var section = parts.pop();
        if (!perSpec[spec][section]) perSpec[spec][section] = 0;
        perSpec[spec][section] += data[k];
    }
}

fs.writeFileSync(pth.join(__dirname, "tests-per-section.json"), JSON.stringify(perSpec, null, 4), "utf8");

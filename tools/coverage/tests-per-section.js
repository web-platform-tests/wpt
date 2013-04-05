var fs = require("fs")
,   pth = require("path")
,   perSpec = {}
,   filename = "tests-per-section.json";

if (process.argv.length > 2)
{
	shepherdApi = "http://test.csswg.org/shepherd/api/coverage";
	shortName = process.argv[2];
	filename = shortName+"-"+filename;

	if(process.argv != "css-all") 
		shepherdApi = shepherdApi+"?spec="+shortName;

	jsonreq = require("jsonreq");
	jsonreq.get(shepherdApi, function(err, data) {

		if(data.length > 0 && data[0].hasOwnProperty("coverage")) {

			if(shortName == "css-all") {

				for(var i = 0; i < data.length; i++)
					getSpecCoverageData(perSpec, data[i]);

				fs.writeFileSync(pth.join(__dirname, filename), JSON.stringify(perSpec, null, 4), "utf8");
			}
			else {
				// don't pull everything unless explicitly asked for
				console.log("Unable to pull coverage for the " + shortName + " spec.");
				console.log("Valid shortnames:");
				console.log("=====================")
				for(var i = 0; i < data.length; i++)
				{
					console.log(data[i]["name"]);
				}
			}
		}
		else
		{
			sections = {};
			getSectionCoverageData(sections, data);
			perSpec[shortName] = sections;
			fs.writeFileSync(pth.join(__dirname, filename), JSON.stringify(perSpec, null, 4), "utf8");
		}
	});
}
else
{
	var data = JSON.parse(fs.readFileSync(pth.join(__dirname, "test-data.json"), "utf8"))

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

	fs.writeFileSync(pth.join(__dirname, filename), JSON.stringify(perSpec, null, 4), "utf8");
}

function getSpecCoverageData(specList, specCoverageData) {

	specName = specCoverageData["name"];
	sections = {};

	getSectionCoverageData(sections, specCoverageData["coverage"]);
	specList[specName] = sections;

}

function getSectionCoverageData(sections, coverageData)
{
	for(var i = 0; i < coverageData.length; i++)
	{
		sectionName = coverageData[i]["uri"].replace("#","");
		sections[sectionName] = coverageData[i]["tests"];

		if(coverageData[i]["children"] != false)
		{
			getSectionCoverageData(sections, coverageData[i]["children"]);
		}
	}
}
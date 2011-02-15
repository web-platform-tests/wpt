var sectionElements = {
	"body": [
		// Obsolete
		"text", "bgColor", "background", "link", "vLink", "aLink",
	],
	"section": [],
	"nav": [],
	"article": [],
	"aside": [],
	"h1": [/* Obsolete */ "align"],
	"h2": [/* Obsolete */ "align"],
	"h3": [/* Obsolete */ "align"],
	"h4": [/* Obsolete */ "align"],
	"h5": [/* Obsolete */ "align"],
	"h6": [/* Obsolete */ "align"],
	"hgroup": [],
	"header": [],
	"footer": [],
	"address": [],
};

mergeElements(sectionElements);

extraTests.push(function() {
	// TODO: these behave differently if the body element is a frameset.  Also
	// should probably test with multiple bodies.
	ReflectionTests.reflects("string", "fgColor", document, "text", document.body);
	ReflectionTests.reflects("string", "bgColor", document, "bgcolor", document.body);
	ReflectionTests.reflects("string", "linkColor", document, "link", document.body);
	ReflectionTests.reflects("string", "vlinkColor", document, "vlink", document.body);
	ReflectionTests.reflects("string", "alinkColor", document, "alink", document.body);
	// Don't mess up the colors :)
	var attrs = ["text", "bgcolor", "link", "alink", "vlink"];
	for (var i = 0; i < attrs.length; i++) {
		document.body.removeAttribute(attrs[i]);
	}
});

var sectionElements = {
	body: {
		// Obsolete
		text: "string",
		bgColor: "string",
		background: "string",
		link: "string",
		vLink: "string",
		aLink: "string",
	},
	section: {},
	nav: {},
	article: {},
	aside: {},
	h1: {
		// Obsolete
		align: "string",
	},
	h2: {
		// Obsolete
		align: "string",
	},
	h3: {
		// Obsolete
		align: "string",
	},
	h4: {
		// Obsolete
		align: "string",
	},
	h5: {
		// Obsolete
		align: "string",
	},
	h6: {
		// Obsolete
		align: "string",
	},
	hgroup: {},
	header: {},
	footer: {},
	address: {},
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

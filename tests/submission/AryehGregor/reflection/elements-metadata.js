var metadataElements = {
	"head": [],
	"title": [],
	"base": ["target"],
	"link": [
		// Conforming
		"rel", "media", "type", "href", "hreflang", "sizes", "relList",
		// Obsolete
		"charset", "rev", "target",
	],
	"meta": [
		// Conforming
		"name", "content", "httpEquiv",
		// Obsolete
		"scheme",
	],
	"style": ["media", "type", "scoped"],
};

mergeElements(metadataElements);

var metadataElements = {
	head: {},
	title: {},
	base: {
		target: "string",
	},
	link: {
		// Conforming
		rel: "string",
		media: "string",
		type: "string",
		href: "url",
		hreflang: "string",
		sizes: "settable tokenlist",
		relList: {type: "tokenlist", domAttrName: "rel"},

		// Obsolete
		charset: "string",
		rev: "string",
		target: "string",
	},
	meta: {
		// Conforming
		name: "string",
		content: "string",
		httpEquiv: {type: "string", domAttrName: "http-equiv"},

		// Obsolete
		scheme: "string",
	},
	style: {
		media: "string",
		type: "string",
		scoped: "boolean",
	},
};

mergeElements(metadataElements);

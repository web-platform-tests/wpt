var metadataElements = {
	head: {},
	title: {},
	base: {
		href: "url",
		target: "string",
	},
	link: {
		// Conforming
		href: "url",
		rel: "string",
		media: "string",
		hreflang: "string",
		type: "string",
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

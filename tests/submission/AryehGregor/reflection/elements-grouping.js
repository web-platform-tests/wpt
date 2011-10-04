var groupingElements = {
	p: {
		// Obsolete
		align: "string",
	},
	hr: {
		// Obsolete
		align: "string",
		color: "string",
		size: "string",
		width: "string",
		noShade: "boolean",
	},
	pre: {
		// Obsolete
		width: "unsigned long",
	},
	blockquote: {
		cite: "url",
	},
	ol: {
		// Conforming
		reversed: "boolean",
		start: {type: "long", defaultVal: 1},
		type: "string",

		// Obsolete
		compact: "boolean",
	},
	ul: {
		// Obsolete
		compact: "boolean",
		type: "string",
	},
	li: {
		// Conforming
		value: "long",

		// Obsolete
		type: "string",
	},
	dl: {
		// Obsolete
		compact: "boolean",
	},
	dt: {},
	dd: {},
	figure: {},
	figcaption: {},
	div: {
		// Obsolete
		align: "string",
	},
};

mergeElements(groupingElements);

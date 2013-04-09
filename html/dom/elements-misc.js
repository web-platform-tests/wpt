// Up-to-date as of 2013-04-09.
var miscElements = {
	// "The root element" section
	html: {
		// Obsolete
		version: "string",
	},

	// "Scripting" section
	script: {
		src: "url",
		type: "string",
		charset: "string",
		// TODO: async attribute (complicated).
		defer: "boolean",
		crossOrigin: {type: "enum", keywords: ["", "anonymous", "use-credentials"]},
	},
	noscript: {},

	// "Edits" section
	ins: {
		cite: "url",
		dateTime: "string",
	},
	del: {
		cite: "url",
		dateTime: "string",
	},

	// "Interactive elements" section
	details: {
		open: "boolean",
	},
	summary: {},
	menu: {
		// Conforming
		type: "string",
		label: "string",

		// Obsolete
		compact: "boolean",
	},
	menuitem: {
		type: {type: "enum", keywords: ["command", "checkbox", "radio"], defaultVal: "command"},
		label: "string",
		icon: "url",
		disabled: "boolean",
		checked: "boolean",
		radiogroup: "string",
		"default": "boolean",
	},

	// Global attributes should exist even on unknown elements
	undefinedelement: {},
};

mergeElements(miscElements);

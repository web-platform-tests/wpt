var miscElements = {
	command: {
		type: {type: "enum", keywords: ["command", "checkbox", "radio"],
			defaultVal: "command"},
		label: "string",
		icon: "string",
		disabled: "boolean",
		checked: "string",
		radiogroup: "string",
	},
	del: {},
	details: {
		open: "boolean",
	},
	html: {
		// Obsolete
		version: "string",
	},
	ins: {
		cite: "url",
		dateTime: "string",
	},
	menu: {
		// Conforming
		type: "string",
		label: "string",

		// Obsolete
		compact: "boolean",
	},
	noscript: {},
	script: {
		src: "url",
		type: "string",
		charset: "string",
		defer: "boolean",
	},
	summary: {},

	// Global attributes should exist even on unknown elements
	undefinedelement: {},
};

mergeElements(miscElements);

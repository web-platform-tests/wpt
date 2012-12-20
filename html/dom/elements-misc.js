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
		defer: "boolean",
		// TODO: async attribute (complicated).
	},

	// "Edits" section
	ins: {
		cite: "url",
		dateTime: "string",
	},
	del: {
		cite: "url",
		dateTime: "string",
	},

	command: {
		type: {type: "enum", keywords: ["command", "checkbox", "radio"],
			defaultVal: "command"},
		label: "string",
		icon: "string",
		disabled: "boolean",
		checked: "string",
		radiogroup: "string",
	},
	details: {
		open: "boolean",
	},
	menu: {
		// Conforming
		type: "string",
		label: "string",

		// Obsolete
		compact: "boolean",
	},
	noscript: {},
	summary: {},

	// Global attributes should exist even on unknown elements
	undefinedelement: {},
};

mergeElements(miscElements);

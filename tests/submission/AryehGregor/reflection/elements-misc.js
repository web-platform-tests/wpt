var miscElements = {
	"command": [["enum", "type", {"values": ["command", "checkbox", "radio"], "missing": "command"}], "label", "icon", "disabled", "checked", "radiogroup"],
	"del": [],
	"details": ["open"],
	"html": [/* Obsolete */ "version"],
	"ins": ["cite", "dateTime"],
	"menu": [
		// Conforming
		"type", "label",
		// Obsolete
		"compact",
	],
	"noscript": [],
	"script": ["src", "type", "charset", "defer"],
	"summary": [],

	// Global attributes should exist even on unknown elements
	"undefinedelement": [],
};

mergeElements(miscElements);

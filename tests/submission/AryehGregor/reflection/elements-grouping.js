var groupingElements = {
	"p": [/* Obsolete */ "align"],
	"hr": [
		// Obsolete
		"align", "color", ["string", "size"], ["string", "width"], "noShade"
	],
	"pre": [/* Obsolete */ ["unsigned long", "width"]],
	"blockquote": ["cite"],
	"ol": [
		// Conforming
		"reversed", "start", "type",
		// Obsolete
		"compact",
	],
	"ul": [/* Obsolete */ "compact", "type"],
	"li": [
		// Conforming
		["long", "value"],
		// Obsolete
		"type",
	],
	"dl": [
		// Obsolete
		"compact",
	],
	"dt": [],
	"dd": [],
	"figure": [],
	"figcaption": [],
	"div": [
		// Obsolete
		"align",
	],
};

mergeElements(groupingElements);

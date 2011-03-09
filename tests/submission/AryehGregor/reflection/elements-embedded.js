var embeddedElements = {
	"img": [
		// Conforming
		"alt", "src", "useMap", "isMap",
		// Obsolete
		"name", "align", "border", "hspace", "longDesc", "vspace",
	],
	"iframe": [
		// Conforming
		"src", "srcdoc", "name", "seamless", "height", "width",
		// Obsolete
		"align", "frameBorder", "longDesc", "marginHeight", "marginWidth", "scrolling",
	],
	"embed": [
		// Conforming
		"src", "type", "height", "width",
		// Obsolete
		"name", "align",
	],
	"object": [
		// Conforming
		"data", "type", "name", "useMap", "height", "width",
		// Obsolete
		"align", "archive", "border", "code", "codeBase", "codeType", "declare", "hspace", "standby", "vspace",
	],
	"param": [
		// Conforming
		"name", ["string", "value"],
		// Obsolete
		"type", "valueType",
	],
	"video": ["audio", "poster", "src", "preload", "loop", "autoplay", "controls", ["unsigned long", "height"], ["unsigned long", "width"]],
	"audio": ["src", "preload", "loop", "autoplay", "controls"],
	"source": ["src", "type", "media"],
	"canvas": [[{type: "unsigned long", defaultVal: 300}, "width"], [{type: "unsigned long", defaultVal: 150}, "height"]],
	"map": ["name"],
	"area": [
		// Conforming
		"alt", "coords", "href", "target", "ping", "rel", "media", "hreflang", "type", "shape", "relList",
		// Obsolete
		"noHref",
	],
};

mergeElements(embeddedElements);

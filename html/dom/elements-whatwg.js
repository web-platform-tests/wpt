// Things defined only in the WHATWG spec, not at the W3C
var whatwgElements = {
	a: {
		ping: "urls",
	},
	device: {},
	track: {
		kind: {type: "enum", keywords: ["subtitles", "captions", "descriptions", "chapters", "metadata"], defaultVal: "captions"},
		label: "string",
		src: "url",
		srclang: "string",
		default: "boolean",
	},
};

mergeElements(whatwgElements);

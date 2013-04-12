// Up-to-date as of 2013-04-09.
var obsoleteElements = {
	applet: {
		align: "string",
		alt: "string",
		archive: "string",
		code: "string",
		codeBase: "url",
		height: "string",
		hspace: "unsigned long",
		name: "string",
		object: "url",
		vspace: "unsigned long",
		width: "string",
	},
	marquee: {
		behavior: "string",
		bgColor: "string",
		direction: "string",
		height: "string",
		hspace: "unsigned long",
		scrollAmount: {type: "unsigned long", defaultVal: 6},
		scrollDelay: {type: "unsigned long", defaultVal: 85},
		trueSpeed: "boolean",
		vspace: "unsigned long",
		width: "string",
	},
	frameset: {
		cols: "string",
		rows: "string",
	},
	frame: {
		name: "string",
		scrolling: "string",
		src: "url",
		frameBorder: "string",
		longDesc: "url",
		noResize: "boolean",
		marginHeight: {type: "string", treatNullAsEmptyString: true},
		marginWidth: {type: "string", treatNullAsEmptyString: true},
	},
	basefont: {
		color: "string",
		face: "string",
		size: "long",
	},
	dir: {
		compact: "boolean",
	},
	font: {
		color: {type: "string", treatNullAsEmptyString: true},
		face: "string",
		size: "string",
	},
};

mergeElements(obsoleteElements);

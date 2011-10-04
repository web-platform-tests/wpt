var obsoleteElements = {
	applet: {
		align: "string",
		alt: "string",
		archive: "string",
		code: "string",
		height: "string",
		hspace: "unsigned long",
		name: "string",
		object: "url",
		vspace: "unsigned long",
		width: "string",
		codeBase: "url",
	},
	marquee: {
		behavior: "string",
		direction: "string",
		height: "string",
		hspace: "unsigned long",
		vspace: "unsigned long",
		width: "string",
		bgColor: "string",
		trueSpeed: "boolean",
		scrollAmount: {type: "unsigned long", defaultVal: 6},
		scrollDelay: {type: "unsigned long", defaultVal: 85},
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
		marginHeight: "string",
		marginWidth: "string",
		noResize: "boolean",
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
		color: "string",
		face: "string",
		size: "string",
	},
};

mergeElements(obsoleteElements);

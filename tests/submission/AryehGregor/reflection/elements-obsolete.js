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
		face: {type: "string", treatNullAsEmptyString: true},
		size: {type: "string", treatNullAsEmptyString: true},
	},
};

mergeElements(obsoleteElements);

var embeddedElements = {
	img: {
		// Conforming
		alt: "string",
		src: "url",
		crossOrigin: {type: "enum", keywords: ["", "anonymous", "use-credentials"]},
		useMap: "string",
		isMap: "boolean",
		// TODO: width/height reflect for setting, but not for getting.

		// Obsolete
		name: "string",
		align: "string",
		hspace: "unsigned long",
		vspace: "unsigned long",
		longDesc: "url",
		border: {type: "string", treatNullAsEmptyString: true},
	},
	iframe: {
		// Conforming
		src: "url",
		srcdoc: "string",
		name: "string",
		sandbox: "settable tokenlist",
		seamless: "boolean",
		height: "string",
		width: "string",

		// Obsolete
		align: "string",
		scrolling: "string",
		frameBorder: "string",
		longDesc: "url",
		marginHeight: {type: "string", treatNullAsEmptyString: true},
		marginWidth: {type: "string", treatNullAsEmptyString: true},
	},
	embed: {
		// Conforming
		src: "url",
		type: "string",
		height: "string",
		width: "string",

		// Obsolete
		name: "string",
		align: "string",
	},
	object: {
		// Conforming
		data: "url",
		type: "string",
		name: "string",
		useMap: "string",
		typeMustMatch: "boolean",
		height: "string",
		width: "string",

		// Obsolete
		align: "string",
		archive: "string",
		code: "string",
		declare: "boolean",
		hspace: "unsigned long",
		standby: "string",
		vspace: "unsigned long",
		codeBase: "url",
		codeType: "string",
		border: {type: "string", treatNullAsEmptyString: true},
	},
	param: {
		// Conforming
		name: "string",
		value: "string",

		// Obsolete
		type: "string",
		valueType: "string",
	},
	video: {
		poster: "url",
		src: "url",
		// As with "keytype", we have no missing value default defined here.
		preload: {type: "enum", keywords: ["none", "metadata", "auto"], nonCanon: {"": "auto"}, defaultVal: null},
		loop: "boolean",
		autoplay: "boolean",
		controls: "boolean",
		height: "unsigned long",
		width: "unsigned long",
	},
	audio: {
		src: "url",
		// As with "keytype", we have no missing value default defined here.
		preload: {type: "enum", keywords: ["none", "metadata", "auto"], nonCanon: {"": "auto"}, defaultVal: null},
		loop: "boolean",
		autoplay: "boolean",
		controls: "boolean",
	},
	source: {
		src: "url",
		type: "string",
		media: "string",
	},
	canvas: {
		width: {type: "unsigned long", defaultVal: 300},
		height: {type: "unsigned long", defaultVal: 150},
	},
	map: {
		name: "string",
	},
	area: {
		// Conforming
		alt: "string",
		coords: "string",
		href: "url",
		target: "string",
		ping: "urls",
		rel: "string",
		media: "string",
		hreflang: "string",
		type: "string",
		shape: "string",
		relList: {type: "tokenlist", domAttrName: "rel"},

		// Obsolete
		noHref: "boolean",
	},
};

mergeElements(embeddedElements);

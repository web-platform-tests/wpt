var embeddedElements = {
	img: {
		// Conforming
		alt: "string",
		src: "url",
		useMap: "string",
		isMap: "boolean",

		// Obsolete
		name: "string",
		align: "string",
		border: "string",
		hspace: "unsigned long",
		longDesc: "url",
		vspace: "unsigned long",

	},
	iframe: {
		// Conforming
		src: "url",
		srcdoc: "string",
		name: "string",
		seamless: "boolean",
		height: "string",
		width: "string",

		// Obsolete
		align: "string",
		frameBorder: "string",
		longDesc: "url",
		marginHeight: "string",
		marginWidth: "string",
		scrolling: "string",
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
		height: "string",
		width: "string",

		// Obsolete
		align: "string",
		archive: "string",
		border: "string",
		code: "string",
		codeBase: "url",
		codeType: "string",
		declare: "boolean",
		hspace: "unsigned long",
		standby: "string",
		vspace: "unsigned long",
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
		audio: "settable tokenlist",
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

var textElements = {
	a: {
		// Conforming
		href: "url",
		download: "string",
		ping: "urls",
		target: "string",
		rel: "string",
		media: "string",
		hreflang: "string",
		type: "string",
		relList: {type: "tokenlist", domAttrName: "rel"},

		// Obsolete
		coords: "string",
		charset: "string",
		name: "string",
		rev: "string",
		shape: "string",
	},
	em: {},
	strong: {},
	small: {},
	s: {},
	cite: {},
	q: {},
	dfn: {},
	abbr: {},
	time: {
		dateTime: "string",
		pubDate: "boolean",
	},
	code: {},
	// Opera 11.50 doesn't allow unquoted "var" here, although ES5 does and
	// other browsers support it.
	"var": {},
	samp: {},
	kbd: {},
	sub: {},
	sup: {},
	i: {},
	b: {},
	mark: {},
	ruby: {},
	rt: {},
	rp: {},
	bdi: {},
	bdo: {},
	span: {},
	br: {
		// Obsolete
		clear: "string",
	},
	wbr: {},
};

mergeElements(textElements);

var textElements = {
	"a": [
		// Conforming
		"target", "rel", "media", "hreflang", "type", "rel", "relList",
		// Obsolete
		"coords", "charset", "name", "rev", ["string", "shape"],
	],
	"em": [],
	"strong": [],
	"small": [],
	"s": [],
	"cite": [],
	"q": [],
	"dfn": [],
	"abbr": [],
	"time": ["dateTime", "pubDate"],
	"code": [],
	"var": [],
	"samp": [],
	"kbd": [],
	"sub": [],
	"sup": [],
	"i": [],
	"b": [],
	"mark": [],
	"ruby": [],
	"rt": [],
	"rp": [],
	"bdi": [],
	"bdo": [],
	"span": [],
	"br": [
		// Obsolete
		"clear"
	],
	"wbr": [],
};

mergeElements(textElements);

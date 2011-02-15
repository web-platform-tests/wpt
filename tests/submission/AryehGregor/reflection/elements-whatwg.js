// Things defined only in the WHATWG spec, not at the W3C
var whatwgElements = {
	"a": ["ping"],
	"device": [],
	"track": ["kind", "label", "src", "srclang", ["boolean", "default"]],
};

mergeElements(whatwgElements);

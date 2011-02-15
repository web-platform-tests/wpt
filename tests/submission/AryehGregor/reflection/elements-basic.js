/**
 * Now we have the data structures that tell us which elements have which
 * attributes.  The elements object is a map from element name to a list of
 * attributes (omitting the global attributes).  Each attribute can either be a
 * list of the form ["type", "attrname", "data"], or just a string "attrname".
 * In the latter case, the type is looked up from the attribs object.  Types
 * are just strings, most of which have fairly guessable meanings.  "data" is
 * optional -- it's used for default values for longs, permitted values for
 * enums, and such.
 */
var basicElements = {
	"a": [
		// Conforming
		"target", "rel", "media", "hreflang", "type", "rel", "relList",
		// Obsolete
		"coords", "charset", "name", "rev", ["string", "shape"],
	],
	"abbr": [],
	"address": [],
	"area": [
		// Conforming
		"alt", "coords", "href", "target", "ping", "rel", "media", "hreflang", "type", "shape", "relList",
		// Obsolete
		"noHref",
	],
	"article": [],
	"aside": [],
	"audio": ["src", "preload", "loop", "autoplay", "controls"],
	"b": [],
	"base": ["target"],
	"bdi": [],
	"bdo": [],
	"blockquote": ["cite"],
	"body": [
		// Obsolete
		"text", "bgColor", "background", "link", "vLink", "aLink",
	],
	"br": [
		// Obsolete
		"clear"
	],
	// TODO: formAction is special
	"button": [["string", "value"], ["enum", "type", {"values": ["submit", "reset", "button"], "missing": "submit"}], /*"formAction",*/ "formEnctype", "formMethod", "formNoValidate", "formTarget", "autofocus", "name", "disabled"],
	"canvas": [["unsigned long", "width", 300], ["unsigned long", "height", 150]],
	"caption": [
		// Obsolete
		"align"
	],
	"cite": [],
	"code": [],
	"col": [
		// Conforming
		"span",
		// Obsolete
		"align", "width", "ch", "chOff", "vAlign",
	],
	"colgroup": ["span"],
	"command": [["enum", "type", {"values": ["command", "checkbox", "radio"], "missing": "command"}], "label", "icon", "disabled", "checked", "radiogroup"],
	"datalist": [],
	"dd": [],
	"del": [],
	"details": ["open"],
	"dfn": [],
	"div": [
		// Obsolete
		"align",
	],
	"dl": [
		// Obsolete
		"compact",
	],
	"dt": [],
	"em": [],
	"embed": [
		// Conforming
		"src", "type", "height", "width",
		// Obsolete
		"name", "align",
	],
	"fieldset": ["name", "disabled"],
	"figcaption": [],
	"figure": [],
	"footer": [],
	// TODO: action is special
	"form": ["autocomplete", "name", "acceptCharset", /*"action",*/ "method", "enctype", "encoding", "target", "noValidate"],
	"h1": [/* Obsolete */ "align"],
	"h2": [/* Obsolete */ "align"],
	"h3": [/* Obsolete */ "align"],
	"h4": [/* Obsolete */ "align"],
	"h5": [/* Obsolete */ "align"],
	"h6": [/* Obsolete */ "align"],
	"head": [],
	"header": [],
	"hgroup": [],
	"hr": [
		// Obsolete
		"align", "color", ["string", "size"], ["string", "width"], "noShade"
	],
	"html": [/* Obsolete */ "version"],
	"i": [],
	"iframe": [
		// Conforming
		"src", "srcdoc", "name", "seamless", "height", "width",
		// Obsolete
		"align", "frameBorder", "longDesc", "marginHeight", "marginWidth", "scrolling",
	],
	"img": [
		// Conforming
		"alt", "src", "useMap", "isMap",
		// Obsolete
		"name", "align", "border", "hspace", "longDesc", "vspace",
	],
	"input": [
		// Conforming
		// TODO: autocomplete for input is different from form; this requires
		// implementing a notion of "state with no associated keyword" for
		// enums.
		"accept", "alt", /*"autocomplete",*/ "max", "min", "multiple", "pattern",
		"placeholder", "required", "src", ["limited unsigned long", "size", 20],
		"step", "maxLength", "readOnly", "defaultChecked", "defaultValue",
		["enum", "type", {"values": ["hidden", "text", "search", "tel", "url",
			"email", "password", "datetime", "date", "month", "week", "time",
			"datetime-local", "number", "range", "color", "checkbox", "radio",
			"file", "submit", "image", "reset", "button"], "missing": "text"},
		// TODO: formAction is special
		/*"formAction",*/ "formEnctype", "formMethod", "formNoValidate",
		"formTarget", "autofocus", "name", "disabled"], "dirname",
		// Obsolete
		"align", "useMap",
	],
	"ins": ["cite", "dateTime"],
	"kbd": [],
	"keygen": ["challenge", "keytype", "autofocus", "name", "disabled"],
	"label": ["htmlFor"],
	"legend": [/* Obsolete */ "align"],
	"li": [
		// Conforming
		["long", "value"],
		// Obsolete
		"type",
	],
	"link": [
		// Conforming
		"rel", "media", "type", "href", "hreflang", "sizes", "relList",
		// Obsolete
		"charset", "rev", "target",
	],
	"map": ["name"],
	"mark": [],
	"menu": [
		// Conforming
		"type", "label",
		// Obsolete
		"compact",
	],
	"meta": [
		// Conforming
		"name", "content", "httpEquiv",
		// Obsolete
		"scheme",
	],
	"meter": [["double", "min"], ["double", "max"], ["double", "low"], ["double", "high"], ["double", "optimum"]],
	"nav": [],
	"noscript": [],
	"object": [
		// Conforming
		"data", "type", "name", "useMap", "height", "width",
		// Obsolete
		"align", "archive", "border", "code", "codeBase", "codeType", "declare", "hspace", "standby", "vspace",
	],
	"ol": [
		// Conforming
		"reversed", "start", "type",
		// Obsolete
		"compact",
	],
	"optgroup": ["disabled", "label"],
	"option": ["disabled", "label", "defaultSelected"],
	// TODO: Add htmlFor as a settable tokenlist, but the syntax doesn't
	// support this right now . . .
	"output": [/*"htmlFor",*/ "name"],
	"p": [/* Obsolete */ "align"],
	"param": [
		// Conforming
		"name", ["string", "value"],
		// Obsolete
		"type", "valueType",
	],
	"pre": [/* Obsolete */ ["unsigned long", "width"]],
	"progress": [["double", "max"]],
	"q": [],
	"rp": [],
	"rt": [],
	"ruby": [],
	"s": [],
	"samp": [],
	"script": ["src", "type", "charset", "defer"],
	"section": [],
	"select": ["multiple", ["limited unsigned long", "size", 0], "autofocus", "name", "disabled"],
	"small": [],
	"source": ["src", "type", "media"],
	"span": [],
	"strong": [],
	"style": ["media", "type", "scoped"],
	"sub": [],
	"summary": [],
	"sup": [],
	"table": [
		// Conforming
		"summary",
		// Obsolete
		"align", "bgColor", "border", "cellPadding", "cellSpacing", "frame", "rules", "width",
	],
	"tbody": [/* Obsolete */ "align", "ch", "chOff", "vAlign"],
	"td": [
		// Conforming
		"colSpan", "rowSpan", "headers",
		// Obsolete
		"abbr", "align", "axis", "bgColor", "ch", "chOff", "height", "noWrap", "vAlign", "width",
	],
	"textarea": ["cols", "placeholder", "required", "rows", "wrap",
		"maxLength", "readOnly", "autofocus", "name", "disabled", "dirname"],
	"tfoot": [/* Obsolete */ "align", "ch", "chOff", "vAlign"],
	"th": [
		// Conforming
		// TODO: double-check that the way we're treating missing value
		// defaults is consistent here.  scope has an auto state with no
		// associated keyword, which is the missing value default -- is this
		// the right syntax for that?
		["enum", "scope", {"values": ["row", "col", "rowgroup", "colgroup"]}], "colSpan", "rowSpan", "headers",
		// Obsolete
		"abbr", "align", "axis", "bgColor", "ch", "chOff", "height", "noWrap", "vAlign", "width",
	],
	"thead": [/* Obsolete */ "align", "ch", "chOff", "vAlign"],
	"time": ["dateTime", "pubDate"],
	"title": [],
	"tr": [/* Obsolete */ "align", "bgColor", "ch", "chOff", "vAlign"],
	"ul": [/* Obsolete */ "compact", "type"],
	"var": [],
	"video": ["audio", "poster", "src", "preload", "loop", "autoplay", "controls", ["unsigned long", "height"], ["unsigned long", "width"]],
	"wbr": [],

	// Obsolete elements
	"applet": ["align", "alt", "archive", "code", "height", "hspace", "name", "object", "vspace", "width", "codeBase"],
	"marquee": ["behavior", "direction", "height", "hspace", "vspace", "width", "bgColor", "trueSpeed", ["unsigned long", "scrollAmount", 6], ["unsigned long", "scrollDelay", 85]],
	"frameset": [["string", "cols"], ["string", "rows"]],
	"frame": ["name", "scrolling", "src", "frameBorder", "longDesc", "marginHeight", "marginWidth", "noResize"],
	"basefont": ["color", "face", ["long", "size"]],
	"dir": ["compact"],
	"font": ["color", "face", ["string", "size"]],

	// Global attributes should exist even on unknown elements
	"undefinedelement": [],
};

mergeElements(basicElements);

extraTests.push(function() {
	// TODO: these behave differently if the body element is a frameset.  Also
	// should probably test with multiple bodies.
	ReflectionTests.reflects("string", "fgColor", document, "text", document.body);
	ReflectionTests.reflects("string", "bgColor", document, "bgcolor", document.body);
	ReflectionTests.reflects("string", "linkColor", document, "link", document.body);
	ReflectionTests.reflects("string", "vlinkColor", document, "vlink", document.body);
	ReflectionTests.reflects("string", "alinkColor", document, "alink", document.body);
	// Don't mess up the colors :)
	var attrs = ["text", "bgcolor", "link", "alink", "vlink"];
	for (var i = 0; i < attrs.length; i++) {
		document.body.removeAttribute(attrs[i]);
	}
});

var obsoleteElements = {
	"applet": ["align", "alt", "archive", "code", "height", "hspace", "name", "object", "vspace", "width", "codeBase"],
	"marquee": ["behavior", "direction", "height", "hspace", "vspace", "width",
		"bgColor", "trueSpeed", [{type: "unsigned long", defaultVal: 6}, "scrollAmount"],
		[{type: "unsigned long", defaultVal: 85}, "scrollDelay"]],
	"frameset": [["string", "cols"], ["string", "rows"]],
	"frame": ["name", "scrolling", "src", "frameBorder", "longDesc", "marginHeight", "marginWidth", "noResize"],
	"basefont": ["color", "face", ["long", "size"]],
	"dir": ["compact"],
	"font": ["color", "face", ["string", "size"]],

};

mergeElements(obsoleteElements);

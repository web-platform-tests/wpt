var obsoleteElements = {
	"applet": ["align", "alt", "archive", "code", "height", "hspace", "name", "object", "vspace", "width", "codeBase"],
	"marquee": ["behavior", "direction", "height", "hspace", "vspace", "width", "bgColor", "trueSpeed", ["unsigned long", "scrollAmount", 6], ["unsigned long", "scrollDelay", 85]],
	"frameset": [["string", "cols"], ["string", "rows"]],
	"frame": ["name", "scrolling", "src", "frameBorder", "longDesc", "marginHeight", "marginWidth", "noResize"],
	"basefont": ["color", "face", ["long", "size"]],
	"dir": ["compact"],
	"font": ["color", "face", ["string", "size"]],

};

mergeElements(obsoleteElements);

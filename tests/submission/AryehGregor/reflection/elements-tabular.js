var tabularElements = {
	"table": [
		// Conforming
		"summary",
		// Obsolete
		"align", "bgColor", "border", "cellPadding", "cellSpacing", "frame", "rules", "width",
	],
	"caption": [
		// Obsolete
		"align"
	],
	"colgroup": ["span"],
	"col": [
		// Conforming
		"span",
		// Obsolete
		"align", "width", "ch", "chOff", "vAlign",
	],
	"tbody": [/* Obsolete */ "align", "ch", "chOff", "vAlign"],
	"thead": [/* Obsolete */ "align", "ch", "chOff", "vAlign"],
	"tfoot": [/* Obsolete */ "align", "ch", "chOff", "vAlign"],
	"tr": [/* Obsolete */ "align", "bgColor", "ch", "chOff", "vAlign"],
	"td": [
		// Conforming
		"colSpan", "rowSpan", "headers",
		// Obsolete
		"abbr", "align", "axis", "bgColor", "ch", "chOff", "height", "noWrap", "vAlign", "width",
	],
	"th": [
		// Conforming
		// TODO: double-check that the way we're treating missing value
		// defaults is consistent here.  scope has an auto state with no
		// associated keyword, which is the missing value default -- is this
		// the right syntax for that?
		[{type: "enum", keywords: ["row", "col", "rowgroup", "colgroup"]}, "scope"],
		"colSpan", "rowSpan", "headers",
		// Obsolete
		"abbr", "align", "axis", "bgColor", "ch", "chOff", "height", "noWrap", "vAlign", "width",
	],
};

mergeElements(tabularElements);

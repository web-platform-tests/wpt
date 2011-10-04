var tabularElements = {
	table: {
		// Conforming
		summary: "string",

		// Obsolete
		align: "string",
		border: "string",
		frame: "string",
		rules: "string",
		width: "string",
		bgColor: {type: "string", treatNullAsEmptyString: true},
		cellPadding: {type: "string", treatNullAsEmptyString: true},
		cellSpacing: {type: "string", treatNullAsEmptyString: true},
	},
	caption: {
		// Obsolete
		align: "string",
	},
	colgroup: {
		span: "limited unsigned long",
	},
	col: {
		// Conforming
		span: "limited unsigned long",

		// Obsolete
		align: "string",
		width: "string",
		ch: {type: "string", domAttrName: "char"},
		chOff: {type: "string", domAttrName: "charoff"},
		vAlign: "string",
	},
	tbody: {
		// Obsolete
		align: "string",
		ch: {type: "string", domAttrName: "char"},
		chOff: {type: "string", domAttrName: "charoff"},
		vAlign: "string",
	},
	thead: {
		// Obsolete
		align: "string",
		ch: {type: "string", domAttrName: "char"},
		chOff: {type: "string", domAttrName: "charoff"},
		vAlign: "string",
	},
	tfoot: {
		// Obsolete
		align: "string",
		ch: {type: "string", domAttrName: "char"},
		chOff: {type: "string", domAttrName: "charoff"},
		vAlign: "string",
	},
	tr: {
		// Obsolete
		align: "string",
		ch: {type: "string", domAttrName: "char"},
		chOff: {type: "string", domAttrName: "charoff"},
		vAlign: "string",
		bgColor: {type: "string", treatNullAsEmptyString: true},
	},
	td: {
		// Conforming
		colSpan: "unsigned long",
		rowSpan: "unsigned long",
		headers: "settable tokenlist",

		// Obsolete
		abbr: "string",
		align: "string",
		axis: "string",
		height: "string",
		width: "string",
		ch: {type: "string", domAttrName: "char"},
		chOff: {type: "string", domAttrName: "charoff"},
		noWrap: "boolean",
		vAlign: "string",
		bgColor: {type: "string", treatNullAsEmptyString: true},
	},
	th: {
		// Conforming
		// TODO: double-check that the way we're treating missing value
		// defaults is consistent here.  scope has an auto state with no
		// associated keyword, which is the missing value default -- is this
		// the right syntax for that?
		scope: {type: "enum", keywords: ["row", "col", "rowgroup", "colgroup"]},
		colSpan: "unsigned long",
		rowSpan: "unsigned long",
		headers: "settable tokenlist",

		// Obsolete
		abbr: "string",
		align: "string",
		axis: "string",
		bgColor: "string",
		ch: {type: "string", domAttrName: "char"},
		chOff: {type: "string", domAttrName: "charoff"},
		height: "string",
		noWrap: "boolean",
		vAlign: "string",
		width: "string",
	},
};

mergeElements(tabularElements);

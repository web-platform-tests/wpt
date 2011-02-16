var formElements = {
	// TODO: action is special
	"form": ["autocomplete", "name", "acceptCharset", /*"action",*/ "method", "enctype", "encoding", "target", "noValidate"],
	"fieldset": ["name", "disabled"],
	"legend": [/* Obsolete */ "align"],
	"label": ["htmlFor"],
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
	// TODO: formAction is special
	"button": [["string", "value"], ["enum", "type", {"values": ["submit", "reset", "button"], "missing": "submit"}], /*"formAction",*/ "formEnctype", "formMethod", "formNoValidate", "formTarget", "autofocus", "name", "disabled"],
	"select": ["multiple", ["limited unsigned long", "size", 0], "autofocus", "name", "disabled"],
	"datalist": [],
	"optgroup": ["disabled", "label"],
	"option": ["disabled", "label", "defaultSelected"],
	"textarea": ["cols", "placeholder", "required", "rows", "wrap",
		"maxLength", "readOnly", "autofocus", "name", "disabled", "dirname"],
	"keygen": ["challenge", "keytype", "autofocus", "name", "disabled"],
	// TODO: Add htmlFor as a settable tokenlist, but the syntax doesn't
	// support this right now . . .
	"output": [/*"htmlFor",*/ "name"],
	"progress": [["double", "max", 1]],
	"meter": [["double", "min"], ["double", "max"], ["double", "low"], ["double", "high"], ["double", "optimum"]],
};

mergeElements(formElements);

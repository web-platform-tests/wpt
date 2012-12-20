var formElements = {
	form: {
		autocomplete: {type: "enum", keywords: ["on", "off"], defaultVal: "on"},
		name: "string",
		acceptCharset: {type: "string", domAttrName: "accept-charset"},
		// TODO: action is special
		// action: "url",
		method: {type: "enum", keywords: ["get", "post"], defaultVal: "get"},
		enctype: {type: "enum", keywords: ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"], defaultVal: "application/x-www-form-urlencoded"},
		encoding: {type: "enum", keywords: ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"], defaultVal: "application/x-www-form-urlencoded", domAttrName: "enctype"},
		target: "string",
		noValidate: "boolean",
	},
	fieldset: {
		name: "string",
		disabled: "boolean",
	},
	legend: {
		// Obsolete
		align: "string",
	},
	label: {
		htmlFor: {type: "string", domAttrName: "for"},
	},
	input: {
		// Conforming
		accept: "string",
		alt: "string",
		// TODO: autocomplete for input is different from form; this requires
		// implementing a notion of "state with no associated keyword" for
		// enums.
		// autocomplete: {type: "enum", keywords: ["on", "off"], defaultVal: "on"},
		max: "string",
		min: "string",
		multiple: "boolean",
		pattern: "string",
		placeholder: "string",
		required: "boolean",
		src: "url",
		size: {type: "limited unsigned long", defaultVal: 20},
		step: "string",
		maxLength: "limited long",
		readOnly: "boolean",
		defaultChecked: {type: "boolean", domAttrName: "checked"},
		defaultValue: {type: "string", domAttrName: "value"},
		type: {type: "enum", keywords: ["hidden", "text", "search", "tel",
			"url", "email", "password", "datetime", "date", "month", "week",
			"time", "datetime-local", "number", "range", "color", "checkbox",
			"radio", "file", "submit", "image", "reset", "button"], defaultVal:
			"text"},
		// TODO: formAction is special
		// formAction: "url",
		formEnctype: {type: "enum", keywords: ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"], defaultVal: "application/x-www-form-urlencoded"},
		formMethod: {type: "enum", keywords: ["get", "post"], defaultVal: "get"},
		formNoValidate: "boolean",
		formTarget: "string",
		autofocus: "boolean",
		name: "string",
		disabled: "boolean",
		dirname: "string",

		// Obsolete
		align: "string",
		useMap: "string",
	},
	button: {
		value: "string",
		type: {type: "enum", keywords: ["submit", "reset", "button"], defaultVal: "submit"},
		// TODO: formAction is special
		// formAction: "url",
		formEnctype: {type: "enum", keywords: ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"], defaultVal: "application/x-www-form-urlencoded"},
		formMethod: {type: "enum", keywords: ["get", "post"], defaultVal: "get"},
		formNoValidate: "boolean",
		formTarget: "string",
		autofocus: "boolean",
		name: "string",
		disabled: "boolean",
	},
	select: {
		multiple: "boolean",
		size: {type: "unsigned long", defaultVal: 0},
		autofocus: "boolean",
		name: "string",
		disabled: "boolean",
	},
	datalist: {},
	optgroup: {
		disabled: "boolean",
		label: "string",
	},
	option: {
		disabled: "boolean",
		defaultSelected: {type: "boolean", domAttrName: "selected"},
	},
	textarea: {
		cols: {type: "limited unsigned long", defaultVal: 20},
		placeholder: "string",
		required: "boolean",
		rows: {type: "limited unsigned long", defaultVal: 2},
		wrap: "string",
		maxLength: "limited long",
		readOnly: "boolean",
		autofocus: "boolean",
		name: "string",
		disabled: "boolean",
		dirname: "string",
	},
	keygen: {
		challenge: "string",
		// The invalid value default is the "unknown" state, which for our
		// purposes  seems to be the same as having no invalid value default.
		// The missing  value default depends on whether "rsa" is implemented,
		// so we use null,  which is magically reserved for "don't try testing
		// this", since no one  default is required.  (TODO: we could test that
		// it's either the RSA  state or the unknown state.)
		keytype: {type: "enum", keywords: ["rsa"], defaultVal: null},
		autofocus: "boolean",
		name: "string",
		disabled: "boolean",
	},
	output: {
		// TODO: Add htmlFor as a settable tokenlist, but the syntax doesn't
		// support this right now . . .
		// htmlFor: "settable tokenlist",
		name: "string",
	},
	progress: {
		max: {type: "double", defaultVal: 1},
	},
	meter: {
		min: "double",
		max: "double",
		low: "double",
		high: "double",
		optimum: "double",
	},
};

mergeElements(formElements);

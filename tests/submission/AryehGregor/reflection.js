var start = new Date().getTime();
var passed = document.getElementById("passed");
var failed = document.getElementById("failed");

/**
 * If question === answer, output a success, else report a failure with the
 * given description.  Currently success and failure both increment counters,
 * and failures output a message to a <ul>.  Which <ul> is decided by the type
 * parameter -- different attribute types are separated for readability.
 */
function test(expected, actual, description) {
	if (expected === actual) {
		increment(passed);
		return true;
	} else {
		increment(failed);
		reportFailure(description + ' (expected ' + stringRep(actual) + ', got ' + stringRep(expected) + ')');
		return false;
	}
}

var currentTestInfo = {};
/**
 * Report a failure with the given description, adding context from the
 * currentTestInfo global.
 */
function reportFailure(description) {
	var domNode = currentTestInfo.domObj.tagName.toLowerCase();
	var idlNode = currentTestInfo.idlObj.nodeName.toLowerCase();
	var domName = currentTestInfo.domName;
	var idlName = currentTestInfo.idlName;
	var comment = currentTestInfo.data.comment;
	var typeDesc = idlNode + "." + idlName;
	if (!comment && (domNode != idlNode || domName != idlName)) {
		comment = "<" + domNode + " " + domName + ">";
	}
	if (comment) {
		typeDesc += " (" + comment + ")";
	}
	typeDesc = typeDesc.replace("&", "&amp;").replace("<", "&lt;");
	description = description.replace("&", "&amp;").replace("<", "&lt;");

	var type = currentTestInfo.data.type;

	// Special case for undefined attributes, which we don't want getting in
	// the way of everything else.
	if (description.search('^typeof IDL attribute \\(expected ".*", got "undefined"\\)$') != -1) {
		type = "undefined";
	}

	var done = false;
	var ul = document.getElementById("errors-" + type.replace(" ", "-"));
	if (ul === null) {
		ul = document.createElement("ul");
		ul.id = "errors-" + type.replace(" ", "-");
		var div = document.getElementById("errors");
		p = document.createElement("p");
		if (type == "undefined") {
			div.parentNode.insertBefore(ul, div.nextSibling);
			p.innerHTML = "These IDL attributes were of undefined type, presumably representing unimplemented features (cordoned off into a separate section for tidiness):";
		} else {
			div.appendChild(ul);
			p.innerHTML = "Errors for type " + type + ":";
		}
		ul.parentNode.insertBefore(p, ul);
	} else if (type != "undefined") {
		var existingErrors = ul.getElementsByClassName("desc");
		for (var i = 0; i < existingErrors.length; i++) {
			if (existingErrors[i].innerHTML == description) {
				var typeSpan = existingErrors[i].parentNode.getElementsByClassName("type")[0];
				// Check if we have lots of the same error for the same
				// attribute.  If so, we want to collapse them -- the exact
				// elements that exhibit the error aren't going to be important
				// to report in this case, and it can take a lot of space if
				// there's an error in a global attribute like dir or id.
				var types = typeSpan.innerHTML.split(", ");
				var count = 0;
				for (var i = 0; i < types.length; i++) {
					if (types[i].search("^\\([0-9]* elements\\)\\." + idlName + "$") != -1) {
						types[i] = "(" + (1 + parseInt(/[0-9]+/.exec(types[i])[0])) + " elements)." + idlName;
						typeSpan.innerHTML = types.join(", ");
						return;
					} else if (types[i].search("\\." + idlName + "$") != -1) {
						count++;
					}
				}
				if (comment || count < 10) {
					// Just add the extra error to the end, not many duplicates
					// (or we have a comment)
					typeSpan.innerHTML += ", " + typeDesc;
				} else {
					var filteredTypes = types.filter(function(type) { return type.search("\\." + idlName + "$") == -1; });
					if (filteredTypes.length) {
						typeSpan.innerHTML = filteredTypes.join(", ") + ", ";
					} else {
						typeSpan.innerHTML = "";
					}
					typeSpan.innerHTML += "(" + (types.length - filteredTypes.length) + " elements)." + idlName;
				}
				return;
			}
		}
	}

	if (type == "undefined") {
		ul.innerHTML += "<li>" + typeDesc;
	} else {
		ul.innerHTML += "<li><span class=\"type\">" + typeDesc + "</span>: <span class=\"desc\">" + description + "</span>";
	}
}

/**
 * Returns a string representing val.  Basically just adds quotes for strings,
 * and passes through other recognized types literally.
 */
function stringRep(val) {
	if (val === null) {
		// typeof is object, so the switch isn't useful
		return "null";
	}
	switch (typeof val) {
		case "string":
			return '"' + val.replace('"', '\\"') + '"';
		case "boolean":
		case "undefined":
		case "number":
			return val + "";
		default:
			return typeof val + ' "' + val + '"';
	}
}

/**
 * Shorthand function for when we have a failure outside of test().  Generally
 * used when the failure is an exception thrown unexpectedly or such, something
 * not equality-based.
 */
function failure(message) {
	increment(failed);
	reportFailure(message);
}

/**
 * Increment the count in either "passed" or "failed".  el should always be one
 * of those two variables.  The implementation of this function amuses me.
 */
function increment(el) {
	el.innerHTML = parseInt(el.innerHTML) + 1;
	var percent = document.getElementById("percent");
	var passed = document.getElementById("passed");
	var failed = document.getElementById("failed");
	percent.innerHTML = (parseInt(passed.innerHTML)/(parseInt(passed.innerHTML) + parseInt(failed.innerHTML))*100).toPrecision(3);
}

/**
 * Hide all displayed errors matching a given regex, so it's easier to filter
 * out repetitive failures.  TODO: Fix this so it works right with the new
 * "lump many errors in one <li>" thing.
 */
function maskErrors(regex) {
	var uls = document.getElementsByTagName("ul");
	for (var i = 0; i < uls.length; i++) {
		var lis = uls[i].children;
		for (var j = 0; j < lis.length; j++) {
			if (regex !== "" && lis[j].innerHTML.match(regex)) {
				lis[j].style.display = "none";
			} else {
				lis[j].style.display = "list-item";
			}
		}
	}
}

/**
 * General format of reflects*() functions: tests whether on elementName, the
 * DOM attribute domAttrName is reflected by the IDL attribute idlAttrName.
 * idlAttrName can be undefined if it's the same as domAttrName.  These
 * functions are where all the important stuff happens.
 */

/**
 * Array containing the tests and other information for each type of reflected
 * attribute.  Meaning of keys:
 *
 *   "jsType": What typeof idlObj[idlName] is supposed to be.
 *   "defaultVal": The default value to be returned if the attribute is not
 *       present and no default is specifically set for this attribute.
 *   "domTests": What values to test with setAttribute().
 *   "domExpected": What values to expect with IDL get after setAttribute().
 *       Defaults to the same as domTests.
 *   "idlTests": What values to test with IDL set.  Defaults to domTests.
 *   "idlDomExpected": What to expect from getAttribute() after IDL set.
 *       Defaults to idlTests.
 *   "idlIdlExpected": What to expect from IDL get after IDL set.  Defaults to
 *       idlDomExpected.
 *
 * Note that all tests/expected values are only baselines, and can be expanded
 * with additional tests hardcoded into the function for particular types if
 * necessary (e.g., enum).  null means "default" as a DOM expected value, and
 * "throw an INDEX_SIZE_ERR exception" as an IDL expected value.  (This is a
 * kind of stupid and fragile convention, but it's simple and works for now.)
 * Expected DOM values are cast to strings by adding "".
 */
var typeMap = {
	"string": {
		"jsType": "string",
		"defaultVal": "",
		/**
		 * "If a reflecting IDL attribute is a DOMString but doesn't fall into
		 * any of the above categories, then the getting and setting must be
		 * done in a transparent, case-preserving manner."
		 */
		"domTests": ["", "abc 123 !!!"],
	},
	/**
	 * "If a reflecting IDL attribute is a DOMString attribute whose content
	 * attribute is defined to contain a URL, then on getting, the IDL
	 * attribute must resolve the value of the content attribute relative to
	 * the element and return the resulting absolute URL if that was
	 * successful, or the empty string otherwise; and on setting, must set the
	 * content attribute to the specified literal value. If the content
	 * attribute is absent, the IDL attribute must return the default value, if
	 * the content attribute has one, or else the empty string."
	 */
	"url": {
		"jsType": "string",
		"defaultVal": "",
		"domTests": ["", "foo", "http://site.example/", "//site.example/path???@#l"],
		// Expected values set below programmatically, for maintainability
	},
	/**
	 * "If a reflecting IDL attribute is a DOMString attribute whose content
	 * attribute is defined to contain one or more URLs, then on getting, the
	 * IDL attribute must split the content attribute on spaces and return the
	 * concatenation of resolving each token URL to an absolute URL relative to
	 * the element, with a single U+0020 SPACE character between each URL,
	 * ignoring any tokens that did not resolve successfully. If the content
	 * attribute is absent, the IDL attribute must return the default value, if
	 * the content attribute has one, or else the empty string. On setting, the
	 * IDL attribute must set the content attribute to the specified literal
	 * value."
	 *
	 * Seems to only be used for ping.
	 */
	"urls": {
		"jsType": "string",
		"defaultVal": "",
		"domTests": ["", "foo   ", "http://site.example/ foo  bar   baz", "//site.example/path???@#l"],
		// Expected values set below programmatically
	},
	/**
	 * "If a reflecting IDL attribute is a DOMString whose content attribute is
	 * an enumerated attribute, and the IDL attribute is limited to only known
	 * values, then, on getting, the IDL attribute must return the conforming
	 * value associated with the state the attribute is in (in its canonical
	 * case), or the empty string if the attribute is in a state that has no
	 * associated keyword value; and on setting, if the new value is an ASCII
	 * case-insensitive match for one of the keywords given for that attribute,
	 * then the content attribute must be set to the conforming value
	 * associated with the state that the attribute would be in if set to the
	 * given new value, otherwise, if the new value is the empty string, then
	 * the content attribute must be removed, otherwise, the content attribute
	 * must be set to the given new value."
	 *
	 * "Some attributes are defined as taking one of a finite set of keywords.
	 * Such attributes are called enumerated attributes. The keywords are each
	 * defined to map to a particular state (several keywords might map to the
	 * same state, in which case some of the keywords are synonyms of each
	 * other; additionally, some of the keywords can be said to be
	 * non-conforming, and are only in the specification for historical
	 * reasons). In addition, two default states can be given. The first is the
	 * invalid value default, the second is the missing value default.
	 *
	 * . . .
	 *
	 * When the attribute is specified, if its value is an ASCII
	 * case-insensitive match for one of the given keywords then that keyword's
	 * state is the state that the attribute represents. If the attribute value
	 * matches none of the given keywords, but the attribute has an invalid
	 * value default, then the attribute represents that state. Otherwise, if
	 * the attribute value matches none of the keywords but there is a missing
	 * value default state defined, then that is the state represented by the
	 * attribute.  Otherwise, there is no default, and invalid values must be
	 * ignored.
	 *
	 * When the attribute is not specified, if there is a missing value default
	 * state defined, then that is the state represented by the (missing)
	 * attribute. Otherwise, the absence of the attribute means that there is
	 * no state represented."
	 *
	 * This is only used for enums that are limited to known values, not other
	 * enums (those are treated as generic strings by the spec).  The data
	 * object passed to reflects() can contain these keys:
	 *
	 *   "defaultVal": missing value default (defaults to "")
	 *   "invalidVal": invalid value default (defaults to defaultVal)
	 *   "keywords": array of keywords as given by the spec (required)
	 *   "noncanon": dictionary mapping non-canonical values to their
	 *     canonical equivalents (defaults to {})
	 *
	 * Tests are mostly hardcoded into reflects(), since they depend on the
	 * keywords.  All expected values are computed in reflects() using a helper
	 * function.
	 */
	"enum": {
		"jsType": "string",
		"defaultVal": "",
		"domTests": ["", "abc 123 !!!"],
	},
	/**
	 * "If a reflecting IDL attribute is a boolean attribute, then on getting
	 * the IDL attribute must return true if the content attribute is set, and
	 * false if it is absent. On setting, the content attribute must be removed
	 * if the IDL attribute is set to false, and must be set to the empty
	 * string if the IDL attribute is set to true. (This corresponds to the
	 * rules for boolean content attributes.)"
	 */
	"boolean": {
		"jsType": "boolean",
		"defaultVal": false,
		"domTests": ["", "abc 123 !!!"],
		"domExpected": [true, true],
		"idlTests": [true, false],
		// There's a special case for setting to false
		"idlDomExpected": [""],
		"idlIdlExpected": [true, false],
	},
	/**
	 * "If a reflecting IDL attribute is a signed integer type (long) then, on
	 * getting, the content attribute must be parsed according to the rules for
	 * parsing signed integers, and if that is successful, and the value is in
	 * the range of the IDL attribute's type, the resulting value must be
	 * returned. If, on the other hand, it fails or returns an out of range
	 * value, or if the attribute is absent, then the default value must be
	 * returned instead, or 0 if there is no default value. On setting, the
	 * given value must be converted to the shortest possible string
	 * representing the number as a valid integer and then that string must be
	 * used as the new content attribute value."
	 */
	"long": {
		"jsType": "number",
		"defaultVal": 0,
		"domTests":    [-36, -1, 0, 1, 2147483647, -2147483648, 2147483648, -2147483649],
		"domExpected": [-36, -1, 0, 1, 2147483647, -2147483648, null,       null],
		"idlTests":       [-36, -1, 0, 1, 2147483647, -2147483648],
		"idlDomExpected": [-36, -1, 0, 1, 2147483647, -2147483648],
	},
	/**
	 * "If a reflecting IDL attribute is a signed integer type (long) that is
	 * limited to only non-negative numbers then, on getting, the content
	 * attribute must be parsed according to the rules for parsing non-negative
	 * integers, and if that is successful, and the value is in the range of
	 * the IDL attribute's type, the resulting value must be returned. If, on
	 * the other hand, it fails or returns an out of range value, or if the
	 * attribute is absent, the default value must be returned instead, or −1
	 * if there is no default value. On setting, if the value is negative, the
	 * user agent must fire an INDEX_SIZE_ERR exception. Otherwise, the given
	 * value must be converted to the shortest possible string representing the
	 * number as a valid non-negative integer and then that string must be used
	 * as the new content attribute value."
	 */
	"limited long": {
		"jsType": "number",
		"defaultVal": -1,
		"domTests":    [-2147483649, -2147483648, -36,  -1,   0, 1, 2147483647, 2147483648],
		"domExpected": [null,        null,        null, null, 0, 1, 2147483647, null],
		"idlTests":       [-2147483648, -36,  -1,   0, 1, 2147483647],
		"idlDomExpected": [null,        null, null, 0, 1, 2147483647],
	},
	/**
	 * "If a reflecting IDL attribute is an unsigned integer type (unsigned
	 * long) then, on getting, the content attribute must be parsed according
	 * to the rules for parsing non-negative integers, and if that is
	 * successful, and the value is in the range of the IDL attribute's type,
	 * the resulting value must be returned. If, on the other hand, it fails or
	 * returns an out of range value, or if the attribute is absent, the
	 * default value must be returned instead, or 0 if there is no default
	 * value. On setting, the given value must be converted to the shortest
	 * possible string representing the number as a valid non-negative integer
	 * and then that string must be used as the new content attribute value."
	 */
	"unsigned long": {
		"jsType": "number",
		"defaultVal": 0,
		"domTests":    [-2147483649, -2147483648, -36,  -1,   0, 1, 257, 2147483647, 2147483648, 4294967295, 4294967296],
		"domExpected": [null,        null,        null, null, 0, 1, 257, 2147483647, null,       null,       null],
		"idlTests": [0, 1, 257, 2147483647],
	},
	/**
	 * "If a reflecting IDL attribute is an unsigned integer type (unsigned
	 * long) that is limited to only non-negative numbers greater than zero,
	 * then the behavior is similar to the previous case, but zero is not
	 * allowed. On getting, the content attribute must first be parsed
	 * according to the rules for parsing non-negative integers, and if that is
	 * successful, and the value is in the range of the IDL attribute's type,
	 * the resulting value must be returned. If, on the other hand, it fails or
	 * returns an out of range value, or if the attribute is absent, the
	 * default value must be returned instead, or 1 if there is no default
	 * value. On setting, if the value is zero, the user agent must fire an
	 * INDEX_SIZE_ERR exception. Otherwise, the given value must be converted
	 * to the shortest possible string representing the number as a valid
	 * non-negative integer and then that string must be used as the new
	 * content attribute value."
	 */
	"limited unsigned long": {
		"jsType": "number",
		"defaultVal": 1,
		"domTests":    [-2147483649, -2147483648, -36,  -1,   0,    1, 2147483647, 2147483648, 4294967295, 4294967296],
		"domExpected": [null,        null,        null, null, null, 1, 2147483647, null,       null,       null],
		"idlTests":       [0,    1, 2147483647],
		"idlDomExpected": [null, 1, 2147483647],
	},
};
typeMap.url.domExpected = typeMap.url.domTests.map(resolveUrl);
typeMap.url.idlIdlExpected = typeMap.url.domExpected;
typeMap.urls.domExpected = typeMap.urls.domTests.map(function(urls) {
	var expected = "";
	// TODO: Test other whitespace?
	var split = urls.split(" ");
	for (var j = 0; j < split.length; j++) {
		if (split[j] == "") {
			continue;
		}
		var append = resolveUrl(split[j]);
		if (append == "") {
			continue;
		}
		if (expected == "") {
			expected = append;
		} else {
			expected += " " + append;
		}
	}
	return expected;
});
typeMap.urls.idlDomExpected = typeMap.urls.domExpected;

for (var type in typeMap) {
	if (typeMap[type].domExpected === undefined) {
		typeMap[type].domExpected = typeMap[type].domTests;
	}
	if (typeMap[type].idlTests === undefined) {
		typeMap[type].idlTests = typeMap[type].domTests;
	}
	if (typeMap[type].idlDomExpected === undefined) {
		typeMap[type].idlDomExpected = typeMap[type].idlTests;
	}
	if (typeMap[type].idlIdlExpected === undefined) {
		typeMap[type].idlIdlExpected = typeMap[type].idlDomExpected;
	}
}

/**
 * Tests that the JavaScript attribute named idlName on the object idlObj
 * reflects the DOM attribute named domName on domObj.  The data argument is an
 * object that must contain at least one key, "type", which contains the
 * expected type of the IDL attribute ("string", "enum", etc.).  The "comment"
 * key will add a parenthesized comment in the type info if there's a test
 * failure, to indicate that there's something special about the element you're
 * testing (like it has an attribute set to some value).  Other keys in the
 * data object are type-specific, e.g., "defaultVal" for numeric types.  If the
 * data object is a string, it's converted to {"type": data}.  If idlObj is a
 * string, we set idlObj = domObj = document.createElement(idlObj).
 */
function reflects(data, idlName, idlObj, domName, domObj) {
	if (typeof data == "string") {
		data = {"type": data};
	}
	if (domName === undefined) {
		domName = idlName;
	}
	if (idlName === undefined) {
		// The legacy functions take idlName first, so this is more common than
		// the previous . . . TODO fix this once the rewrite is done.
		idlName = domName;
	}
	if (typeof idlObj == "string") {
		idlObj = document.createElement(idlObj);
	}
	if (domObj === undefined) {
		domObj = idlObj;
	}

	// If we don't recognize the type, testing is impossible.
	if (typeMap[data.type] === undefined) {
		return;
	}

	var typeInfo = typeMap[data.type];
	// Note: probably a hack?  This kind of assumes that the variables here
	// won't change over the course of the tests, which is wrong, but it's
	// probably safe enough.  Just don't read stuff that will change.
	currentTestInfo = {"data": data, "idlName": idlName, "idlObj": idlObj, "domName": domName, "domObj": domObj};

	// Test that typeof idlObj[idlName] is correct.  If not, further tests are
	// probably pointless, so bail out.
	if (!test(typeof idlObj[idlName], typeInfo.jsType, "typeof IDL attribute")) {
		return;
	}

	// Test default
	var defaultVal = data.defaultVal;
	if (defaultVal === undefined) {
		defaultVal = typeInfo.defaultVal;
	}
	if (defaultVal !== null) {
		test(idlObj[idlName], defaultVal, "IDL get with DOM attribute unset");
	}

	var domTests = typeInfo.domTests.slice(0);
	var domExpected = typeInfo.domExpected.map(function(val) { return val === null ? defaultVal : val; });
	var idlTests = typeInfo.idlTests.slice(0);
	var idlDomExpected = typeInfo.idlDomExpected.slice(0);
	var idlIdlExpected = typeInfo.idlIdlExpected.slice(0);
	switch (data.type) {
		// Extra tests and other special-casing
		case "boolean":
		domTests.push(domName);
		domExpected.push(true);
		break;

		case "enum":
		// Whee, enum is complicated.
		if (typeof data.invalidVal == "undefined") {
			data.invalidVal = defaultVal;
		}
		if (typeof data.nonCanon == "undefined") {
			data.nonCanon = {};
		}
		for (var i = 0; i < data.keywords.length; i++) {
			domTests.push(data.keywords[i], "x" + data.keywords[i]);
			idlTests.push(data.keywords[i], "x" + data.keywords[i]);

			if (data.keywords[i].length > 1) {
				domTests.push(data.keywords[i].slice(1));
				idlTests.push(data.keywords[i].slice(1));
			}

			if (data.keywords[i] != data.keywords[i].toLowerCase()) {
				domTests.push(data.keywords[i].toLowerCase());
				idlTests.push(data.keywords[i].toLowerCase());
			}
			if (data.keywords[i] != data.keywords[i].toUpperCase()) {
				domTests.push(data.keywords[i].toUpperCase());
				idlTests.push(data.keywords[i].toUpperCase());
			}
		}

		// Per spec, the expected DOM values are the same as the value we set
		// it to.
		idlDomExpected = idlTests.slice(0);

		// Now we have the fun of calculating what the expected IDL values are.
		domExpected = [];
		idlIdlExpected = [];
		for (var i = 0; i < domTests.length; i++) {
			domExpected.push(enumExpected(data.keywords, data.nonCanon, data.invalidVal, domTests[i]));
		}
		for (var i = 0; i < idlTests.length; i++) {
			idlIdlExpected.push(enumExpected(data.keywords, data.nonCanon, data.invalidVal, idlTests[i]));
		}
		break;
	}
	if (domObj.tagName.toLowerCase() == "canvas" && (domName == "width" || domName == "height")) {
		// Opera tries to allocate a canvas with the given width and height, so
		// it OOMs when given excessive sizes.  This is permissible under the
		// hardware-limitations clause, so cut out those checks.  TODO: Must be
		// a way to make this more succinct.
		domTests = domTests.filter(function(element, index, array) { return element < 1000; });
		domExpected = domExpected.filter(function(element, index, array) { return element < 1000; });
		idlTests = idlTests.filter(function(element, index, array) { return element < 1000; });
		idlDomExpected = idlDomExpected.filter(function(element, index, array) { return element < 1000; });
		idlIdlExpected = idlIdlExpected.filter(function(element, index, array) { return element < 1000; });
	}

	for (var i = 0; i < domTests.length; i++) {
		if (domExpected[i] === null) {
			// If you follow all the complicated logic here, you'll find that
			// this will only happen if there's no expected value at all (like
			// for tabIndex, where the default is too complicated).  So skip
			// the test.
			continue;
		}
		try {
			domObj.setAttribute(domName, domTests[i]);
			// setAttribute() followed by getAttribute() should always return
			// the same thing.  We could test this more extensively (without
			// regard for type), but it's really not an HTML5 thing, so this is
			// more of a sanity check to signal trouble in case things go wrong
			// in the IDL get.
			test(domObj.getAttribute(domName), domTests[i] + "", "setAttribute() to " + stringRep(domTests[i]) + " followed by getAttribute()");
			test(idlObj[idlName], domExpected[i], "setAttribute() to " + stringRep(domTests[i]) + " followed by IDL get");
			increment(passed);
		} catch (err) {
			failure("Exception thrown during tests with setAttribute() to " + stringRep(domTests[i]));
		}
	}

	for (var i = 0; i < idlTests.length; i++) {
		try {
			idlObj[idlName] = idlTests[i];
			if (idlDomExpected[i] === null) {
				// This means we expect an INDEX_SIZE_ERR exception, so we
				// shouldn't reach this line.
				failure("No exception thrown during tests with IDL set to " + stringRep(idlTests[i]));
				continue;
			}
			if (data.type == "boolean" && idlTests[i] == false) {
				// Special case yay
				test(domObj.hasAttribute(domName), false, "IDL set to " + stringRep(idlTests[i]) + " followed by hasAttribute()");
			} else if (idlDomExpected[i] !== null) {
				test(domObj.getAttribute(domName), idlDomExpected[i] + "", "IDL set to " + stringRep(idlTests[i]) + " followed by getAttribute()");
			}
			if (idlIdlExpected[i] !== null) {
				test(idlObj[idlName], idlIdlExpected[i], "IDL set to " + stringRep(idlTests[i]) + " followed by IDL get");
			}
			increment(passed);
		} catch (err) {
			if (idlDomExpected[i] === null) {
				if (!(err instanceof DOMException)) {
					failure("Expected DOMException with IDL set to " + stringRep(idlTests[i]) + ", got some other exception");
				} else {
					test(err.code, DOMException.INDEX_SIZE_ERR, "DOMException error code on IDL set to " + stringRep(idlTests[i]));
				}
			} else {
				failure("Exception thrown during tests with IDL set to " + stringRep(idlTests[i]));
			}
		}
	}
}

// Wrappers, to be removed
function reflectsLong(elementName, domAttrName, idlAttrName, defaultValue) {
	reflects({"type": "long", "defaultVal": defaultValue}, idlAttrName, elementName, domAttrName);
}

function reflectsLimitedLong(elementName, domAttrName, idlAttrName, defaultValue) {
	reflects({"type": "limited long", "defaultVal": defaultValue}, idlAttrName, elementName, domAttrName);
}

function reflectsUnsignedLong(elementName, domAttrName, idlAttrName, defaultValue) {
	reflects({"type": "unsigned long", "defaultVal": defaultValue}, idlAttrName, elementName, domAttrName);
}

function reflectsLimitedUnsignedLong(elementName, domAttrName, idlAttrName, defaultValue) {
	reflects({"type": "limited unsigned long", "defaultVal": defaultValue}, idlAttrName, elementName, domAttrName);
}

function reflectsEnum(elementName, domAttrName, idlAttrName, options) {
	reflects({"type": "enum", "defaultVal": options["missing"], "invalidVal": options["invalid"], "nonCanon": options.noncanon, "keywords": options.values}, idlAttrName, elementName, domAttrName);
}

/**
 * Resolve the given URL to an absolute URL, relative to the current document's
 * address.  There's no API that I know of that exposes this directly, so we
 * actually just create an <a> element, set its href, and stitch together the
 * various properties.  Seems to work.  We don't try to reimplement the
 * algorithm here, because we're not concerned with its correctness -- we're
 * only testing HTML reflection, not Web Addresses.
 *
 * Return "" if the URL couldn't be resolved, since this is really for
 * reflected URL attributes, and those are supposed to return "" if the URL
 * couldn't be resolved.
 */
function resolveUrl(url) {
	var el = document.createElement("a");
	el.href = url;
	var ret = el.protocol + "//" + el.host + el.pathname + el.search + el.hash;
	if (ret == "//") {
		return "";
	} else {
		return ret;
	}
}

/**
 * If we have an enumerated attribute limited to the array of values in
 * keywords, with nonCanon being a map of non-canonical values to their
 * canonical equivalents, and invalidVal being the invalid value default (or ""
 * for none), then what would we expect from an IDL get if the content
 * attribute is equal to contentVal?
 */
function enumExpected(keywords, nonCanon, invalidVal, contentVal) {
	var ret = invalidVal;
	for (var i = 0; i < keywords.length; i++) {
		if (contentVal.toLowerCase() == keywords[i].toLowerCase()) {
			ret = keywords[i];
			break;
		}
	}
	if (typeof nonCanon[ret] != "undefined") {
		return nonCanon[ret];
	}
	return ret;
}

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
var elements = {
	"a": [
		// Conforming
		"target", "ping", "rel", "media", "hreflang", "type", "rel", "relList",
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
	"button": [["string", "value"], ["enum", "type", {"values": ["submit", "reset", "button"], "missing": "submit"}], "formAction", "formEnctype", "formMethod", "formNoValidate", "formTarget"],
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
	"fieldset": [],
	"figcaption": [],
	"figure": [],
	"footer": [],
	"form": ["autocomplete", "name", "acceptCharset", "action", "method", "enctype", "encoding", "target", "noValidate"],
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
		"accept", "alt", "autocomplete", "max", "min", "multiple", "pattern",
		"placeholder", "required", "src", ["limited unsigned long", "size", 20],
		"step", "maxLength", "readOnly", "defaultChecked", "defaultValue",
		["enum", "type", {"values": ["hidden", "text", "search", "tel", "url",
			"email", "password", "datetime", "date", "month", "week", "time",
			"datetime-local", "number", "range", "color", "checkbox", "radio",
			"file", "submit", "image", "reset", "button"], "missing": "text"},
		"formAction", "formEnctype", "formMethod", "formNoValidate",
		"formTarget"],
		// Obsolete
		"align", "useMap",
	],
	"ins": ["cite", "dateTime"],
	"kbd": [],
	"keygen": ["challenge", "keytype"],
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
	"output": [/*"htmlFor"*/],
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
	"script": ["src", "type", "charset", "async", "defer"],
	"section": [],
	"select": ["multiple", ["limited unsigned long", "size"]],
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
	"textarea": ["cols", "placeholder", "required", "rows", "wrap", "maxLength", "readOnly"],
	"tfoot": [/* Obsolete */ "align", "ch", "chOff", "vAlign"],
	"th": [
		// Conforming
		"scope", "colSpan", "rowSpan", "headers",
		// Obsolete
		"abbr", "align", "axis", "bgColor", "ch", "chOff", "height", "noWrap", "vAlign", "width",
	],
	"thead": [/* Obsolete */ "align", "ch", "chOff", "vAlign"],
	"time": ["dateTime", "pubDate"],
	"title": [],
	"tr": [/* Obsolete */ "align", "bgColor", "ch", "chOff", "vAlign"],
	"track": ["kind", "label", "src", "srclang"],
	"ul": [/* Obsolete */ "compact", "type"],
	"var": [],
	"video": ["poster", "src", "preload", "loop", "autoplay", "controls", ["unsigned long", "height"], ["unsigned long", "width"]],
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
// Add form-associated attributes programmatically to avoid lots of duplication.
var formAssociated = ["button", "fieldset", "input", "keygen", "label", "meter", "object", "output", "progress", "select", "textarea"];
for (var i = 0; i < formAssociated.length; i++) {
	elements[formAssociated[i]] = elements[formAssociated[i]].concat("name", "disabled", "autofocus");
}
/**
 * Maps an IDL attribute name to its type.  If the IDL attribute name differs
 * from the content attribute name, a two-element array of ["type", "content
 * attribute name"] is used.  This format is also necessary for enums limited
 * to only known values, since otherwise the array value would be ambiguous.
 * If the type is "string", the entry can just be omitted from the array.
 */
var attribs = {
	"acceptCharset": ["string", "accept-charset"],
	"action": "url",
	"formAction": "url",
	"async": "boolean",
	"autocomplete": ["enum", "autocomplete", {"values": ["on", "off"], "missing": "on"}],
	"autofocus": "boolean",
	"autoplay": "boolean",
	"cite": "url",
	"cols": ["limited unsigned long", "cols", 20],
	"colSpan": "unsigned long",
	"controls": "boolean",
	"data": "url",
	"defaultChecked": ["boolean", "checked"],
	"defaultValue": ["string", "value"],
	"defaultSelected": ["boolean", "selected"],
	"defer": "boolean",
	"disabled": "boolean",
	"encoding": ["enum", "enctype", {"values": ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"], "missing": "application/x-www-form-urlencoded"}],
	"enctype": ["enum", "enctype", {"values": ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"], "missing": "application/x-www-form-urlencoded"}],
	"formEnctype": ["enum", "formEnctype", {"values": ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"], "missing": "application/x-www-form-urlencoded"}],
	"headers": "settable tokenlist",
	"htmlFor": ["string", "for"],
	"httpEquiv": ["string", "http-equiv"],
	"href": "url",
	"isMap": "boolean",
	// The invalid value default is the "unknown" state, which for our purposes
	// seems to be the same as having no invalid value default.  The missing
	// value default depends on whether "rsa" is implemented, so we use null,
	// which is magically reserved for "don't try testing this", since no one
	// default is required.  (TODO: we could test that it's either the RSA
	// state or the unknown state.)
	"keytype": ["enum", "keytype", {"values": ["rsa"], "missing": null}],
	"kind": ["enum", "kind", {"values": ["subtitles", "captions", "descriptions", "chapters", "metadata"], "missing": "captions"}],
	"loop": "boolean",
	"maxLength": "limited long",
	"method": ["enum", "method", {"values": ["get", "post"], "missing": "get"}],
	"formMethod": ["enum", "formMethod", {"values": ["get", "post"], "missing": "get"}],
	"multiple": "boolean",
	"noValidate": "boolean",
	"formNoValidate": "boolean",
	"open": "boolean",
	"ping": "urls",
	"poster": "url",
	// As with "keytype", we have no missing value default defined here.
	"preload": ["enum", "preload", {"values": ["none", "metadata", "auto"], "noncanon": {"": "auto"}, "missing": null}],
	"pubDate": "boolean",
	"readOnly": "boolean",
	"relList": ["tokenlist", "rel"],
	"required": "boolean",
	"reversed": "boolean",
	"rows": ["limited unsigned long", "rows", 2],
	"rowSpan": "unsigned long",
	"scoped": "boolean",
	"seamless": "boolean",
	"shape": ["enum", "shape", {"values": ["circle", "circ", "default", "poly", "polygon", "rect", "rectangle"], "noncanon": {"circ": "circle", "polygon": "poly", "rectangle": "rect"}, "missing": "rect"}],
	"size": "unsigned long",
	"sizes": "settable tokenlist",
	"span": "limited unsigned long",
	"src": "url",
	// TODO: The default value should be the number of elements if the
	// reversed attribute is set.
	"start": ["long", "start", 1],

	// Obsolete attributes
	"ch": ["string", "char"],
	"chOff": ["string", "charoff"],
	"codeBase": "url",
	"compact": "boolean",
	"declare": "boolean",
	"hspace": "unsigned long",
	"longDesc": "url",
	"noHref": "boolean",
	"noResize": "boolean",
	"noShade": "boolean",
	"noWrap": "boolean",
	"object": "url",
	"trueSpeed": "boolean",
	"vspace": "unsigned long",
};

// Now we actually run all the tests.
var unimplemented = [];
for (var element in elements) {
	reflects("string", "id", element);
	reflects("string", "title", element);
	reflects("string", "lang", element);
	reflects("string", "className", element, "class");
	reflects({"type": "enum", "keywords": ["ltr", "rtl"]}, "dir", element);
	reflects("boolean", "hidden", element);
	reflects("string", "accessKey", element);
	reflects("boolean", "itemScope", element);
	reflects("string", "itemType", element);
	reflects("string", "itemId", element);
	// Don't try to test the defaultVal -- it should be either 0 or -1, but the
	// rules are complicated, and a lot of them are SHOULDs.
	reflects({"type": "long", "defaultVal": null}, "tabIndex", element);
	// TODO: classList, contextMenu, itemProp, itemRef (require tokenlist
	// support)

	for (var i = 0; i < elements[element].length; i++) {
		var idlAttrName = elements[element][i];
		var domAttrName = undefined;
		var type = undefined;
		var data = undefined;
		if (typeof idlAttrName == "string") {
			// An attribute that has only one type, so retrieve it from the
			// attribs array.
			if (typeof attribs[idlAttrName] == "undefined") {
				// This is the same as if attribs[idlAttrName] == "string"
				// (a shortcut syntax).
				type = "string";
				domAttrName = idlAttrName;
			} else if (typeof attribs[idlAttrName] == "string") {
				// domAttrName == idlAttrName
				type = attribs[idlAttrName];
				domAttrName = idlAttrName;
			} else {
				// attribs[idlAttrName] is [type, name, extra data]
				type = attribs[idlAttrName][0];
				domAttrName = attribs[idlAttrName][1];
				data = attribs[idlAttrName][2];
			}
		} else {
			// Something like value, that has different types on different
			// elements, so idlAttrName is [type, name, extra data].
			type = idlAttrName[0];
			data = idlAttrName[2];
			idlAttrName = idlAttrName[1];
			domAttrName = idlAttrName;
		}
		if (["string", "boolean", "url", "urls"].indexOf(type) != -1) {
			reflects(type, idlAttrName, element, domAttrName);
		} else if (type == "enum") {
			// Enumerated attribute that is limited only to known values
			reflectsEnum(element, domAttrName, idlAttrName, data);
		} else if (type == "long") {
			reflectsLong(element, domAttrName, idlAttrName, data);
		} else if (type == "limited long") {
			reflectsLimitedLong(element, domAttrName, idlAttrName, data);
		} else if (type == "unsigned long") {
			reflectsUnsignedLong(element, domAttrName, idlAttrName, data);
		} else if (type == "limited unsigned long") {
			reflectsLimitedUnsignedLong(element, domAttrName, idlAttrName, data);
		} else if (unimplemented.indexOf(type) == -1) {
			unimplemented.push(type);
		}
	}
}

// TODO: these behave differently if the body element is a frameset.  Also
// should probably test with multiple bodies.
reflects("string", "fgColor", document, "text", document.body);
reflects("string", "bgColor", document, "bgcolor", document.body);
reflects("string", "linkColor", document, "link", document.body);
reflects("string", "vlinkColor", document, "vlink", document.body);
reflects("string", "alinkColor", document, "alink", document.body);
// Don't mess up the colors :)
var attrs = ["text", "bgcolor", "link", "alink", "vlink"];
for (var i = 0; i < attrs.length; i++) {
	document.body.removeAttribute(attrs[i]);
}

var el = document.createElement("select");
el.multiple = true;
reflects({"type": "limited unsigned long", "defaultVal": 4, "comment": 'with multiple=""'}, "size", el);

// itemValue only reflects in certain circumstances.  The syntax for our big
// array thing above doesn't currently support one IDL attribute that reflects
// different content attributes, so just do this explicitly until that's fixed.
reflects("string", "itemValue", "meta", "content");
reflects("url", "itemValue", "audio", "src");
reflects("url", "itemValue", "embed", "src");
reflects("url", "itemValue", "iframe", "src");
reflects("url", "itemValue", "img", "src");
reflects("url", "itemValue", "source", "src");
reflects("url", "itemValue", "video", "src");
reflects("url", "itemValue", "a", "href");
reflects("url", "itemValue", "area", "href");
reflects("url", "itemValue", "link", "href");
reflects("url", "itemValue", "object", "data");
reflects("url", "itemValue", "time", "datetime");

document.getElementById("time").innerHTML = (new Date().getTime() - start)/1000;

document.body.innerHTML += "(Note: missing tests for types " + unimplemented.join(", ") + ".)";

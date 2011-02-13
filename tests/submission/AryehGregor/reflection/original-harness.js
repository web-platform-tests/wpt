var ReflectionHarness = {};

// @private
ReflectionHarness.passed = document.getElementById("passed");
ReflectionHarness.failed = document.getElementById("failed");

/**
 * Should we report a failure for unexpected exceptions, or just rethrow them?
 * The original test framework reports an exception, but testharness.js doesn't
 * want that.
 *
 * @public
 */
ReflectionHarness.catchUnexpectedExceptions = true;

/**
 * Returns a string representing val.  Basically just adds quotes for strings,
 * and passes through other recognized types literally.
 *
 * @public
 */
ReflectionHarness.stringRep = function(val) {
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
 * An object representing info about the current test, used for printing out
 * nice messages and so forth.
 */
ReflectionHarness.currentTestInfo = {};

/**
 * If question === answer, output a success, else report a failure with the
 * given description.  Currently success and failure both increment counters,
 * and failures output a message to a <ul>.  Which <ul> is decided by the type
 * parameter -- different attribute types are separated for readability.
 *
 * @public
 */
ReflectionHarness.test = function(expected, actual, description) {
	if (expected === actual) {
		this.increment(this.passed);
		return true;
	} else {
		this.increment(this.failed);
		this.reportFailure(description + ' (expected ' + this.stringRep(actual) + ', got ' + this.stringRep(expected) + ')');
		return false;
	}
}

/**
 * If calling fn causes a DOMException of the type given by the string
 * exceptionName (e.g., "INDEX_SIZE_ERR"), output a success.  Otherwise, report
 * a failure with the given description.
 *
 * @public
 */
ReflectionHarness.testException = function(exceptionName, fn, description) {
	try {
		fn();
	} catch (e) {
		if (e instanceof DOMException && e.code == eval("DOMException." + exceptionName)) {
			this.increment(this.passed);
			return true;
		}
	}
	this.increment(this.failed);
	this.reportFailure(description);
	return false;
}

/**
 * Get a description of the current type, e.g., "a.href".
 */
ReflectionHarness.getTypeDescription = function() {
	var domNode = this.currentTestInfo.domObj.tagName.toLowerCase();
	var idlNode = this.currentTestInfo.idlObj.nodeName.toLowerCase();
	var domName = this.currentTestInfo.domName;
	var idlName = this.currentTestInfo.idlName;
	var comment = this.currentTestInfo.data.comment;
	var typeDesc = idlNode + "." + idlName;
	if (!comment && (domNode != idlNode || domName != idlName)) {
		comment = "<" + domNode + " " + domName + ">";
	}
	if (comment) {
		typeDesc += " (" + comment + ")";
	}
	return typeDesc;
}

/**
 * Report a failure with the given description, adding context from the
 * currentTestInfo member.
 *
 * @private
 */
ReflectionHarness.reportFailure = function(description) {
	var typeDesc = this.getTypeDescription();
	var idlName = this.currentTestInfo.idlName;
	var comment = this.currentTestInfo.data.comment;
	typeDesc = typeDesc.replace("&", "&amp;").replace("<", "&lt;");
	description = description.replace("&", "&amp;").replace("<", "&lt;");

	var type = this.currentTestInfo.data.type;

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
 * Shorthand function for when we have a failure outside of test().  Generally
 * used when the failure is an exception thrown unexpectedly or such, something
 * not equality-based.
 *
 * @public
 */
ReflectionHarness.failure = function(message) {
	this.increment(this.failed);
	this.reportFailure(message);
}

/**
 * Shorthand function for when we have a success outside of test().  Only
 * called if catchUnexpectedExceptions is true.
 *
 * @public
 */
ReflectionHarness.success = function() {
	this.increment(this.passed);
}

/**
 * Increment the count in either "passed" or "failed".  el should always be one
 * of those two variables.  The implementation of this function amuses me.
 *
 * @private
 */
ReflectionHarness.increment = function(el) {
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
 *
 * @private (kind of, only called in the original reflection.html)
 */
ReflectionHarness.maskErrors = function(regex) {
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

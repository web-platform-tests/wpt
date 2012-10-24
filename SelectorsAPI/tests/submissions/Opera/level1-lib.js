// Require selectors.js to be included before this.

/*
 * Create and append special elements that cannot be created correctly with HTML markup alone.
 */
function setupSpecialElements(parent) {
	// Setup null and undefined tests
	parent.appendChild(doc.createElement("null"));
	parent.appendChild(doc.createElement("undefined"));

	// Setup namespace tests
	var anyNS = doc.createElement("div");
	var noNS = doc.createElement("div");
	anyNS.id = "any-namespace";
	noNS.id = "no-namespace";

	var div;
	div = [doc.createElement("div"),
	       doc.createElementNS("http://www.w3.org/1999/xhtml", "div"),
	       doc.createElementNS("", "div"),
	       doc.createElementNS("http://www.example.org/ns", "div")];

	div[0].id = "any-namespace-div1";
	div[1].id = "any-namespace-div2";
	div[2].setAttribute("id", "any-namespace-div3"); // Non-HTML elements can't use .id property
	div[3].setAttribute("id", "any-namespace-div4");

	for (var i = 0; i < div.length; i++) {
		anyNS.appendChild(div[i])
	}

	div = [doc.createElement("div"),
	       doc.createElementNS("http://www.w3.org/1999/xhtml", "div"),
	       doc.createElementNS("", "div"),
	       doc.createElementNS("http://www.example.org/ns", "div")];

	div[0].id = "no-namespace-div1";
	div[1].id = "no-namespace-div2";
	div[2].setAttribute("id", "no-namespace-div3"); // Non-HTML elements can't use .id property
	div[3].setAttribute("id", "no-namespace-div4");

	for (i = 0; i < div.length; i++) {
		noNS.appendChild(div[i])
	}

	parent.appendChild(anyNS);
	parent.appendChild(noNS);	
}

/*
 * Check that the querySelector and querySelectorAll methods exist on the given Node
 */
function interfaceCheck(type, obj, testType) {
	if (testType & (TEST_QSA_BASELINE|TEST_QSA_ADDITIONAL)) {
		test(function() {
			var q = typeof obj.querySelector === "function";
			assert_true(q, type + " supports querySelector.");
		}, type + " supports querySelector")

		test(function() {
			var qa = typeof obj.querySelectorAll === "function";
			assert_true( qa, type + " supports querySelectorAll.");
		}, type + " supports querySelectorAll")
	}
	
	if (testType & (TEST_FIND_BASELINE|TEST_FIND_ADDITIONAL)) {
		test(function() {
			var q = typeof obj.find === "function";
			assert_true(q, type + " supports find.");
		}, type + " supports querySelector")

		test(function() {
			var qa = typeof obj.findAll === "function";
			assert_true( qa, type + " supports findAll.");
		}, type + " supports findAll")
	}

	if (testType & (TEST_MATCH_BASELINE|TEST_MATCH_ADDITIONAL)) {
		if (obj.nodeType === obj.ELEMENT_NODE) {
			var ma = "matches";
			if (!obj.matches) { // If unprefixed method is not supported, test prefixed implementations.
				if (obj.mozMatchesSelector) {
					ma = "mozMatchesSelector"
				} else if (obj.webkitMatchesSelector) {
					ma = "webkitMatchesSelector"
				} else if (obj.oMatchesSelector) {
					ma = "oMatchesSelector"
				} else if (obj.msMatchesSelector) {
					ma = "msMatchesSelector"
				}
			}

			test(function() {
				assert_idl_attribute(obj, ma, type + " supports " + ma);
			}, type + " supports " + ma)

			test(function() {
				assert_idl_attribute(obj, ma, type + " supports matches");
				assert_equals(ma, "matches", "The matches method should be supported without a prefix.")
			}, type + " unprefixed matches method.")
		}
	}
}

/*
 * Verify that the NodeList returned by querySelectorAll is static and and that a new list is created after
 * each call. A static list should not be affected by subsequent changes to the DOM.
 */
function verifyStaticList(type, root) {
	var pre, post, preLength;

	pre = root.querySelectorAll("div");
	preLength = pre.length;

	var div = doc.createElement("div");
	(root.body || root).appendChild(div);

	test(function() {
		assert_equals(pre.length, preLength, "The length of the NodeList should not change.")
	}, type + ": static NodeList")

	test(function() {
		post = root.querySelectorAll( "div" ),
		assert_equals(post.length, preLength + 1, "The length of the new NodeList should be 1 more than the previous list.")
	}, type + ": new NodeList")
}

/*
 * Verify handling of special values for the selector parameter, including stringification of
 * null and undefined, and the handling of the empty string.
 */
function runSpecialSelectorTests(type, root) {
	test(function() { // 1
		assert_equals(root.querySelectorAll(null).length, 1, "This should find one element with the tag name 'NULL'.");
	}, type + ".querySelectorAll null")

	test(function() { // 2
		assert_equals(root.querySelectorAll(undefined).length, 1, "This should find one elements with the tag name 'UNDEFINED'.");
	}, type + ".querySelectorAll undefined")

	test(function() { // 3
		assert_throws(TypeError(), function() {
			root.querySelectorAll();
		}, "This should throw a TypeError")
	}, type + ".querySelectorAll no parameter.")

	test(function() { // 4
		var elm = root.querySelector(null)
		assert_not_equals(elm, null, "This should find an element.");
		assert_equals(elm.tagName.toUpperCase(), "NULL", "The tag name should be 'NULL'.")
	}, type + ".querySelector null")

	test(function() { // 5
		var elm = root.querySelector(undefined)
		assert_not_equals(elm, undefined, "This should find an element.");
		assert_equals(elm.tagName.toUpperCase(), "UNDEFINED", "The tag name should be 'UNDEFINED'.")
	}, type + ".querySelector undefined")

	test(function() { // 6
		assert_throws(TypeError(), function() {
			root.querySelector();
		}, "This should throw a TypeError")
	}, type + ".querySelector no parameter.")

	test(function() { // 7
		result = root.querySelectorAll("*");
		var i = 0;
		traverse(root, function(elem) {
			if (elem !== root) {
				assert_equals(elem, result[i++], "The result in index " + i + " should be in tree order.")
			}
		})
	}, type + ".querySelectorAll tree order");
}

/*
 * Execute queries with the specified valid selectors for both querySelector() and querySelectorAll()
 * Only run these tests when results are expected. Don't run for syntax error tests.
 */
function runValidSelectorTest(type, root, selectors, testType, docType) {
	var nodeType = "";
	switch (root.nodeType) {
		case Node.DOCUMENT_NODE:
			nodeType = "document";
			break;
		case Node.ELEMENT_NODE:
			nodeType = root.parentNode ? "element" : "detached";
			break;
		case Node.DOCUMENT_FRAGMENT_NODE:
			nodeType = "fragment";
			break;
		default:
			console.log("Reached unreachable code path.");
			nodeType = "unknown"; // This should never happen.
	}

	for (var i = 0; i < selectors.length; i++) {
		var s = selectors[i];
		var n = s["name"];
		var q = s["selector"];
		var e = s["expect"];

		if ((!s["exclude"] || (s["exclude"].indexOf(nodeType) === -1 && s["exclude"].indexOf(docType) === -1))
		 && (s["testType"] & testType) ) {
			//console.log("Running tests " + nodeType + ": " + s["testType"] + "&" + testType + "=" + (s["testType"] & testType) + ": " + JSON.stringify(s))
			var foundall, found;

			test(function() {
				foundall = root.querySelectorAll(q);
				assert_not_equals(foundall, null, "The method should not return null.")
				assert_equals(foundall.length, e.length, "The method should return the expected number of matches.")

				for (var i = 0; i < e.length; i++) {
					assert_not_equals(foundall[i], null, "The item in index " + i + " should not be null.")
					assert_equals(foundall[i].getAttribute("id"), e[i], "The item in index " + i + " should have the expected ID.");
					assert_false(foundall[i].hasAttribute("data-clone"), "This should not be a cloned element.");
				}
			}, type + ".querySelectorAll: " + n + ": " + q);

			test(function() {
				found = root.querySelector(q);

				if (e.length > 0) {
					assert_not_equals(found, null, "The method should return a match.")
					assert_equals(found.getAttribute("id"), e[0], "The method should return the first match.");
					assert_equals(found, foundall[0], "The result should match the first item from querySelectorAll.");
					assert_false(found.hasAttribute("data-clone"), "This should not be annotated as a cloned element.");
				} else {
					assert_equals(found, null, "The method should not match anything.");
				}
			}, type + ".querySelector: " + n + ": " + q);
		} else {
			//console.log("Excluding for " + nodeType + ": " + s["testType"] + "&" + testType + "=" + (s["testType"] & testType) + ": " + JSON.stringify(s))
		}
	}
}

/*
 * Execute queries with the specified invalid selectors for both querySelector() and querySelectorAll()
 * Only run these tests when errors are expected. Don't run for valid selector tests.
 */
function runInvalidSelectorTest(type, root, selectors) {
	for (var i = 0; i < selectors.length; i++) {
		var s = selectors[i];
		var n = s["name"];
		var q = s["selector"];
		var e = s["expect"];

		test(function() {
			assert_throws("SyntaxError", function() {
				root.querySelector(q)
			})
		}, type + ".querySelector: " + n + ": " + q);

		test(function() {
			assert_throws("SyntaxError", function() {
				root.querySelectorAll(q)
			})
		}, type + ".querySelectorAll: " + n + ": " + q);
	}
}

function traverse(elem, fn) {
	if (elem.nodeType === 1) {
		fn(elem);

		elem = elem.firstChild;
		while (elem) {
			traverse(elem, fn);
			elem = elem.nextSibling;
		}
	}
}

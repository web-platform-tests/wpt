var tests = tests[command];

var testsRunning = false;

function clearCachedResults() {
	for (var key in localStorage) {
		if (RegExp("^" + keyname + "test-").test(key)) {
			localStorage.removeItem(key);
		}
	}
}

var numManualTests = 0;

function runTests() {
	// We don't ask the user to hit a key on all tests, so make sure not to
	// claim more tests are going to be run than actually are.
	for (var i = 0; i < tests.length; i++) {
		if (localStorage.getItem(keyname + "test-" + tests[i]) === null) {
			numManualTests++;
		}
	}

	testsRunning = true;
	var runTestsButton = document.querySelector("#tests input[type=button]");
	runTestsButton.parentNode.removeChild(runTestsButton);

	var addTestButton = document.querySelector("#tests input[type=button]");
	var input = document.querySelector("#tests label input");
	// This code actually focuses and clicks everything because for some
	// reason, anything else doesn't work in IE9 . . .
	input.value = tests[0];
	input.focus();
	addTestButton.click();
}

function addTest() {
	var tr = doSetup("#tests table", 0);
	var input = document.querySelector("#tests label input");
	var test = input.value;
	doInputCell(tr, test);
	doSpecCell(tr, test, command, false);
	if (localStorage.getItem(keyname + "test-" + test) !== null) {
		// Yay, I get to cheat.  Remove the overlay div so the user doesn't
		// keep hitting the key, in case it takes a while.
		var browserCell = document.createElement("td");
		tr.appendChild(browserCell);
		browserCell.innerHTML = localStorage[keyname + "test-" + test];
		document.getElementById("overlay").style.display = "";
		doSameCell(tr);
		runNextTest(test);
	} else {
		doBrowserCell(tr, test, function() {
			doSameCell(tr);
			runNextTest(test);
		});
	}
}

function runNextTest(test) {
	doTearDown();
	var input = document.querySelector("#tests label input");
	if (!testsRunning) {
		document.getElementById("overlay").style.display = "";
		return;
	}
	var idx = tests.indexOf(test);
	if (idx != tests.lastIndexOf(test)) {
		// Cheap and effective error reporting
		document.body.textContent = "Duplicate test: " + test;
	}
	if (idx + 1 >= tests.length) {
		document.getElementById("overlay").style.display = "";
		testsRunning = false;
		input.value = "";
		return;
	}
	input.value = tests[idx + 1];
	input.focus();
	addTest();
}

function doBrowserCell(tr, test, callback) {
	var browserCell = document.createElement("td");
	tr.appendChild(browserCell);

	try {
		var points = setupCell(browserCell, test);

		var testDiv = browserCell.firstChild;
		// Work around weird Firefox bug:
		// https://bugzilla.mozilla.org/show_bug.cgi?id=649138
		document.body.appendChild(testDiv);
		testDiv.onkeyup = function() {
			continueBrowserCell(test, testDiv, browserCell);
			callback();
		};
		testDiv.contentEditable = "true";
		testDiv.spellcheck = false;
		var idx = tests.indexOf(test);
		if (idx == -1) {
			document.getElementById("testcount").style.display = "none";
		} else {
			document.getElementById("testcount").style.display = "";
			document.querySelector("#testcount > span").textContent = numManualTests;
			numManualTests--;
		}
		document.getElementById("overlay").style.display = "block";
		testDiv.focus();
		setSelection(points[0], points[1], points[2], points[3]);
	} catch (e) {
		browserCellException(e, testDiv, browserCell);
		callback();
	}
}

function continueBrowserCell(test, testDiv, browserCell) {
	try {
		testDiv.contentEditable = "inherit";
		testDiv.removeAttribute("spellcheck");
		var compareDiv1 = testDiv.cloneNode(true);

		if (getSelection().rangeCount) {
			addBrackets(getSelection().getRangeAt(0));
		}
		browserCell.insertBefore(testDiv, browserCell.firstChild);

		if (!browserCell.childNodes.length == 2) {
			throw "The cell didn't have two children.  Did something spill outside the test div?";
		}

		compareDiv1.normalize();
		// Sigh, Gecko is crazy
		var treeWalker = document.createTreeWalker(compareDiv1, NodeFilter.SHOW_ELEMENT, null, null);
		while (treeWalker.nextNode()) {
			var remove = [].filter.call(treeWalker.currentNode.attributes, function(attrib) {
				return /^_moz_/.test(attrib.name) || attrib.value == "_moz";
			});
			for (var i = 0; i < remove.length; i++) {
				treeWalker.currentNode.removeAttribute(remove[i].name);
			}
		}
		var compareDiv2 = compareDiv1.cloneNode(false);
		compareDiv2.innerHTML = compareDiv1.innerHTML;
		if (!compareDiv1.isEqualNode(compareDiv2)
		&& compareDiv1.innerHTML != compareDiv2.innerHTML) {
			throw "DOM does not round-trip through serialization!  "
				+ compareDiv1.innerHTML + " vs. " + compareDiv2.innerHTML;
		}
		if (!compareDiv1.isEqualNode(compareDiv2)) {
			throw "DOM does not round-trip through serialization (although innerHTML is the same)!  "
				+ testDiv.innerHTML;
		}

		browserCell.lastChild.textContent = browserCell.firstChild.innerHTML;
	} catch (e) {
		browserCellException(e, testDiv, browserCell);
	}

	localStorage[keyname + "test-" + test] = browserCell.innerHTML;
}

"use strict";
// TODO: Test images, interaction with SVG, creation of stacking
// context/containing block, fixed backgrounds, specificity of SVG transform
// attribute, inheritance (computed values)
//
// TODO: Note in particular that WebKit appears to resolve relative lengths for
// the computed value of transform, other browsers don't.  And IE seems to
// *not* resolve relative lengths for the computed value of transform-origin,
// but other browsers do.  But everyone seems to not resolve percents for
// transform-origin.
//
// TODO: CSSTransformList?
//
// FIXME: CSSMatrix seems not to be implemented by most UAs.
// https://www.w3.org/Bugs/Public/show_bug.cgi?id=15443
//
// Probably requires reftests: interaction with overflow
//
// Not for now: transitions, animations
var div = document.querySelector("#test");
var divWidth = 100, divHeight = 50;
var divParentWidth = 120, divParentHeight = 70;
// Arbitrarily chosen epsilon that makes browsers mostly pass with some extra
// breathing room, since the specs don't define rounding for display.
//
// FIXME: These need to be specified.
// https://www.w3.org/Bugs/Public/show_bug.cgi?id=15709
var pixelEpsilon = 1.5;
// A much smaller epsilon for computed style values, since there's no good
// reason for those to be very far off.  Some UAs do a bunch of rounding, but
// it should still be good to one decimal place.
var computedEpsilon = 0.05;

// percentagesAndLengths and lengths are both ordered with the most interesting
// things first, so you can truncate them to avoid undue combinatorial
// explosion.
var percentagesAndLengths = [
	".0", "-1px", "1pt", "53.7px", "-50%",
	"1em", "1px", "0.12%", "0.12px", "0%",
	"-53.7px", "0.0px",
	"1ex", "1in", "1cm", "1mm", "1pc"];
var lengths = percentagesAndLengths.filter(function(s){return !/%$/.test(s)});

var rotateAngles = [
	"-7deg", "0deg", "22.5deg", "45deg", "86.451deg", "90deg", "180deg",
	"270deg", "452deg",
	"-1rad", "0rad", "1rad", "6.28rad",
	"0.721turn", "256grad"];
// Do not test values close to 90 degrees, because this will cause coordinates
// to get large.  The maximum values for coordinates are (of course) not
// defined, and even if they were, the result would be extremely sensitive to
// rounding error.
var skewAngles = [
	"-80deg", "-45deg", "-32.6deg", "-0.05deg", "0deg", "0.05deg", "32.6deg",
	"45deg", "80deg", "300deg",
	"-0.3rad", "0rad", "0.3rad", "2.9rad",
	"0.921turn", "22grad"];

var emPixels = parseFloat(getComputedStyle(div).fontSize);
div.style.fontSize = "1ex";
var exPixels = parseFloat(getComputedStyle(div).fontSize);
div.removeAttribute("style");

var switchStyles = document.querySelectorAll("style.switch");
[].forEach.call(switchStyles, function(style) { style.disabled = true });

// Track how many tests we're running for each section of the test files
var section;
var sectionCounts = {};
add_result_callback(function() {
	if (!(section in sectionCounts)) {
		sectionCounts[section] = 0;
	}
	sectionCounts[section]++;
});
add_completion_callback(function() {
	var msg = "Tests: ";
	var total = 0;
	for (var key in sectionCounts) {
		msg += key + " " + sectionCounts[key] + ", ";
		total += sectionCounts[key];
	}
	msg += "total " + total;
	document.body.appendChild(document.createTextNode(msg));
});

/**
 * Account for prefixing so that I can check whether browsers actually follow
 * the spec.  Obviously, in any final version of the test, only the unprefixed
 * property will be tested.  Usage: prefixProp("transformOrigin") ==
 * "msTransformOrigin", "mozTransformOrigin", etc. as appropriate.
 */
function prefixProp(s) {
	if (s in div.style) {
		return s;
	}
	s = s[0].toUpperCase() + s.slice(1);
	var prefixes = ["ms", "Moz", "moz", "webkit", "O"];
	for (var i = 0; i < prefixes.length; i++) {
		if ((prefixes[i] + s) in div.style) {
			return prefixes[i] + s;
		}
	}
	return undefined;
}

/**
 * Likewise, but gives the hyphenated version.
 * prefixHyphenatedProp("transform-origin") is "-ms-transform-origin",
 * "-moz-transform-origin", etc.
 */
function prefixHyphenatedProp(s) {
	s = s.split("-")
		.map(function(bit, i) {
			return i == 0 ? bit : bit[0].toUpperCase() + bit.slice(1)
		})
		.join("");
	s = prefixProp(s);
	s = s[0].toUpperCase() + s.slice(1);
	return s.replace(/([A-Z])/g, "-$1")
		.toLowerCase();
}

/**
 * Accepts a string that's a CSS length or percentage, and returns a number of
 * pixels (not a string), or null if parsing fails.  For percentages to be
 * accepted, percentRef must not be undefined.
 */
function convertToPx(input, percentRef) {
	var match = /^([-+]?[0-9]+|[-+]?[0-9]*\.[0-9]+)(em|ex|in|cm|mm|pt|pc|px|%)?$/.exec(input);
	if (!match) {
		return null;
	}
	var amount = Number(match[1]);
	var unit = match[2];
	if (amount == 0) {
		return 0;
	}
	if (!unit) {
		return null;
	}
	if (unit == "%" && percentRef === undefined) {
		return null;
	}
	return amount * {
		em: emPixels,
		ex: exPixels,
		in: 72/0.75,
		cm: (1/2.54)*72/0.75,
		mm: (1/25.4)*72/0.75,
		pt: 1/0.75,
		pc: 12/0.75,
		px: 1,
		"%": percentRef/100,
	}[unit];
}

/**
 * Accepts a string that's a CSS angle, and returns a number of radians (not a
 * string), or null if parsing fails.
 */
function convertToRad(input) {
	var match = /^([-+]?[0-9]+|[-+]?[0-9]*\.[0-9]+)(deg|grad|rad|turn)$/.exec(input);
	if (!match) {
		return null;
	}
	var amount = Number(match[1]);
	var unit = match[2];
	return amount * {
		deg: Math.PI/180,
		grad: Math.PI/200,
		rad: 1,
		turn: 2*Math.PI,
	}[unit];
}

/**
 * Multiplies two or more 2x3 matrices passed as one-dimensional column-major
 * arrays (interpreted as 3x3 matrices with bottom row 0 0 1).
 */
function mxmul23(A, B) {
	if (arguments.length > 2) {
		return mxmul23(A, mxmul23.apply(this, [].slice.call(arguments, 1)));
	}
	return [
		A[0]*B[0] + A[2]*B[1],
		A[1]*B[0] + A[3]*B[1],
		A[0]*B[2] + A[2]*B[3],
		A[1]*B[2] + A[3]*B[3],
		A[0]*B[4] + A[2]*B[5] + A[4],
		A[1]*B[4] + A[3]*B[5] + A[5]
	];
}

/**
 * Multiplies two or more 4x4 matrices passed as one-dimensional column-major
 * arrays.
 */
function mxmul44(A, B) {
	if (arguments.length > 2) {
		return mxmul44(A, mxmul44.apply(this, [].slice.call(arguments, 1)));
	}
	A = [A.slice(0, 4), A.slice(4, 8), A.slice(8, 12), A.slice(12, 16)];
	B = [B.slice(0, 4), B.slice(4, 8), B.slice(8, 12), B.slice(12, 16)];
	var C = [];
	for (var i = 0; i < 4; i++) {
		C.push([]);
		for (var j = 0; j < 4; j++) {
			C[i].push(0);
			for (var k = 0; k < 4; k++) {
				C[i][j] += B[i][k]*A[k][j];
			}
		}
	}
	return C[0].concat(C[1]).concat(C[2]).concat(C[3]);
}

/**
 * Given a sixteen-element numeric array mx in column-major order, returns true
 * if it's equivalent to a six-element array (a 2D matrix), false otherwise.
 */
function is2dMatrix(mx) {
	// Use a really small epsilon here.  Otherwise we'll think perspective
	// matrices are 2D.
	var e = 1.0e-5;
	return Math.abs(mx[2]) < e
		&& Math.abs(mx[3]) < e

		&& Math.abs(mx[6]) < e
		&& Math.abs(mx[7]) < e

		&& Math.abs(mx[8]) < e
		&& Math.abs(mx[9]) < e
		&& Math.abs(mx[10] - 1) < e
		&& Math.abs(mx[11]) < e

		&& Math.abs(mx[14]) < e
		&& Math.abs(mx[15] - 1) < e;
}

/**
 * Returns true or false every time it's called.  It more or less alternates,
 * but actually has a period of 17, so it won't repeat with the same period as
 * other cyclic things (these are quite repetitive tests).
 */
function getUseCssom() {
	if (getUseCssom.counter === undefined) {
		getUseCssom.counter = 0;
	}
	getUseCssom.counter++;
	getUseCssom.counter %= 17;
	return Boolean(getUseCssom.counter % 2);
}

/**
 * Returns the rotation matrix used for rotate3d(x, y, z, angle).  FIXME: I've
 * followed what Gecko/WebKit actually do, not what the spec says.
 * https://www.w3.org/Bugs/Public/show_bug.cgi?id=15610
 */
function getRotationMatrix(x, y, z, angle) {
	var rads = convertToRad(angle);
	var len = Math.sqrt(x*x + y*y + z*z);
	x /= len;
	y /= len;
	z /= len;
	var ret =
		[1 + (1-Math.cos(rads))*(x*x-1),
		z*Math.sin(rads)+(1-Math.cos(rads))*x*y,
		-y*Math.sin(rads)+(1-Math.cos(rads))*x*z,
		0,

		-z*Math.sin(rads)+(1-Math.cos(rads))*x*y,
		1 + (1-Math.cos(rads))*(y*y-1),
		x*Math.sin(rads)+(1-Math.cos(rads))*y*z,
		0,

		y*Math.sin(rads)+(1-Math.cos(rads))*x*z,
		-x*Math.sin(rads)+(1-Math.cos(rads))*y*z,
		1 + (1-Math.cos(rads))*(z*z-1),
		0,

		0, 0, 0, 1];
	return ret;
}


/**
 * Tests that style="transform: value" results in transformation by the matrix
 * mx, which may have either six or sixteen entries.  Checks both the computed
 * value and bounding box.
 */
function testTransform(value, mx) {
	var useCssom = getUseCssom();
	test(function() {
		if (useCssom) {
			div.removeAttribute("style");
			div.style[prefixProp("transform")] = value;
		} else {
			div.setAttribute("style", prefixHyphenatedProp("transform") + ": " + value);
		}
		testTransformParsing(mx);
	}, 'Computed value for "transform: ' + value
	+ '" set via ' + (useCssom ? "CSSOM" : "setAttribute()"));
	testTransformedBoundary(value, mx);
}

/**
 * Tests that div's computed style for transform is "matrix(...)" or
 * "matrix3d(...)", as appropriate.  mx can have either zero, six, or sixteen
 * entries.
 *
 * If mx has zero entries, that means the transform is supposed to parse the
 * same as "none" or be a parse error.  FIXME: The spec doesn't match browsers
 * for serialization of the transform property when it's unset or "none".
 * <https://www.w3.org/Bugs/Public/show_bug.cgi?id=15471>  Thus for now we
 * accept either "matrix(1, 0, 0, 1, 0, 0)" or "none" in this case.
 *
 * FIXME: We allow px optionally in the last two entries because Gecko adds it
 * while other engines don't, and the spec is unclear about which behavior is
 * correct: https://www.w3.org/Bugs/Public/show_bug.cgi?id=15431
 *
 * FIXME: This does not actually match the 3D Transforms spec.
 * https://www.w3.org/Bugs/Public/show_bug.cgi?id=15535
 *
 * If mx has six entries, it's equivalent to a 4x4 matrix with 0's and 1's in
 * the right places.  If it has sixteen entries, the required output format is
 * still matrix() instead of matrix3d() if it's equivalent to a 2D matrix.
 */
function testTransformParsing(mx) {
	if (mx.length == 0) {
		assert_regexp_match(getComputedStyle(div)[prefixProp("transform")],
			/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/,
			"computed value has unexpected form");
		return;
	}
	if (mx.length == 6) {
		mx = [mx[0], mx[1], 0, 0,  mx[2], mx[3], 0, 0,  0, 0, 1, 0,  mx[4], mx[5], 0, 1];
	}
	var computed = getComputedStyle(div)[prefixProp("transform")];
	if (is2dMatrix(mx)) {
		var re = /^matrix\(([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+?)(?:px)?, ([^,]+?)(?:px)?\)$/;
		assert_regexp_match(computed, re, "computed value has unexpected form for 2D matrix");
		var msg = ' (actual: "' + computed + '"; '
			+ 'expected: "matrix(' + [mx[0], mx[1], mx[4], mx[5], mx[12], mx[13]].join(', ') +')")';
		var match = re.exec(computed);
		assert_approx_equals(Number(match[1]), mx[0], computedEpsilon,
			"getComputedStyle matrix component 0" + msg);
		assert_approx_equals(Number(match[2]), mx[1], computedEpsilon,
			"getComputedStyle matrix component 1" + msg);
		assert_approx_equals(Number(match[3]), mx[4], computedEpsilon,
			"getComputedStyle matrix component 2" + msg);
		assert_approx_equals(Number(match[4]), mx[5], computedEpsilon,
			"getComputedStyle matrix component 3" + msg);
		assert_approx_equals(Number(match[5]), mx[12], computedEpsilon,
			"getComputedStyle matrix component 4" + msg);
		assert_approx_equals(Number(match[6]), mx[13], computedEpsilon,
			"getComputedStyle matrix component 5" + msg);
		return;
	}

	var re = /^matrix3d\(([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+?)(?:px)?, ([^,]+?)(?:px)?, ([^,]+?)(?:px)?, ([^,]+?)\)$/;
	assert_regexp_match(computed, re, "computed value has unexpected form for 3D matrix");
	var msg = ' (actual: "' + computed + '"; '
		+ 'expected: "matrix3d(' + mx.join(', ') +')")';
	var match = re.exec(computed);
	for (var i = 0; i < 16; i++) {
		assert_approx_equals(Number(match[i + 1]), mx[i], computedEpsilon,
			"getComputedStyle matrix component " + i + msg);
	}
}

/**
 * Tests that
 *   style="transform: transformValue; transform-origin: transformOriginValue"
 * results in the boundary box that you'd get from transforming with a matrix
 * of mx around an offset of [xOffset, yOffset].  transformOriginValue defaults
 * to "50% 50%", xOffset to divWidth/2, yOffset to divHeight/2, zOffset to 0.
 *
 * transformValue can also be an array of three values.  If it is, they're used
 * for the test div's grandparent, its parent, and the test div itself,
 * respectively.  mx should then be the entries of the matrix of all three
 * transforms multiplied together.
 *
 * mx can have zero, six, or sixteen entries.  If it has zero, it's the same as
 * the identity matrix.
 */
function testTransformedBoundary(transformValue, mx,
                                 transformOriginValue, xOffset, yOffset, zOffset) {
	if (mx.length == 0) {
		mx = [1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1];
	}
	if (mx.length == 6) {
		mx = [mx[0], mx[1], 0, 0,  mx[2], mx[3], 0, 0,  0, 0, 1, 0,  mx[4], mx[5], 0, 1];
	}

	// Don't test singular matrices for now.  IE fails some of them, which
	// might be due to getBoundingClientRect() instead of transforms.  Only
	// skipped for 2D matrices, for sanity's sake (don't want to compute 4x4
	// determinants).
	if (is2dMatrix(mx)
	&& mx[0]*mx[5] - mx[1]*mx[4] === 0) {
		return;
	}

	if (transformOriginValue === undefined) {
		transformOriginValue = "50% 50%";
	}
	if (xOffset === undefined) {
		xOffset = divWidth/2;
	}
	if (yOffset === undefined) {
		yOffset = divHeight/2;
	}
	if (zOffset === undefined) {
		zOffset = 0;
	}

	// Compute the expected bounding box by applying the given matrix to the
	// vertices of the test div's border box.
	var originalPoints = [[0, 0], [0, divHeight], [divWidth, 0], [divWidth, divHeight]];
	var expectedTop, expectedRight, expectedBottom, expectedLeft;
	for (var i = 0; i < originalPoints.length; i++) {
		var x = originalPoints[i][0] - xOffset;
		var y = originalPoints[i][1] - yOffset;
		var z = -zOffset;
		// Perspective; hope w isn't 0.  FIXME: Precise behavior isn't really
		// defined anywhere, although the intent is relatively clear:
		// https://www.w3.org/Bugs/Public/show_bug.cgi?id=15605
		var newW = mx[3]*x + mx[7]*y + mx[11]*z + mx[15];
		var newX = (mx[0]*x + mx[4]*y + mx[8]*z + mx[12])/newW + xOffset;
		var newY = (mx[1]*x + mx[5]*y + mx[9]*z + mx[13])/newW + yOffset;
		// Don't care about the new Z -- that doesn't affect rendering.
		if (expectedTop === undefined || newY < expectedTop) {
			expectedTop = newY;
		}
		if (expectedRight === undefined || newX > expectedRight) {
			expectedRight = newX;
		}
		if (expectedBottom === undefined || newY > expectedBottom) {
			expectedBottom = newY;
		}
		if (expectedLeft === undefined || newX < expectedLeft) {
			expectedLeft = newX;
		}
	}

	// Pick a different <style class=switch> for each test; they shouldn't
	// affect results, so it's fine to just alternate.  We cycle through using
	// a reasonably large prime number (19) so that when the tests are
	// repetitive, we're unlikely to keep hitting the same styles for the same
	// sort of test.
	if (testTransformedBoundary.switchStyleIdx === undefined) {
		testTransformedBoundary.switchStyleIdx = switchStyles.length - 1;
	}
	switchStyles[testTransformedBoundary.switchStyleIdx % switchStyles.length].disabled = true;
	testTransformedBoundary.switchStyleIdx++;
	testTransformedBoundary.switchStyleIdx %= 19;
	switchStyles[testTransformedBoundary.switchStyleIdx % switchStyles.length].disabled = false;

	var useCssom = getUseCssom();
	if (typeof transformValue == "string") {
		test(function() {
			if (useCssom) {
				div.removeAttribute("style");
				div.style[prefixProp("transform")] = transformValue;
				div.style[prefixProp("transformOrigin")] = transformOriginValue;
			} else {
				div.setAttribute("style",
					prefixHyphenatedProp("transform") + ": " + transformValue + "; "
					+ prefixHyphenatedProp("transform-origin") + ": " + transformOriginValue);
			}
			testTransformedBoundaryAsserts(expectedTop, expectedRight, expectedBottom, expectedLeft);
		}, "Boundaries with \"transform: " + transformValue + "; "
		+ "transform-origin: " + transformOriginValue + "\" "
		+ "set via " + (useCssom ? "CSSOM" : "setAttribute()") + "; "
		+ "switch style " + (testTransformedBoundary.switchStyleIdx % switchStyles.length));
	} else {
		test(function() {
			if (useCssom) {
				div.parentNode.parentNode.style[prefixProp("transform")] = transformValue[0];
				div.parentNode.style[prefixProp("transform")] = transformValue[1];
				div.removeAttribute("style");
				div.style[prefixProp("transform")] = transformValue[2];
				div.style[prefixProp("transformOrigin")] = transformOriginValue;
			} else {
				div.parentNode.parentNode.setAttribute("style",
					prefixHyphenatedProp("transform") + ": " + transformValue[0]);
				div.parentNode.setAttribute("style",
					prefixHyphenatedProp("transform") + ": " + transformValue[1]);
				div.setAttribute("style",
					prefixHyphenatedProp("transform") + ": " + transformValue[2] + "; "
					+ prefixHyphenatedProp("transform-origin") + ": " + transformOriginValue);
			}
			testTransformedBoundaryAsserts(expectedTop, expectedRight, expectedBottom, expectedLeft);
		}, "Boundaries with \"transform: " + transformValue[0] + "\" on test div's grandparent, "
		+ "\"transform: " + transformValue[1] + "\" on its parent, "
		+ "\"transform: " + transformValue[2] + "; "
		+ "transform-origin: " + transformOriginValue + "\" on test div, "
		+ "set via " + (useCssom ? "CSSOM" : "setAttribute()") + "; "
		+ "switch style " + (testTransformedBoundary.switchStyleIdx % switchStyles.length));

		div.parentNode.removeAttribute("style");
		div.parentNode.parentNode.removeAttribute("style");
	}
}

function testTransformedBoundaryAsserts(expectedTop, expectedRight, expectedBottom, expectedLeft) {
	// FIXME: We assume getBoundingClientRect() returns the rectangle
	// that contains the transformed box, not the untransformed box.
	// This is not actually specified anywhere:
	// https://www.w3.org/Bugs/Public/show_bug.cgi?id=15430
	var rect = div.getBoundingClientRect();
	var msg = " (actual " + rect.top.toFixed(3) + ", "
		+ rect.right.toFixed(3) + ", "
		+ rect.bottom.toFixed(3) + ", "
		+ rect.left.toFixed(3) + "; "
		+ "expected " + expectedTop.toFixed(3) + ", "
		+ expectedRight.toFixed(3) + ", "
		+ expectedBottom.toFixed(3) + ", "
		+ expectedLeft.toFixed(3) + ")";
	assert_approx_equals(rect.top, expectedTop, pixelEpsilon, "top" + msg);
	assert_approx_equals(rect.right, expectedRight, pixelEpsilon, "right" + msg);
	assert_approx_equals(rect.bottom, expectedBottom, pixelEpsilon, "bottom" + msg);
	assert_approx_equals(rect.left, expectedLeft, pixelEpsilon, "left" + msg);
	assert_approx_equals(rect.width, expectedRight - expectedLeft, pixelEpsilon, "width" + msg);
	assert_approx_equals(rect.height, expectedBottom - expectedTop, pixelEpsilon, "height" + msg);
}

/**
 * Test that "transform-origin: value" acts like the origin is at
 * (expectedHoriz, expectedVert), where the latter two parameters can be
 * keywords, percentages, or lengths.  Tests both that the computed value is
 * correct, and that the boundary box is as expected for a 45-degree rotation.
 */
function testTransformOrigin(value, expectedX, expectedY, expectedZ) {
	if (expectedX == "left") {
		expectedX = "0%";
	} else if (expectedX == "center") {
		expectedX = "50%";
	} else if (expectedX == "right") {
		expectedX = "100%";
	}
	if (expectedY == "top") {
		expectedY = "0%";
	} else if (expectedY == "center") {
		expectedY = "50%";
	} else if (expectedY == "bottom") {
		expectedY = "100%";
	}
	// FIXME: Nothing defines resolved values here.  I picked the behavior of
	// all non-Gecko engines, which is also the behavior Gecko for transforms
	// other than "none": https://www.w3.org/Bugs/Public/show_bug.cgi?id=15433
	expectedX = convertToPx(expectedX, divWidth);
	expectedY = convertToPx(expectedY, divHeight);
	if (expectedZ !== undefined) {
		expectedZ = convertToPx(expectedZ);
	}

	if (testTransformOrigin.counter === undefined) {
		testTransformOrigin.counter = 0;
	}
	// The transform doesn't matter here, so set it to one of several
	// possibilities arbitrarily (this actually catches a Gecko bug!)
	var transformValue = {
		0: "none",
		1: "matrix(7, 0, -1, 13, 0, 0)",
		2: "translate(4em, -15px)",
		3: "scale(1.2, 1)",
		4: "rotate(43deg)",
	}[testTransformOrigin.counter % 5];
	testTransformOrigin.counter++;
	div.removeAttribute("style");

	if (getUseCssom()) {
		test(function() {
			div.style[prefixProp("transform")] = transformValue;
			div.style[prefixProp("transformOrigin")] = value;
			testTransformOriginParsing(expectedX, expectedY, expectedZ);
		}, "Computed value for transform-origin "
		+ 'with "transform: ' + transformValue + "; "
		+ "transform-origin: " + value + '" set via CSSOM');
	} else {
		test(function() {
			div.setAttribute("style", prefixHyphenatedProp("transform") + ": " + transformValue
				+ "; " + prefixHyphenatedProp("transform-origin") + ":" + value);
			testTransformOriginParsing(expectedX, expectedY, expectedZ);
		}, "Computed value for transform-origin "
		+ 'with "transform: ' + transformValue + "; "
		+ "transform-origin: " + value + '" set via setAttribute()');
	}

	// Test with a 45-degree rotation, since the effect of changing the origin
	// will be easy to understand.  In the 3D case, rotate around an
	// arbitrarily-chosen vector.
	testTransformedBoundary(
		// Transform
		expectedZ === undefined
			? "rotate(45deg)"
			: "rotate3d(1,-1,1,45deg)",
		// Matrix entries
		expectedZ === undefined
			? getRotationMatrix(0, 0, 1, "45deg")
			: getRotationMatrix(1, -1, 1, "45deg"),
		// Origin
		value, expectedX, expectedY, expectedZ
	);
}

/**
 * Tests that style="transform-origin: value" results in
 * getComputedStyle().transformOrigin being
 *   expectedX + "px " + expectedY + "px " + expectedZ + "px",
 * or if expectedZ is 0, just
 *   expectedX + "px " + expectedY + "px".
 */
function testTransformOriginParsing(expectedX, expectedY, expectedZ) {
	if (expectedZ === undefined) {
		expectedZ = 0;
	}
	var actual = getComputedStyle(div)[prefixProp("transformOrigin")];
	var re = expectedZ == 0
		? /^([^ ]+)px ([^ ]+)px$/
		: /^([^ ]+)px ([^ ]+)px ([^ ]+)px$/;
	assert_regexp_match(actual, re, "Computed value has unexpected form");
	var match = re.exec(actual);

	var msg = ' (actual: "' + actual + '", expected: "'
		+ expectedX + "px " + expectedY
		+ (expectedZ == 0 ? "" : "px " + expectedZ)
		+ 'px")';

	assert_approx_equals(Number(match[1]), expectedX, computedEpsilon,
		"Value of X part" + msg);

	assert_approx_equals(Number(match[2]), expectedY, computedEpsilon,
		"Value of Y part" + msg);

	if (expectedZ != 0) {
		assert_approx_equals(Number(match[3]), expectedZ, computedEpsilon,
			"Value of Z part" + msg);
	}
}

function testPerspective(value, originValue, expectedX, expectedY) {
	testPerspectiveParsing(value);

	// TODO: Test boundaries, when I get access to more than one implementation
	// that actually supports the perspective property.
}

/**
 * Tests that getComputedStyle(div.parentNode).perspective is either "none" or
 * a number of pixels, dependent on the value passed.
 *
 * TODO: Support stripping whitespace, etc.
 *
 * FIXME: Resolved values are not defined properly
 * https://www.w3.org/Bugs/Public/show_bug.cgi?id=15681
 */
function testPerspectiveParsing(value) {
	var useCssom = getUseCssom();
	test(function() {
		if (useCssom) {
			div.parentNode.style[prefixProp("perspective")] = value;
		} else {
			div.parentNode.setAttribute("style",
				prefixHyphenatedProp("perspective") + ": " + value);
		}

		var actual = getComputedStyle(div.parentNode)[prefixProp("perspective")];
		if (convertToPx(value) === null
		|| convertToPx(value) <= 0) {
			assert_equals(actual, "none");
			return;
		}
		assert_regexp_match(actual, /^[0-9]+(\.[0-9]+)?px$/, "Computed value has unexpected form");
		assert_approx_equals(parseFloat(actual), convertToPx(value), computedEpsilon);
	}, "Computed value for perspective "
	+ 'with "perspective: ' + value + '" '
	+ "set via " + (useCssom ? "CSSOM" : "setAttribute()"));

	div.parentNode.removeAttribute("style");
}

/**
 * Tests that getComputedStyle(div.parentNode).perspectiveOrigin is
 *   expectedX + "px " + expectedY + "px".
 *
 * FIXME: Resolved values are not defined properly
 * https://www.w3.org/Bugs/Public/show_bug.cgi?id=15681
 */
function testPerspectiveOrigin(value, expectedX, expectedY) {
	if (expectedX == "left") {
		expectedX = "0%";
	} else if (expectedX == "center") {
		expectedX = "50%";
	} else if (expectedX == "right") {
		expectedX = "100%";
	}
	if (expectedY == "top") {
		expectedY = "0%";
	} else if (expectedY == "center") {
		expectedY = "50%";
	} else if (expectedY == "bottom") {
		expectedY = "100%";
	}

	if (/%$/.test(expectedX) || /%$/.test(expectedY)) {
		// FIXME: Gecko and WebKit disagree, and spec doesn't say which is
		// right https://www.w3.org/Bugs/Public/show_bug.cgi?id=15681
		//
		// FIXME: What does "refer to the size of the element's box" mean?
		// Border box?  https://www.w3.org/Bugs/Public/show_bug.cgi?id=15708
		return;
	}

	expectedX = convertToPx(expectedX, divParentWidth);
	expectedY = convertToPx(expectedY, divParentHeight);

	var useCssom = getUseCssom();
	test(function() {
		if (useCssom) {
			div.parentNode.style[prefixProp("perspectiveOrigin")] = value;
		} else {
			div.parentNode.setAttribute("style",
				prefixHyphenatedProp("perspective-origin") + ":" + value);
		}

		var actual = getComputedStyle(div.parentNode)[prefixProp("perspectiveOrigin")];
		var re = /^([^ ]+)px ([^ ]+)px$/;
		assert_regexp_match(actual, re, "Computed value has unexpected form");
		var match = re.exec(actual);

		var msg = ' (actual: "' + actual + '", expected: "'
			+ expectedX + "px " + expectedY + 'px")';

		assert_approx_equals(Number(match[1]), expectedX, computedEpsilon,
			"Value of X part" + msg);

		assert_approx_equals(Number(match[2]), expectedY, computedEpsilon,
			"Value of Y part" + msg);
	}, "Computed value for perspective-origin "
	+ 'with "perspective-origin: "' + value + '" '
	+ "set via " + (useCssom ? "CSSOM" : "setAttribute()"));

	div.parentNode.removeAttribute("style");
}

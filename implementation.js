"use strict";

var htmlNamespace = "http://www.w3.org/1999/xhtml";

var cssStylingFlag = false;

// Utility functions
function nextNode(node) {
	if (node.hasChildNodes()) {
		return node.firstChild;
	}
	return nextNodeDescendants(node);
}

function previousNode(node) {
	if (node.previousSibling) {
		node = node.previousSibling;
		while (node.hasChildNodes()) {
			node = node.lastChild;
		}
		return node;
	}
	if (node.parentNode
	&& node.parentNode.nodeType == Node.ELEMENT_NODE) {
		return node.parentNode;
	}
	return null;
}

function nextNodeDescendants(node) {
	while (node && !node.nextSibling) {
		node = node.parentNode;
	}
	if (!node) {
		return null;
	}
	return node.nextSibling;
}

function convertProperty(property) {
	// Special-case for now
	var map = {
		"fontStyle": "font-style",
		"fontWeight": "font-weight",
		"textDecoration": "text-decoration",
	};
	if (typeof map[property] != "undefined") {
		return map[property];
	}

	return property;
}

function cssValuesEqual(property, val1, val2) {
	// This is a bad hack to work around browser incompatibility.  It wouldn't
	// work in real life, but it's good enough for a test implementation.
	if (val1 === null || val2 === null) {
		return val1 === val2;
	}

	if (property == "verticalAlign") {
		// Fake property values
		if (val1 == "mixed" || val2 == "mixed") {
			return val1 === val2;
		}
	}

	if (property == "fontWeight") {
		return val1 == val2
			|| (val1.toLowerCase() == "bold" && val2 == "700")
			|| (val2.toLowerCase() == "bold" && val1 == "700")
			|| (val1.toLowerCase() == "normal" && val2 == "400")
			|| (val2.toLowerCase() == "normal" && val1 == "400");
	}
	var test1 = document.createElement("span");
	test1.style[property] = val1;
	var test2 = document.createElement("span");
	test2.style[property] = val2;

	return test1.style[property] == test2.style[property];
}

// Opera 11 puts HTML elements in the null namespace, it seems.
function isHtmlNamespace(ns) {
	return ns === null
		|| ns === htmlNamespace;
}


// Functions for stuff in DOM Range
function getNodeIndex(node) {
	var ret = 0;
	while (node != node.parentNode.childNodes[ret]) {
		ret++;
	}
	return ret;
}

function getNodeLength(node) {
	if (node.nodeType == Node.TEXT_NODE
	|| node.nodeType == Node.COMMENT_NODE
	|| node.nodeType == Node.PROCESSING_INSTRUCTION_NODE) {
		return node.data.length;
	}

	return node.childNodes.length;
}

/**
 * The position of two boundary points relative to one another, as defined by
 * DOM Range.
 */
function getPosition(nodeA, offsetA, nodeB, offsetB) {
	// "If node A is the same as node B, return equal if offset A equals offset
	// B, before if offset A is less than offset B, and after if offset A is
	// greater than offset B."
	if (nodeA == nodeB) {
		if (offsetA == offsetB) {
			return "equal";
		}
		if (offsetA < offsetB) {
			return "before";
		}
		if (offsetA > offsetB) {
			return "after";
		}
	}

	// "If node A is after node B in tree order, compute the position of (node
	// B, offset B) relative to (node A, offset A). If it is before, return
	// after. If it is after, return before."
	if (nodeB.compareDocumentPosition(nodeA) & Node.DOCUMENT_POSITION_FOLLOWING) {
		var pos = getPosition(nodeB, offsetB, nodeA, offsetA);
		if (pos == "before") {
			return "after";
		}
		if (pos == "after") {
			return "before";
		}
	}

	// "If node A is an ancestor of node B:"
	if (nodeB.compareDocumentPosition(nodeA) & Node.DOCUMENT_POSITION_CONTAINS) {
		// "Let child equal node B."
		var child = nodeB;

		// "While child is not a child of node A, set child to its parent."
		while (child.parentNode != nodeA) {
			child = child.parentNode;
		}

		// "If the index of child is less than offset A, return after."
		if (getNodeIndex(child) < offsetA) {
			return "after";
		}
	}

	// "Return before."
	return "before";
}

/**
 * Returns the furthest ancestor of a Node as defined by DOM Range.
 */
function getFurthestAncestor(node) {
	var root = node;
	while (root.parentNode != null) {
		root = root.parentNode;
	}
	return root;
}

/**
 * "contained" as defined by DOM Range: "A Node node is contained in a range
 * range if node's furthest ancestor is the same as range's root, and (node, 0)
 * is after range's start, and (node, length of node) is before range's end."
 */
function isContained(node, range) {
	var pos1 = getPosition(node, 0, range.startContainer, range.startOffset);
	var pos2 = getPosition(node, getNodeLength(node), range.endContainer, range.endOffset);

	return getFurthestAncestor(node) == getFurthestAncestor(range.startContainer)
		&& pos1 == "after"
		&& pos2 == "before";
}


// Things defined in the edit command spec (i.e., the interesting stuff)


// "A Node is an HTML element if it is an Element whose namespace is the HTML
// namespace."
function isHtmlElement(node) {
	return node
		&& node.nodeType == Node.ELEMENT_NODE
		&& isHtmlNamespace(node.namespaceURI);
}


/**
 * "A Node is effectively contained in a Range if either it is contained in the
 * Range; or it is the Range's start node, it is a Text node, and its length is
 * different from the Range's start offset; or it is the Range's end node, it
 * is a Text node, and the Range's end offset is not 0; or it has at least one
 * child, and all its children are effectively contained in the Range."
 */
function isEffectivelyContained(node, range) {
	if (isContained(node, range)) {
		return true;
	}
	if (node == range.startContainer
	&& node.nodeType == Node.TEXT_NODE
	&& getNodeLength(node) != range.startOffset) {
		return true;
	}
	if (node == range.endContainer
	&& node.nodeType == Node.TEXT_NODE
	&& range.endOffset != 0) {
		return true;
	}
	if (node.childNodes.length != 0) {
		for (var i = 0; i < node.childNodes.length; i++) {
			if (!isEffectivelyContained(node.childNodes[i], range)) {
				return false;
			}
		}
		return true;
	}
	return false;
}

function getActiveRange(doc) {
	// "Let selection be the result of calling getSelection() on the Document."
	//
	// We call getSelection() on defaultView instead, because Firefox and Opera
	// don't follow the DOM Range spec here:
	// https://bugzilla.mozilla.org/show_bug.cgi?id=636512
	var selection = doc.defaultView.getSelection();

	// "If there are no Ranges associated with selection, return null."
	if (selection.rangeCount == 0) {
		return null;
	}

	// "Let start be the boundary point with the earliest position among all of
	// selection's Ranges' starts."
	var startNode = null;
	var startOffset = null;
	for (var i = 0; i < selection.rangeCount; i++) {
		if (startNode === null) {
			startNode = selection.getRangeAt(i).startContainer;
			startOffset = selection.getRangeAt(i).startOffset;
			continue;
		}
		var testRange = doc.createRange();
		testRange.setStart(startNode, startOffset);
		if (testRange.compareBoundaryPoints(Range.START_TO_START, selection.getRangeAt(i)) < 0) {
			startNode = selection.getRangeAt(i).startContainer;
			startOffset = selection.getRangeAt(i).startOffset;
		}
	}

	// "Return the last Range in selection whose start is start."
	for (var i = selection.rangeCount - 1; i >= 0; i--) {
		if (selection.getRangeAt(i).startContainer == startNode
		&& selection.getRangeAt(i).startOffset == startOffset) {
			return selection.getRangeAt(i);
		}
	}
}

// "An unwrappable element is an HTML element which may not be used where only
// phrasing content is expected (not counting unknown or obsolete elements,
// which cannot be used at all); or any Element whose display property computes
// to something other than "inline", "inline-block", or "inline-table"."
//
// I don't bother implementing this exactly, just well enough for testing.
function isUnwrappableElement(node) {
	if (!node || node.nodeType != Node.ELEMENT_NODE) {
		return false;
	}

	var display = getComputedStyle(node).display;
	if (display != "inline"
	&& display != "inline-block"
	&& display != "inline-table") {
		return true;
	}

	if (!isHtmlElement(node)) {
		return false;
	}

	return [
		"h1", "h2", "h3", "h4", "h5", "h6", "p", "hr", "pre", "blockquote",
		"ol", "ul", "li", "dl", "dt", "dd", "div", "table", "caption",
		"colgroup", "col", "tbody", "thead", "tfoot", "tr", "th", "td",
		"address"
	].indexOf(node.tagName.toLowerCase()) != -1;
}

/**
 * "effective style" per edit command spec
 */
function getEffectiveStyle(node, property) {
	// "If node is neither an Element nor a Text node, return null."
	if (node.nodeType != Node.ELEMENT_NODE
	&& node.nodeType != Node.TEXT_NODE) {
		return null;
	}

	// "If node is a Text node and its parent is null, return null."
	if (node.nodeType == Node.TEXT_NODE
	&& !node.parentNode) {
		return null;
	}

	// "If node is a Text node, return the effective style of its parent for
	// property."
	if (node.nodeType == Node.TEXT_NODE) {
		return getEffectiveStyle(node.parentNode, property);
	}

	// "If property is "background-color":"
	if (property == "backgroundColor") {
		// "While the computed style of "background-color" on node is any
		// fully transparent value, and node's parent is an Element, set
		// node to its parent."
		//
		// Another lame hack to avoid flawed APIs.
		while ((getComputedStyle(node).backgroundColor == "rgba(0, 0, 0, 0)"
		|| getComputedStyle(node).backgroundColor === ""
		|| getComputedStyle(node).backgroundColor == "transparent")
		&& node.parentNode
		&& node.parentNode.nodeType == Node.ELEMENT_NODE) {
			node = node.parentNode;
		}

		// "If the computed style of "background-color" on node is a fully
		// transparent value, return "rgb(255, 255, 255)"."
		if (getComputedStyle(node).backgroundColor == "rgba(0, 0, 0, 0)"
        || getComputedStyle(node).backgroundColor === ""
        || getComputedStyle(node).backgroundColor == "transparent") {
			return "rgb(255, 255, 255)";
		}

		// "Otherwise, return the computed style of "background-color" for
		// node."
		return getComputedStyle(node).backgroundColor;
	}

	// "If property is "text-decoration", and the "text-decoration" property of
	// node or any of its ancestors computes to "underline", return
	// "underline". Otherwise, return "none"."
	if (property == "textDecoration") {
		do {
			if (getComputedStyle(node).textDecoration == "underline") {
				return "underline";
			}
			node = node.parentNode;
		} while (node && node.nodeType == Node.ELEMENT_NODE);
		return "none";
	}

	// "If property is "vertical-align":"
	if (property == "verticalAlign") {
		// "Let affected by subscript and affected by superscript be two
		// boolean variables, both initially false."
		var affectedBySubscript = false;
		var affectedBySuperscript = false;

		// "While node is an Element whose "display" property computes to
		// "inline":"
		while (node
		&& node.nodeType == Node.ELEMENT_NODE
		&& getComputedStyle(node).display == "inline") {
			var verticalAlign = getComputedStyle(node).verticalAlign;

			// "If node's "vertical-align" property computes to "sub", set
			// affected by subscript to true."
			if (verticalAlign == "sub") {
				affectedBySubscript = true;
			// "Otherwise, if node's "vertical-align" property computes to
			// "super", set affected by superscript to true."
			} else if (verticalAlign == "super") {
				affectedBySuperscript = true;
			// "Otherwise, if node's "vertical-align" property computes to some
			// value other than "baseline", return the string "mixed"."
			} else if (verticalAlign != "baseline") {
				return "mixed";
			}

			// "Set node to its parent."
			node = node.parentNode;
		}

		// "If affected by subscript and affected by superscript are both true,
		// return the string "mixed"."
		if (affectedBySubscript && affectedBySuperscript) {
			return "mixed";
		}

		// "If affected by subscript is true, return "sub"."
		if (affectedBySubscript) {
			return "sub";
		}

		// "If affected by superscript is true, return "super"."
		if (affectedBySuperscript) {
			return "super";
		}

		// "Return "baseline"."
		return "baseline";
	}

	// "Return the computed style of property for node."
	return getComputedStyle(node)[property];
}

/**
 * "specified style" per edit command spec
 */
function getSpecifiedStyle(element, property) {
	// "If property is "background-color" and the Element's display property
	// does not compute to "inline", return null."
	if (property == "backgroundColor"
	&& getComputedStyle(element).display != "inline") {
		return null;
	}

	// "If property is "vertical-align":"
	if (property == "verticalAlign") {
		// "If the computed value of the Element's "display" property is
		// neither "inline" nor "inline-block" nor "inline-table", return
		// null."
		var style = getComputedStyle(element);
		if (style.display != "inline"
		&& style.display != "inline-block"
		&& style.display != "inline-table") {
			return null;
		}

		// "If the Element has a style attribute set, and that attribute has
		// the effect of setting "vertical-align", return the value that it
		// sets "vertical-align" to."
		if (element.style.verticalAlign != "") {
			return element.style.verticalAlign;
		}

		// "If the Element is a sup, return "super"."
		if (isHtmlElement(element) && element.tagName == "SUP") {
			return "super";
		}

		// "If the Element is a sub, return "sub"."
		if (isHtmlElement(element) && element.tagName == "SUB") {
			return "sub";
		}

		// "Return null."
		return null;
	}

	// "If the Element has a style attribute set, and that attribute has the
	// effect of setting property, return the value that it sets property to."
	if (element.style[property] != "") {
		return element.style[property];
	}

	// "If the Element is a font element that has an attribute whose effect is
	// to create a presentational hint for property, return the value that the
	// hint sets property to."
	//
	// I'm cheating on this one for simplicity.  Font-size is especially wrong,
	// and will have to be fixed when I implement execCommand() for that.
	if (isHtmlNamespace(element.namespaceURI)
	&& element.tagName == "FONT") {
		if (property == "color" && element.hasAttribute("color")) {
			return element.color;
		}
		if (property == "fontFamily" && element.hasAttribute("face")) {
			return element.face;
		}
		if (property == "fontSize" && element.hasAttribute("size")) {
			return element.size;
		}
	}

	// "If the Element is in the following list, and property is equal to the
	// CSS property name listed for it, return the string listed for it."
	//
	// A list follows, whose meaning is copied here.
	if (property == "fontWeight"
	&& (element.tagName == "B" || element.tagName == "STRONG")) {
		return "bold";
	}
	if (property == "fontStyle"
	&& (element.tagName == "I" || element.tagName == "EM")) {
		return "italic";
	}
	if (property == "textDecoration"
	&& element.tagName == "U") {
		return "underline";
	}

	// "Return null."
	return null;
}

// "A styling element is a b, em, i, span, strong, sub, sup, or u element with
// no attributes except possibly style, or a font element with no attributes
// except possibly style, color, face, and/or size."
function isStylingElement(node) {
	if (!isHtmlElement(node)) {
		return false;
	}

	if (["B", "EM", "I", "SPAN", "STRONG", "SUB", "SUP", "U"].indexOf(node.tagName) != -1) {
		if (node.attributes.length == 0) {
			return true;
		}

		if (node.attributes.length == 1
		&& node.hasAttribute("style")) {
			return true;
		}
	}

	if (node.tagName == "FONT") {
		var numAttrs = node.attributes.length;

		if (node.hasAttribute("style")) {
			numAttrs--;
		}

		if (node.hasAttribute("color")) {
			numAttrs--;
		}

		if (node.hasAttribute("face")) {
			numAttrs--;
		}

		if (node.hasAttribute("size")) {
			numAttrs--;
		}

		if (numAttrs == 0) {
			return true;
		}
	}

	return false;
}

function isSimpleStylingElement(node) {
	// "A simple styling element is an HTML element for which at least one of
	// the following holds:"
	if (!isHtmlElement(node)) {
		return false;
	}

	// Only these elements can possibly be a simple styling element.
	if (["B", "EM", "FONT", "I", "SPAN", "STRONG", "SUB", "SUP", "U"].indexOf(node.tagName) == -1) {
		return false;
	}

	// "It is a b, em, font, i, span, strong, sub, sup, or u element with no
	// attributes."
	if (node.attributes.length == 0) {
		return true;
	}

	// If it's got more than one attribute, everything after this fails.
	if (node.attributes.length > 1) {
		return false;
	}

	// "It is a b, em, font, i, span, strong, sub, sup, or u element with
	// exactly one attribute, which is style, which sets no CSS properties
	// (including invalid or unrecognized properties)."
	//
	// Not gonna try for invalid or unrecognized.
	if (node.hasAttribute("style")
	&& node.style.length == 0) {
		return true;
	}

	// "It is a font element with exactly one attribute, which is either color,
	// face, or size."
	if (node.tagName == "FONT"
	&& (node.hasAttribute("color")
	|| node.hasAttribute("face")
	|| node.hasAttribute("size")
	)) {
		return true;
	}

	// "It is a b or strong element with exactly one attribute, which is style,
	// and the style attribute sets exactly one CSS property (including invalid
	// or unrecognized properties), which is "font-weight"."
	if ((node.tagName == "B" || node.tagName == "STRONG")
	&& node.hasAttribute("style")
	&& node.style.length == 1
	&& node.style.fontWeight != "") {
		return true;
	}

	// "It is an i or em element with exactly one attribute, which is style,
	// and the style attribute sets exactly one CSS property (including invalid
	// or unrecognized properties), which is "font-style"."
	if ((node.tagName == "I" || node.tagName == "EM")
	&& node.hasAttribute("style")
	&& node.style.length == 1
	&& node.style.fontStyle != "") {
		return true;
	}

	// "It is a u element with exactly one attribute, which is style, and the
	// style attribute sets exactly one CSS property (including invalid or
	// unrecognized properties), which is "text-decoration", which is set to
	// "underline" or "none"."
	if (node.tagName == "U"
	&& node.hasAttribute("style")
	&& node.style.length == 1
	&& (node.style.textDecoration == "underline"
	|| node.style.textDecoration == "none")) {
		return true;
	}

	// "It is a sub or sub element with exactly one attribute, which is style,
	// and the style attribute sets exactly one CSS property (including invalid
	// or unrecognized properties), which is "vertical-align"."
	if ((node.tagName == "SUB" || node.tagName == "SUP")
	&& node.hasAttribute("style")
	&& node.style.length == 1
	&& node.style.verticalAlign != "") {
		return true;
	}

	// "It is a font or span element with exactly one attribute, which is
	// style, and the style attribute sets exactly one CSS property (including
	// invalid or unrecognized properties)."
	if ((node.tagName == "FONT" || node.tagName == "SPAN")
	&& node.hasAttribute("style")
	&& node.style.length == 1) {
		return true;
	}

	return false;
}

function decomposeRange(range) {
	// "If range's start and end are the same, return an empty list."
	if (range.startContainer == range.endContainer
	&& range.startOffset == range.endOffset) {
		return [];
	}

	// "Let start node, start offset, end node, and end offset be range's start
	// and end nodes and offsets, respectively."
	var startNode = range.startContainer;
	var startOffset = range.startOffset;
	var endNode = range.endContainer;
	var endOffset = range.endOffset;

	// "If start node is a Text node and is the same as end node, and start
	// offset is neither 0 nor the length of start node:"
	if (startNode.nodeType == Node.TEXT_NODE
	&& startNode == endNode
	&& startOffset != 0
	&& startOffset != getNodeLength(startNode)) {
		// "Set start node to the result of running splitText(start offset) on
		// start node."
		startNode = startNode.splitText(startOffset);

		// "Set end node to start node."
		endNode = startNode;

		// "Set end offset to end offset − start offset."
		endOffset -= startOffset;

		// "Set start offset to 0."
		startOffset = 0;

	// "Otherwise, if start node is a Text node and start offset is neither 0
	// nor the length of start node:"
	} else if (startNode.nodeType == Node.TEXT_NODE
	&& startOffset != 0
	&& startOffset != getNodeLength(startNode)) {
		// "Set start node to the result of running splitText(start offset) on
		// start node."
		startNode = startNode.splitText(startOffset);

		// "Set start offset to 0."
		startOffset = 0;
	}

	// "If end node is a Text node and end offset is neither 0 nor the length
	// of end node, run splitText(end offset) on end node."
	if (endNode.nodeType == Node.TEXT_NODE
	&& endOffset != 0
	&& endOffset != getNodeLength(endNode)) {
		endNode.splitText(endOffset);
	}

	// "If start node is a Text node and start offset is 0, set start offset to
	// the index of start node, then set start node to its parent."
	if (startNode.nodeType == Node.TEXT_NODE
	&& startOffset == 0) {
		startOffset = getNodeIndex(startNode);
		startNode = startNode.parentNode;
	}

	// "If end node is a Text node and end offset is its length, set end offset
	// to one plus the index of end node, then set end node to its parent."
	if (endNode.nodeType == Node.TEXT_NODE
	&& endOffset == getNodeLength(endNode)) {
		endOffset = 1 + getNodeIndex(endNode);
		endNode = endNode.parentNode;
	}

	// "Set range's start to (start node, start offset) and its end to (end
	// node, end offset)."
	range.setStart(startNode, startOffset);
	range.setEnd(endNode, endOffset);

	// "Let cloned range be the result of calling cloneRange() on range."
	var clonedRange = range.cloneRange();

	// "While the start offset of cloned range is 0, and the parent of cloned
	// range's start node is not null, set the start of cloned range to (parent
	// of start node, index of start node)."
	while (clonedRange.startOffset == 0
	&& clonedRange.startContainer.parentNode) {
		clonedRange.setStart(clonedRange.startContainer.parentNode, getNodeIndex(clonedRange.startContainer));
	}

	// "While the end offset of cloned range equals the length of its end node,
	// and the parent of clone range's end node is not null, set the end of
	// cloned range to (parent of end node, 1 + index of end node)."
	while (clonedRange.endOffset == getNodeLength(clonedRange.endContainer)
	&& clonedRange.endContainer.parentNode) {
		clonedRange.setEnd(clonedRange.endContainer.parentNode, 1 + getNodeIndex(clonedRange.endContainer));
	}

	// "Return a list consisting of every Node contained in cloned range in
	// tree order, omitting any whose parent is also contained in cloned
	// range."
	var ret = [];
	for (var node = clonedRange.startContainer; node != nextNodeDescendants(clonedRange.endContainer); node = nextNode(node)) {
		if (isContained(node, clonedRange)
		&& !isContained(node.parentNode, clonedRange)) {
			ret.push(node);
		}
	}
	return ret;
}

function clearStyles(element, property) {
	// "If element's specified style for property is null, return the empty
	// list."
	if (getSpecifiedStyle(element, property) === null) {
		return [];
	}

	// "If element is a simple styling element:"
	if (isSimpleStylingElement(element)) {
		// "Let children be an empty list of Nodes."
		var children = [];

		// "While element has children:"
		while (element.hasChildNodes()) {
			// "Let child be the first child of element."
			var child = element.firstChild;

			// "Append child to children."
			children.push(child);

			// "Insert child as the previous sibling of element."
			element.parentNode.insertBefore(child, element);
		}

		// "Remove element from its parent."
		element.parentNode.removeChild(element);

		// "Return children."
		return children;
	}

	// "Unset the CSS property property of element."
	element.style[property] = '';
	if (element.getAttribute("style") == "") {
		element.removeAttribute("style");
	}

	// "If element is a font element:"
	if (isHtmlNamespace(element.namespaceURI) && element.tagName == "FONT") {
		// "If property is "color", unset element's color attribute, if set."
		if (property == "color") {
			element.removeAttribute("color");
		}

		// "If property is "font-family", unset element's face attribute, if
		// set."
		if (property == "fontFamily") {
			element.removeAttribute("face");
		}

		// "If property is "font-size", unset element's size attribute, if
		// set."
		if (property == "fontSize") {
			element.removeAttribute("size");
		}
	}

	// "If element's specified style for property is null, return the empty
	// list."
	if (getSpecifiedStyle(element, property) === null) {
		return [];
	}

	// "Let new element be a new HTML element with name "span", with the
	// same attributes and ownerDocument as element."
	var newElement = element.ownerDocument.createElement("span");
	for (var j = 0; j < element.attributes.length; j++) {
		// FIXME: Namespaces?
		newElement.setAttribute(element.attributes[j].localName, element.attributes[j].value);
	}

	// "Append new element to element's parent as the previous sibling of
	// element."
	element.parentNode.insertBefore(newElement, element);

	// "While element has children, append its first child as the last
	// child of new element."
	while (element.hasChildNodes()) {
		newElement.appendChild(element.firstChild);
	}

	// "Remove element from its parent."
	element.parentNode.removeChild(element);

	// "Return the one-Node list consisting of new element."
	return [newElement];
}

function pushDownStyles(node, property, newValue) {
	// "If node's parent is not an Element, abort this algorithm."
	if (!node.parentNode
	|| node.parentNode.nodeType != Node.ELEMENT_NODE) {
		return;
	}

	// "If the effective style of property is new value on node, abort this
	// algorithm."
	if (cssValuesEqual(property, getEffectiveStyle(node, property), newValue)) {
		return;
	}

	// "Let current ancestor be node's parent."
	var currentAncestor = node.parentNode;

	// "Let ancestor list be a list of Nodes, initially empty."
	var ancestorList = [];

	// "While current ancestor is an Element and the effective style of
	// property is not new value on it, append current ancestor to ancestor
	// list, then set current ancestor to its parent."
	while (currentAncestor
	&& currentAncestor.nodeType == Node.ELEMENT_NODE
	&& !cssValuesEqual(property, getEffectiveStyle(currentAncestor, property), newValue)) {
		ancestorList.push(currentAncestor);
		currentAncestor = currentAncestor.parentNode;
	}

	// "If ancestor list is not empty, and the specified style of property on
	// the last member of ancestor list is null, abort this algorithm."
	if (ancestorList.length != 0
	&& getSpecifiedStyle(ancestorList[ancestorList.length - 1], property) === null) {
		return;
	}

	// "If ancestor list is not empty, and the parent of the last member of
	// ancestor list is not an Element, abort this algorithm."
	if (ancestorList.length != 0
	&& (!ancestorList.slice(-1)[0]
	|| ancestorList.slice(-1)[0].nodeType != Node.ELEMENT_NODE)) {
		return;
	}

	// "While ancestor list is not empty:"
	while (ancestorList.length) {
		// "Let current ancestor be the last member of ancestor list."
		// "Remove the last member from ancestor list."
		var currentAncestor = ancestorList.pop();

		// "Let propagated value be the specified style of current ancestor for
		// property."
		var propagatedValue = getSpecifiedStyle(currentAncestor, property);

		// "If propagated value is null, continue this loop from the
		// beginning."
		if (propagatedValue === null) {
			continue;
		}

		// "Let children be the children of current ancestor."
		var children = [];
		for (var i = 0; i < currentAncestor.childNodes.length; i++) {
			children.push(currentAncestor.childNodes[i]);
		}

		// "Clear styles on current ancestor."
		clearStyles(currentAncestor, property);

		// "For every child in children:"
		for (var i = 0; i < children.length; i++) {
			var child = children[i];

			// "If child is node, continue with the next child."
			if (child == node) {
				continue;
			}

			// "If child is an Element whose specified style for property name
			// is neither null nor equal to propagated value, continue with the
			// next child."
			if (child.nodeType == Node.ELEMENT_NODE
			&& getSpecifiedStyle(child, property) !== null
			&& !cssValuesEqual(property, propagatedValue, getSpecifiedStyle(child, property))) {
				continue;
			}

			// "If child is the last member of ancestor list, set child's CSS
			// property property to propagated value and continue with the next
			// child."
			if (child == ancestorList[ancestorList.length - 1]) {
				child.style[property] = propagatedValue;
				continue;
			}

			// "Force the style of child, with property as in this algorithm
			// and new value equal to propagated value."
			forceStyle(child, property, propagatedValue);
		}
	}
}

function forceStyle(node, property, newValue) {
	// "If node's parent is null, abort this algorithm."
	if (!node.parentNode) {
		return;
	}

	// "If node is an Element, Text, Comment, or ProcessingInstruction node,
	// and is not an unwrappable element:"
	if ((node.nodeType == Node.ELEMENT_NODE
	|| node.nodeType == Node.TEXT_NODE
	|| node.nodeType == Node.COMMENT_NODE
	|| node.nodeType == Node.PROCESSING_INSTRUCTION_NODE)
	&& !isUnwrappableElement(node)) {
		// "Let candidate be node's previousSibling."
		var candidate = node.previousSibling;

		// "While candidate is a styling element, and candidate has exactly one
		// child, and that child is also a styling element, and candidate is
		// not a simple styling element or candidate's specified style for
		// property is not new value, set candidate to its child."
		while (isStylingElement(candidate)
		&& candidate.childNodes.length == 1
		&& isStylingElement(candidate.firstChild)
		&& (!isSimpleStylingElement(candidate)
		|| !cssValuesEqual(property, getSpecifiedStyle(candidate, property), newValue))) {
			candidate = candidate.firstChild;
		}

		// "If candidate is a simple styling element whose specified style and
		// effective style for property are both new value, and candidate is
		// not the previousSibling of node:"
		if (isSimpleStylingElement(candidate)
		&& cssValuesEqual(property, getSpecifiedStyle(candidate, property), newValue)
		&& cssValuesEqual(property, getEffectiveStyle(candidate, property), newValue)
		&& candidate != node.previousSibling) {
			// "While candidate has children, append the first child of
			// candidate as the last child of candidate's parent."
			while (candidate.childNodes.length > 0) {
				candidate.parentNode.appendChild(candidate.firstChild);
			}

			// "Insert candidate into node's parent before node."
			node.parentNode.insertBefore(candidate, node);

			// "Append the previousSibling of candidate as the last child of
			// candidate."
			candidate.appendChild(candidate.previousSibling);
		}

		// "Let candidate be node's nextSibling."
		var candidate = node.nextSibling;

		// "While candidate is a styling element, and candidate has exactly one
		// child, and that child is also a styling element, and candidate is
		// not a simple styling element or candidate's specified style for
		// property is not new value, set candidate to its child."
		while (isStylingElement(candidate)
		&& candidate.childNodes.length == 1
		&& isStylingElement(candidate.firstChild)
		&& (!isSimpleStylingElement(candidate)
		|| !cssValuesEqual(property, getSpecifiedStyle(candidate, property), newValue))) {
			candidate = candidate.firstChild;
		}

		// "If candidate is a simple styling element whose specified style and
		// effective style for property are both new value, and candidate is
		// not the nextSibling of node:"
		if (isSimpleStylingElement(candidate)
		&& cssValuesEqual(property, getSpecifiedStyle(candidate, property), newValue)
		&& cssValuesEqual(property, getEffectiveStyle(candidate, property), newValue)
		&& candidate != node.nextSibling) {
			// "While candidate has children, append the first child of
			// candidate as the last child of candidate's parent."
			while (candidate.childNodes.length > 0) {
				candidate.parentNode.appendChild(candidate.firstChild);
			}

			// "Insert candidate into node's parent after node."
			node.parentNode.insertBefore(candidate, node.nextSibling);

			// "Append the nextSibling of candidate as the last child of
			// candidate."
			candidate.appendChild(candidate.nextSibling);
		}

		// "Let previous sibling and next sibling be node's previousSibling and
		// nextSibling."
		var previousSibling = node.previousSibling;
		var nextSibling = node.nextSibling;

		// "If previous sibling is a simple styling element whose specified
		// style and effective style for property are both new value, append
		// node as the last child of previous sibling."
		if (isSimpleStylingElement(previousSibling)
		&& cssValuesEqual(property, getSpecifiedStyle(previousSibling, property), newValue)
		&& cssValuesEqual(property, getEffectiveStyle(previousSibling, property), newValue)) {
			previousSibling.appendChild(node);
		}

		// "If next sibling is a simple styling element whose specified style
		// and effective style for property are both new value:"
		if (isSimpleStylingElement(nextSibling)
		&& cssValuesEqual(property, getSpecifiedStyle(nextSibling, property), newValue)
		&& cssValuesEqual(property, getEffectiveStyle(nextSibling, property), newValue)) {
			// "If node is not a child of previous sibling, insert node as the
			// first child of next sibling."
			if (node.parentNode != previousSibling) {
				nextSibling.insertBefore(node, nextSibling.firstChild);
			// "Otherwise, while next sibling has children, append the first
			// child of next sibling as the last child of previous sibling.
			// Then remove next sibling from its parent."
			} else {
				while (nextSibling.childNodes.length) {
					previousSibling.appendChild(nextSibling.firstChild);
				}
				nextSibling.parentNode.removeChild(nextSibling);
			}
		}
	}

	// "If the effective style of property is new value on node, abort this
	// algorithm."
	if (cssValuesEqual(property, getEffectiveStyle(node, property), newValue)) {
		return;
	}

	// "If node is an unwrappable element:"
	if (isUnwrappableElement(node)) {
		// "Let children be all children of node, omitting any that are
		// Elements whose specified style for property is neither null nor
		// equal to new value."
		var children = [];
		for (var i = 0; i < node.childNodes.length; i++) {
			if (node.childNodes[i].nodeType == Node.ELEMENT_NODE) {
				var specifiedStyle = getSpecifiedStyle(node.childNodes[i], property);

				if (specifiedStyle !== null
				&& !cssValuesEqual(property, newValue, specifiedStyle)) {
					continue;
				}
			}
			children.push(node.childNodes[i]);
		}

		// "Force the style of each Node in children, with property and new
		// value as in this invocation of the algorithm."
		for (var i = 0; i < children.length; i++) {
			forceStyle(children[i], property, newValue);
		}

		// "Abort this algorithm."
		return;
	}

	// "If node is a Comment or ProcessingInstruction, abort this algorithm."
	if (node.nodeType == Node.COMMENT_NODE
	|| node.nodeType == Node.PROCESSING_INSTRUCTION_NODE) {
		return;
	}

	// "If the effective style of property is new value on node, abort this
	// algorithm."
	if (cssValuesEqual(property, getEffectiveStyle(node, property), newValue)) {
		return;
	}

	// "Let new parent be null."
	var newParent = null;

	// "If the CSS styling flag is false:"
	if (!cssStylingFlag) {
		// "If property is "font-weight" and new value is "bold", let new
		// parent be the result of calling createElement("b") on the
		// ownerDocument of node."
		if (property == "fontWeight" && (newValue == "bold" || newValue == "700")) {
			newParent = node.ownerDocument.createElement("b");
		}

		// "If property is "font-style" and new value is "italic", let new
		// parent be the result of calling createElement("i") on the
		// ownerDocument of node."
		if (property == "fontStyle" && newValue == "italic") {
			newParent = node.ownerDocument.createElement("i");
		}

		// "If property is "text-decoration" and new value is "underline", let
		// new parent be the result of calling createElement("u") on the
		// ownerDocument of node."
		if (property == "textDecoration" && newValue == "underline") {
			newParent = node.ownerDocument.createElement("u");
		}

		// "If property is "color", let new parent be the result of calling
		// createElement("font") on the ownerDocument of node, then set the
		// color attribute of new parent to new value."
		if (property == "color") {
			newParent = node.ownerDocument.createElement("font");
			newParent.color = newValue;
		}

		// "If property is "font-family", let new parent be the result of
		// calling createElement("font") on the ownerDocument of node, then set
		// the face attribute of new parent to new value."
		if (property == "fontFamily") {
			newParent = node.ownerDocument.createElement("font");
			newParent.face = newValue;
		}

		// "If property is "font-size", let new parent be the result of calling
		// createElement("font") on the ownerDocument of node, then set the
		// size attribute of new parent to new value."
		if (property == "fontSize") {
			newParent = node.ownerDocument.createElement("font");
			newParent.size = newValue;
		}
	}

	// "If property is "vertical-align" and new value is "sub", let new parent
	// be the result of calling createElement("sub") on the ownerDocument of
	// node."
	if (property == "verticalAlign" && newValue == "sub") {
		newParent = node.ownerDocument.createElement("sub");
	}

	// "If property is "vertical-align" and new value is "super", let new
	// parent be the result of calling createElement("sup") on the
	// ownerDocument of node."
	if (property == "verticalAlign" && newValue == "super") {
		newParent = node.ownerDocument.createElement("sup");
	}

	// "If new parent is null, let new parent be the result of calling
	// createElement("span") on the ownerDocument of node."
	if (!newParent) {
		newParent = node.ownerDocument.createElement("span");
	}

	// "Insert new parent in node's parent before node."
	node.parentNode.insertBefore(newParent, node);

	// "If the effective style of property for new parent is not new value, set
	// the CSS property property of new parent to new value."
	if (!cssValuesEqual(property, getEffectiveStyle(newParent, property), newValue)) {
		newParent.style[property] = newValue;
	}

	// "Append node to new parent as its last child."
	newParent.appendChild(node);

	// "If node is an Element and the effective style of property for node is
	// not new value:"
	if (node.nodeType == Node.ELEMENT_NODE
	&& !cssValuesEqual(property, getEffectiveStyle(node, property), newValue)) {
		// "Insert node into the parent of new parent before new parent."
		newParent.parentNode.insertBefore(node, newParent);

		// "Remove new parent from its parent."
		newParent.parentNode.removeChild(newParent);

		// "If new parent is a span, set the CSS property property of node to
		// new value."
		if (newParent.tagName == "SPAN") {
			node.style[property] = newValue;

			// "Otherwise:"
		} else {
			// "Let children be all children of node, omitting any that are
			// Elements whose specified style for property is neither null nor
			// equal to new value."
			var children = [];
			for (var i = 0; i < node.childNodes.length; i++) {
				if (node.childNodes[i].nodeType == Node.ELEMENT_NODE) {
					var specifiedStyle = getSpecifiedStyle(node.childNodes[i], property);

					if (specifiedStyle !== null
					&& !cssValuesEqual(property, newValue, specifiedStyle)) {
						continue;
					}
				}
				children.push(node.childNodes[i]);
			}

			// "Force the style of each Node in children, with property and new
			// value as in this invocation of the algorithm."
			for (var i = 0; i < children.length; i++) {
				forceStyle(children[i], property, newValue);
			}
		}
	}
}

function styleNode(node, property, newValue) {
	// "If node is a Document, style its Element child (if it has one) and
	// abort this algorithm."
	if (node.nodeType == Node.DOCUMENT_NODE) {
		for (var i = 0; i < node.childNodes.length; i++) {
			if (node.childNodes[i].nodeType == Node.ELEMENT_NODE) {
				styleNode(node.childNodes[i], property, newValue);
				break;
			}
		}
		return;
	}

	// "If node is a DocumentFragment, let children be a list of its children.
	// Style each member of children, then abort this algorithm."
	if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
		var children = [];
		for (var i = 0; i < node.childNodes.length; i++) {
			children.push(node.childNodes[i]);
		}
		for (var i = 0; i < children.length; i++) {
			styleNode(children[i], property, newValue);
		}
		return;
	}

	// "If node's parent is null, or if node is a DocumentType, abort this
	// algorithm."
	if (!node.parentNode || node.nodeType == Node.DOCUMENT_TYPE_NODE) {
		return;
	}

	// "If node is an Element:"
	if (node.nodeType == Node.ELEMENT_NODE) {
		// "Clear styles on node, and let new nodes be the result."
		var newNodes = clearStyles(node, property);

		// "For each new node in new nodes, style new node, with the same
		// inputs as this invocation of the algorithm."
		for (var i = 0; i < newNodes.length; i++) {
			styleNode(newNodes[i], property, newValue);
		}

		// "If node's parent is null, abort this algorithm."
		if (!node.parentNode) {
			return;
		}
	}

	// "Push down styles on node."
	pushDownStyles(node, property, newValue);

	// "Force the style of node."
	forceStyle(node, property, newValue);

	// "Let children be the children of node."
	var children = [];
	for (var i = 0; i < node.childNodes.length; i++) {
		children.push(node.childNodes[i]);
	}

	// "Style each member of children."
	for (var i = 0; i < children.length; i++) {
		styleNode(children[i], property, newValue);
	}
}

function myExecCommand(commandId, showUI, value, range) {
	commandId = commandId.toLowerCase();

	if (commandId != "stylewithcss" && commandId != "usecss") {
		if (typeof range == "undefined") {
			range = getActiveRange(document);
		}

		if (!range) {
			return;
		}
	}

	switch (commandId) {
		case "bold":
		// "Decompose the Range. If the state of the Range for this command is
		// then true, style each returned Node with property "font-weight" and
		// new value "normal". Otherwise, style them with new value "bold"."
		var nodeList = decomposeRange(range);
		var newValue = getState("bold", range) ? "normal" : "bold";
		for (var i = 0; i < nodeList.length; i++) {
			styleNode(nodeList[i], "fontWeight", newValue);
		}
		break;

		/*
		case "createlink":
		// "If value is the empty string, do nothing."
		if (value === "") {
			break;
		}

		// "Let node list be the result of decomposing the Range."
		var nodeList = decomposeRange(range);

		// "For each node in node list, in order:"
		for (var i = 0; i < nodeList.length; i++) {
			var node = nodeList[i];

			// "Let text nodes be a list of all Text node descendants of node,
			// or node itself if it's a Text node."
			var textNodes = [];
			if (node.nodeType == Node.TEXT_NODE) {
				textNodes.push(node);
			} else {
				for (var cur = node.firstChild;
				cur && cur.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINS;
				cur = nextNode(cur)) {
					if (cur.nodeType == Node.TEXT_NODE) {
						textNodes.push(cur);
					}
				}
			}

			// "For each text node in text nodes, in tree order:"
			for (var j = 0; j < textNodes.length; j++) {
				var textNode = textNodes[j];

				// "Let ancestor link be the parent of text node."
				var ancestorLink = textNode.parentNode;

				// "While ancestor link is not an HTML element, or its local
				// name is not "a", or it has no HTML attribute with local name
				// "href":"
				while (!isHtmlNamespace(ancestorLink.namespaceURI)
				|| ancestorLink.nodeType != Node.ELEMENT_NODE
				|| ancestorLink.tagName != "A"
				|| !ancestorLink.hasAttribute("href")) {
					// "If the parent of ancestor link is not an Element, set
					// ancestor link to null and break from this loop."
					if (!ancestorLink.parentNode
					|| ancestorLink.parentNode.nodeType != Node.ELEMENT_NODE) {
						ancestorLink = null;
						break;
					}

					// "Otherwise, set ancestor link to its parent."
					ancestorLink = ancestorLink.parentNode;
				}

				// "If ancestor link is not null, set its "href" attribute to
				// value and continue with the next text node."
				if (ancestorLink) {
					ancestorLink.setAttribute("href", value);
					continue;
				}

				// "Let new parent be a new HTML element with local name "a",
				// the same ownerDocument as text node, and a single HTML
				// attribute with local name "href" and value value."
				var newParent = textNode.ownerDocument.createElement("a");
				newParent.setAttribute("href", value);

				// "Insert new parent into text node's parent as the previous
				// sibling of text node."
				textNode.parentNode.insertBefore(newParent, textNode);

				// "Append text node to new parent as its last child."
				newParent.appendChild(textNode);
			}
		}
		*/

		case "fontname":
		// "Decompose the Range, then style each returned Node with property
		// equal to "font-family" and new value equal to value."
		var nodeList = decomposeRange(range);
		for (var i = 0; i < nodeList.length; i++) {
			styleNode(nodeList[i], "fontFamily", value);
		}
		break;

		case "forecolor":
		// "If value is not a valid CSS color, the user agent must do nothing
		// and abort these steps. Otherwise, it must decompose the Range, then
		// style each returned Node with property equal to "color" and new
		// value equal to value."
		//
		// Ignore validation for now.
		var nodeList = decomposeRange(range);
		for (var i = 0; i < nodeList.length; i++) {
			styleNode(nodeList[i], "color", value);
		}
		break;

		case "hilitecolor":
		// "If value is not a valid CSS color, do nothing and abort these
		// steps. Otherwise, decompose the Range, then style each returned Node
		// with property equal to "background-color" and new value equal to
		// value."
		//
		// Ignore validation for now.
		var nodeList = decomposeRange(range);
		for (var i = 0; i < nodeList.length; i++) {
			styleNode(nodeList[i], "backgroundColor", value);
		}
		break;

		case "italic":
		// "Decompose the Range. If the state of the Range for this command is
		// then true, style each returned Node with property "font-style" and
		// new value "normal". Otherwise, style them with new value "italic"."
		var nodeList = decomposeRange(range);
		var newValue = getState("italic", range) ? "normal" : "italic";
		for (var i = 0; i < nodeList.length; i++) {
			styleNode(nodeList[i], "fontStyle", newValue);
		}
		break;

		case "stylewithcss":
		// "Convert value to a boolean according to the algorithm in WebIDL,
		// and set the CSS styling flag to the result."
		cssStylingFlag = Boolean(value);
		break;

		case "subscript":
		// "Decompose the Range. If the state of the Range for this command is
		// then true, style each returned Node with property "vertical-align"
		// and new value "baseline". Otherwise, style them with new value
		// "baseline", then style them again with new value "sub"."
		var nodeList = decomposeRange(range);
		if (getState(commandId, range)) {
			for (var i = 0; i < nodeList.length; i++) {
				styleNode(nodeList[i], "verticalAlign", "baseline");
			}
		} else {
			for (var i = 0; i < nodeList.length; i++) {
				styleNode(nodeList[i], "verticalAlign", "baseline");
			}
			for (var i = 0; i < nodeList.length; i++) {
				styleNode(nodeList[i], "verticalAlign", "sub");
			}
		}
		break;

		case "superscript":
		// "Decompose the Range. If the state of the Range for this command is
		// then true, style each returned Node with property "vertical-align"
		// and new value "baseline". Otherwise, style them with new value
		// "baseline", then style them again with new value "super"."
		var nodeList = decomposeRange(range);
		if (getState(commandId, range)) {
			for (var i = 0; i < nodeList.length; i++) {
				styleNode(nodeList[i], "verticalAlign", "baseline");
			}
		} else {
			for (var i = 0; i < nodeList.length; i++) {
				styleNode(nodeList[i], "verticalAlign", "baseline");
			}
			for (var i = 0; i < nodeList.length; i++) {
				styleNode(nodeList[i], "verticalAlign", "super");
			}
		}
		break;

		case "underline":
		// "Decompose the Range. If the state of the Range for this command is
		// then true, style each returned Node with property "text-decoration"
		// and new value "none". Otherwise, style them with new value
		// "underline"."
		var nodeList = decomposeRange(range);
		var newValue = getState("underline", range) ? "none" : "underline";
		for (var i = 0; i < nodeList.length; i++) {
			styleNode(nodeList[i], "textDecoration", newValue);
		}
		break;

		case "usecss":
		// "Convert value to a boolean according to the algorithm in WebIDL,
		// and set the CSS styling flag to the negation of the result."
		cssStylingFlag = !value;
		break;

		default:
		break;
	}
}

function myQueryCommandState(commandId) {
	commandId = commandId.toLowerCase();
	var range = getActiveRange(document);

	if (!range) {
		return false;
	}

	return getState(commandId, range);
}

function getState(commandId, range) {
	if (commandId == "stylewithcss") {
		return cssStylingFlag;
	}

	if (commandId != "bold"
	&& commandId != "italic"
	&& commandId != "underline"
	&& commandId != "subscript"
	&& commandId != "superscript") {
		return false;
	}

	// XXX: This algorithm for getting all effectively contained nodes might be
	// wrong . . .
	var node = range.startContainer;
	while (node.parentNode && node.parentNode.firstChild == node) {
		node = node.parentNode;
	}
	var stop = nextNode(range.endContainer);

	for (; node && node != nextNodeDescendants(range.endContainer); node = nextNode(node)) {
		if (!isEffectivelyContained(node, range)) {
			continue;
		}

		if (node.nodeType != Node.TEXT_NODE) {
			continue;
		}

		if (commandId == "bold") {
			// "True if every Text node that is effectively contained in the
			// Range has effective style either null or at least 700 for
			// font-weight. Otherwise false."
			var weight = getEffectiveStyle(node, "fontWeight");
			if (weight !== null
			&& weight !== "bold"
			&& weight !== "700"
			&& weight !== "800"
			&& weight !== "900") {
				return false;
			}
		} else if (commandId == "italic") {
			// "True if every Text node that is effectively contained in the
			// Range has effective style either null, "italic", or "oblique"
			// for font-style. Otherwise false."
			var style = getEffectiveStyle(node, "fontStyle");
			if (style !== null
			&& style !== "italic"
			&& style !== "oblique") {
				return false;
			}
		} else if (commandId == "underline") {
			// "True if every Text node that is effectively contained in the
			// Range has effective style either null or "underline" for
			// text-decoration. Otherwise false."
			var decoration = getEffectiveStyle(node, "textDecoration");
			if (decoration !== null && decoration !== "underline") {
				return false;
			}
		} else if (commandId == "subscript") {
			// "True if every Text node that is effectively contained in the
			// Range has effective style either null or "sub" for
			// "vertical-align". Otherwise false."
			var verticalAlign = getEffectiveStyle(node, "verticalAlign");
			if (verticalAlign !== null && verticalAlign !== "sub") {
				return false;
			}
		} else if (commandId == "superscript") {
			// "True if every Text node that is effectively contained in the
			// Range has effective style either null or "super" for
			// "vertical-align". Otherwise false."
			var verticalAlign = getEffectiveStyle(node, "verticalAlign");
			if (verticalAlign !== null && verticalAlign !== "super") {
				return false;
			}
		}
	}

	return true;
}

function myQueryCommandValue(commandId) {
	commandId = commandId.toLowerCase();
	var range = getActiveRange(document);

	if (!range) {
		return "";
	}

	return "";
	/*
	var style = getComputedStyle(beginningElement(range));

	switch (commandId) {
		case "backcolor":
		// "Let element be the beginning element of the Range."
		var element = beginningElement(range);
		// "While the computed style of "background-color" on element is any
		// fully transparent value, set element to its parent."
		while (element.nodeType == Node.ELEMENT_NODE
		&& (getComputedStyle(element).backgroundColor == "rgba(0, 0, 0, 0)"
		|| getComputedStyle(element).backgroundColor === ""
		|| getComputedStyle(element).backgroundColor == "transparent")) {
			element = element.parentNode;
		}
		// "Return the computed style of "background-color" for element."
		if (element.nodeType != Node.ELEMENT_NODE) {
			return 'rgb(255, 255, 255)';
		}
		return getComputedStyle(element).backgroundColor;

		case "fontname":
		return style.fontFamily;

		case "forecolor":
		return style.color;

		default:
		return "";
	}*/
}

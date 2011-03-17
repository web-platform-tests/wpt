"use strict";

var htmlNamespace = "http://www.w3.org/1999/xhtml";

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
 * is a Text node, and the Range's end offset is not 0."
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
// which cannot be used at all)."
//
// I don't bother implementing this exactly, just well enough for testing.
function isUnwrappableElement(node) {
	if (!isHtmlElement(node)) {
		return false;
	}

	return [
		"h1", "h2", "h3", "h4", "h5", "h6", "p", "hr", "pre", "blockquote",
		"ol", "ul", "li", "dl", "dt", "dd", "div", "table", "caption",
		"colgroup", "col", "tbody", "thead", "tfoot", "tr", "th", "td",
	].indexOf(node.tagName.toLowerCase()) != -1;
}

/**
 * "specified style" per edit command spec
 */
function getSpecifiedStyle(element, property) {
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

function isSimpleStylingElement(node) {
	// "A simple styling element is an HTML element for which at least one of
	// the following holds:"
	if (!isHtmlElement(node)) {
		return false;
	}

	// "It is a b, em, font, i, span, strong, or u element with no attributes."
	if (node.attributes.length == 0
	&& ["B", "EM", "FONT", "I", "SPAN", "STRONG", "U"].indexOf(node.tagName) != -1) {
		return true;
	}

	// If it's got more than one attribute, everything after this fails.
	if (node.attributes.length > 1) {
		return false;
	}

	// "It is a b, em, font, i, span, strong, or u element with exactly one
	// attribute, which is style, which sets no CSS properties (including
	// invalid or unrecognized properties)."
	//
	// Not gonna try for invalid or unrecognized.
	if (node.hasAttribute("style")
	&& node.style.length == 0) {
		return true;
	}

	// "It is a font element with one attribute, which is either color, face,
	// or size."
	if (node.tagName == "FONT"
	&& (node.hasAttribute("color")
		|| node.hasAttribute("face")
		|| node.hasAttribute("size")
	)) {
		return true;
	}

	// "It is a b or strong element with one attribute, which is style, and the
	// only CSS property set by the style attribute (including invalid or
	// unrecognized properties) is "font-weight"."
	if ((node.tagName == "B" || node.tagName == "STRONG")
	&& node.hasAttribute("style")
	&& node.style.length == 1
	&& node.style.fontWeight != "") {
		return true;
	}

	// "It is an i or em element with one attribute, which is style, and the
	// only CSS property set by the style attribute (including invalid or
	// unrecognized properties) is "font-style"."
	if ((node.tagName == "I" || node.tagName == "EM")
	&& node.hasAttribute("style")
	&& node.style.length == 1
	&& node.style.fontStyle != "") {
		return true;
	}

	// "It is a u element with one attribute, which is style, and the only CSS
	// property set by the style attribute (including invalid or unrecognized
	// properties) is "text-decoration", which is set to "underline" or
	// "none"."
	if (node.tagName == "U"
	&& node.hasAttribute("style")
	&& node.style.length == 1
	&& node.style.textDecoration != "") {
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
	// "If element is a simple styling element and its specified style for
	// property is not null:"
	if (isSimpleStylingElement(element) && getSpecifiedStyle(element, property) !== null) {
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

	// "If node is an Element and property computes to new value on node, abort
	// this algorithm."
	if (node.nodeType == Node.ELEMENT_NODE
	&& cssValuesEqual(property, getComputedStyle(node)[property], newValue)) {
		return;
	}

	// "If node is not an Element and property computes to new value on node's
	// parent, abort this algorithm."
	if (node.nodeType != Node.ELEMENT_NODE
	&& cssValuesEqual(property, getComputedStyle(node.parentNode)[property], newValue)) {
		return;
	}

	// "Let current ancestor be node's parent."
	var currentAncestor = node.parentNode;

	// "Let ancestor list be a list of Nodes, initially empty."
	var ancestorList = [];

	// "While current ancestor is an Element and property does not compute to
	// new value on it, append current ancestor to ancestor list, then set
	// current ancestor to its parent."
	while (currentAncestor
	&& currentAncestor.nodeType == Node.ELEMENT_NODE
	&& !cssValuesEqual(property, getComputedStyle(currentAncestor)[property], newValue)) {
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
	// "If node is an Element and property computes to new value on node, abort
	// this algorithm."
	if (node.nodeType == Node.ELEMENT_NODE
	&& cssValuesEqual(property, getComputedStyle(node)[property], newValue)) {
		return;
	}

	// "If node is not an Element, node's parent is an Element, and property
	// computes to new value on node's parent, abort this algorithm."
	if (node.nodeType != Node.ELEMENT_NODE
	&& node.parentNode.nodeType == Node.ELEMENT_NODE
	&& cssValuesEqual(property, getComputedStyle(node.parentNode)[property], newValue)) {
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

	// "If node's previousSibling is a simple styling element whose specified
	// style and computed style for property are both new value, append node as
	// the last child of its previousSibling and abort this algorithm."
	if (isSimpleStylingElement(node.previousSibling)
	&& cssValuesEqual(property, getSpecifiedStyle(node.previousSibling, property), newValue)
	&& cssValuesEqual(property, getComputedStyle(node.previousSibling)[property], newValue)) {
		node.previousSibling.appendChild(node);
		return;
	}

	// "If node's nextSibling is a simple styling element whose specified style
	// and computed style for property are both new value, insert node as the
	// first child of its nextSibling and abort this algorithm."
	if (isSimpleStylingElement(node.nextSibling)
	&& cssValuesEqual(property, getSpecifiedStyle(node.nextSibling, property), newValue)
	&& cssValuesEqual(property, getComputedStyle(node.nextSibling)[property], newValue)) {
		node.nextSibling.insertBefore(node, node.nextSibling.childNodes.length
			? node.nextSibling.childNodes[0]
			: null);
		return;
	}

	// "If node is a Comment or ProcessingInstruction, abort this algorithm."
	if (node.nodeType == Node.COMMENT_NODE
	|| node.nodeType == Node.PROCESSING_INSTRUCTION_NODE) {
		return;
	}

	// "If node is an Element and property computes to new value on node, abort
	// this algorithm."
	if (node.nodeType == Node.ELEMENT_NODE
	&& cssValuesEqual(property, getComputedStyle(node)[property], newValue)) {
		return;
	}

	// "If node is not an Element, node's parent is an Element, and property
	// computes to new value on node's parent, abort this algorithm."
	if (node.nodeType != Node.ELEMENT_NODE
	&& node.parentNode.nodeType == Node.ELEMENT_NODE
	&& cssValuesEqual(property, getComputedStyle(node.parentNode)[property], newValue)) {
		return;
	}

	// "If property is "font-weight" and new value is "bold", let tag be "b"."
	var tag;
	if (property == "fontWeight" && newValue == "bold") {
		tag = "b";
	// "If property is "font-style" and new value is "italic", let tag be "i"."
	} else if (property == "fontStyle" && newValue == "italic") {
		tag = "i";
	// "If property is "text-decoration" and new value is "underline", let tag
	// be "u"."
	} else if (property == "textDecoration" && newValue == "underline") {
		tag = "u";
	// "If tag is not set, let tag be "span"."
	} else {
		tag = "span";
	}

	// "Let new parent be the result of calling createElement(tag) on the
	// ownerDocument of node."
	var newParent = node.ownerDocument.createElement(tag);

	// "Insert new parent in node's parent before node."
	node.parentNode.insertBefore(newParent, node);

	// "If the computed value of property for new parent is not new value, set
	// the CSS property property of new parent to new value."
	if (!cssValuesEqual(property, getComputedStyle(newParent)[property], newValue)) {
		newParent.style[property] = newValue;
	}

	// "Append node to new parent as its last child."
	newParent.appendChild(node);

	// "If node is an Element and the computed value of property for node is
	// not new value, set the CSS property property of node to new value."
	if (node.nodeType == Node.ELEMENT_NODE
	&& !cssValuesEqual(property, getComputedStyle(node)[property], newValue)) {
		node.style[property] = newValue;
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

function myExecCommand(commandId, showUI, value) {
	commandId = commandId.toLowerCase();
	var range = getActiveRange(document);

	if (!range) {
		return;
	}

	switch (commandId) {
		case "bold":
		// "Decompose the Range. If the state of the Range for this command is
		// then true, style each returned Node with property "font-weight" and
		// new value "bold". Otherwise, style them with new value "normal"."
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

		case "italic":
		// "Decompose the Range. If the state of the Range for this command is
		// then true, style each returned Node with property "font-style" and
		// new value "italic". Otherwise, style them with new value "normal"."
		var nodeList = decomposeRange(range);
		var newValue = getState("italic", range) ? "normal" : "italic";
		for (var i = 0; i < nodeList.length; i++) {
			styleNode(nodeList[i], "fontStyle", newValue);
		}
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
	if (commandId != "bold"
	&& commandId != "italic") {
		return false;
	}

	var node = range.startContainer;
	var stop = nextNode(range.endContainer);

	for (node = range.startContainer; node && node != nextNodeDescendants(range.endContainer); node = nextNode(node)) {
		if (!isEffectivelyContained(node, range)) {
			continue;
		}

		var element;
		if (node.nodeType == Node.TEXT_NODE) {
			element = node.parentNode;
		} else {
			element = node;
		}

		if (element.nodeType != Node.ELEMENT_NODE) {
			continue;
		}

		var style = getComputedStyle(element);

		if (commandId == "bold") {
			// "True if every Element that is effectively contained in the
			// Range has computed font-weight at least 700, and the parent of
			// every Text node that is effectively contained in the Range has
			// computed font-weight at least 700. Otherwise false."
			if (style.fontWeight != "bold"
			&& style.fontWeight != "700"
			&& style.fontWeight != "800"
			&& style.fontWeight != "900") {
				return false;
			}
		} else if (commandId == "italic") {
			// "True if every Element that is effectively contained in the
			// Range has computed font-style "italic" or "oblique", and the
			// parent of every Text node that is effectively contained in the
			// Range has computed font-style "italic" or "oblique". Otherwise
			// false."
			if (style.fontStyle != "italic"
			&& style.fontStyle != "oblique") {
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

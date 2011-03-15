"use strict";

var htmlNamespace = "http://www.w3.org/1999/xhtml";

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

function convertProperty(propertyName) {
	// Special-case for now
	var map = {
		"fontStyle": "font-style",
		"fontWeight": "font-weight",
		"textDecoration": "text-decoration",
	};
	if (typeof map[propertyName] != "undefined") {
		return map[propertyName];
	}

	return propertyName;
}

function cssValuesEqual(propertyName, val1, val2) {
	// This is a bad hack to work around browser incompatibility.  It wouldn't
	// work in real life, but it's good enough for a test implementation.
	var test1 = document.createElement("span");
	test1.style[propertyName] = val1;
	var test2 = document.createElement("span");
	test2.style[propertyName] = val2;

	return test1.style[propertyName] == test2.style[propertyName];
}


/**
 * The position of two boundary points relative to one another, as defined by
 * the spec.
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

function isHtmlElement(node) {
	return node
		&& node.nodeType == Node.ELEMENT_NODE
		&& node.namespaceURI == htmlNamespace;
}

function beginningElement(range) {
	// "If the start node of the Range is a Text, Comment, or
	// ProcessingInstruction node, and the start offset of the Range is not
	// equal to the length of its start node, let first node be the Range's
	// start node."
	var firstNode = null;
	if (range.startOffset != getNodeLength(range.startContainer)
	&& (range.startContainer.nodeType == Node.TEXT_NODE
	|| range.startContainer.nodeType == Node.COMMENT_NODE
	|| range.startContainer.nodeType == Node.PROCESSING_INSTRUCTION_NODE)) {
		firstNode = range.startContainer;
	// "Otherwise, let first node be the first Node in tree order that is
	// contained in the Range, if there is any."
	} else {
		var firstContained = range.startContainer;
		while (firstContained != range.endContainer
		&& !isContained(firstContained, range)) {
			firstContained = nextNode(firstContained);
		}
		if (firstContained != range.endContainer) {
			firstNode = firstContained;
		}
	}

	// "If first node is defined and is an Element, return first node."
	if (firstNode && firstNode.nodeType == Node.ELEMENT_NODE) {
		return firstNode;
	}

	// "Otherwise, if first node is defined and its parent is an Element,
	// return first node's parent."
	if (firstNode
	&& firstNode.parentNode
	&& firstNode.parentNode.nodeType == Node.ELEMENT_NODE) {
		return firstNode.parentNode;
	}

	// "Return null."
	return null;
}

function activeRange(doc) {
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

/**
 * "Given a CSS property name property name, an (optional) value property value
 * for that property, and a possibly empty list of strings tag list, a Node is
 * a potentially relevant styling element if it is an HTML element and one of
 * the following holds:
 *
 *  * Its local name is in tag list and it has no attributes.
 *  * Its local name is in tag list or is "span" or is "font", and it has
 *    exactly one attribute, and that attribute is an HTML attribute with local
 *    name "style", and that attribute sets exactly one CSS property, and that
 *    property is property name, and either property value is undefined or the
 *    value the attribute sets the property to is property value.
 *  * Its local name is "font", and it has exactly one attribute, and that
 *    attribute is a color attribute, and either property value is undefined or
 *    the effect of the attribute is to hint that the CSS color attribute be
 *    set to property value, and property name is "color".
 *  * Its local name is "font", and it has exactly one attribute, and that
 *    attribute is a face attribute, and either property value is undefined or
 *    the effect of the attribute is to hint that the CSS font-family attribute
 *    be set to property value, and property name is "font-family".
 *  * Its local name is "font", and it has exactly one attribute, and that
 *    attribute is a size attribute, and either property value is undefined or
 *    the effect of the attribute is to hint that the CSS font-size attribute
 *    be set to property value, and property name is "font-size"."
 */
function isPotentiallyRelevantStylingElement(element, propertyName, propertyValue, tagList) {
	if (!isHtmlElement(element)) {
		return false;
	}

	var localName = element.tagName.toLowerCase();

	if (tagList.indexOf(localName) != -1 && element.attributes.length == 0) {
		return true;
	}

	if ((tagList.indexOf(localName) != -1 || localName == "span" || localName == "font")
	&& element.attributes.length == 1
	// Not checking namespace because it seems buggy, maybe?
	//&& element.attributes[0].namespaceURI == htmlNamespace
	&& element.attributes[0].localName == "style"
	&& element.style.length == 1
	&& element.style.item(0) == convertProperty(propertyName)
	&& (propertyValue === null
	|| cssValuesEqual(propertyName, element.style[propertyName], propertyValue))) {
		return true;
	}

	var fontAttr = null;
	if (propertyName == "color") {
		fontAttr = "color";
	} else if (propertyName == "fontFamily") {
		fontAttr = "face";
	} else if (propertyName == "fontSize") {
		fontAttr = "size";
	}

	// TODO: cssValuesEqual() is total nonsense for font-size.
	if (fontAttr
	&& localName == "font"
	&& element.attributes.length == 1
	//&& element.attributes[0].namespaceURI == htmlNamespace
	&& element.attributes[0].localName == fontAttr
	&& (propertyValue === null
	|| cssValuesEqual(propertyName, element[fontAttr], propertyValue))) {
		return true;
	}
}

/**
 * "A Node is a relevant styling element if it is a potentially relevant
 * styling element, and its CSS property property name computes to property
 * value."
 */
function isRelevantStylingElement(node, propertyName, propertyValue, tagList) {
	return isPotentiallyRelevantStylingElement(node, propertyName, propertyValue, tagList)
		&& cssValuesEqual(propertyName, getComputedStyle(node)[propertyName], propertyValue);
}

/**
 * "A phrasing element is either an HTML element that is categorized as
 * phrasing content, or a non-conforming HTML element (which thus has no
 * categories), or an Element that is not an HTML element."
 */
function isPhrasingElement(element) {
	if (!element || element.nodeType != Node.ELEMENT_NODE) {
		return false;
	}

	if (!isHtmlElement(element)) {
		return true;
	}

	// As of March 2011.
	var nonConforming = ["applet", "acronym", "bgsound", "dir", "frame",
	"frameset", "noframes", "isindex", "listing", "xmp", "nextid", "noembed",
	"plaintext", "rb", "strike", "basefont", "big", "blink", "center", "font",
	"marquee", "multicol", "nobr", "spacer", "tt", "u"];

	// I'm skipping checks for elements that are only sometimes phrasing
	// content.  I just assume they always are.
	var phrasingElements = ["a", "abbr", "area", "audio", "b", "bdi", "bdo",
	"br", "button", "canvas", "cite", "code", "command", "datalist", "del",
	"dfn", "em", "embed", "i", "iframe", "img", "input", "ins", "kbd",
	"keygen", "label", "link", "map", "mark", "math", "meta", "meter",
	"noscript", "object", "output", "progress", "q", "ruby", "s", "samp",
	"script", "select", "small", "span", "strong", "sub", "sup", "svg",
	"textarea", "time", "var", "video", "wbr"];

	return nonConforming.indexOf(element.tagName.toLowerCase()) != -1
		|| phrasingElements.indexOf(element.tagName.toLowerCase()) != -1;
}

/**
 * "specified style" per spec
 */
function getSpecifiedStyle(element, propertyName) {
	// "If the Element has a style attribute set, and that attribute has the
	// effect of setting property name, return the value that it sets property
	// name to."
	if (element.style[propertyName] != "") {
		return element.style[propertyName];
	}

	// "If the Element is a font element that has an attribute whose effect is
	// to create a presentational hint for property name, return the value that
	// the hint sets property name to."
	//
	// I'm cheating on this one for simplicity.  Font-size is especially wrong.
	if (element.namespaceURI == htmlNamespace
	&& element.tagName == "FONT") {
		if (propertyName == "color" && element.hasAttribute("color")) {
			return element.color;
		}
		if (propertyName == "fontFamily" && element.hasAttribute("face")) {
			return element.face;
		}
		if (propertyName == "fontSize" && element.hasAttribute("size")) {
			return element.size;
		}
	}

	// "If the Element is in the following list, and property name is equal to
	// the CSS property name listed for it, return the string listed for it."
	//
	// A list follows, whose meaning is copied here.
	if (propertyName == "fontWeight"
	&& (element.tagName == "B" || element.tagName == "STRONG")) {
		return "bold";
	}
	if (propertyName == "fontStyle"
	&& (element.tagName == "I" || element.tagName == "EM")) {
		return "italic";
	}
	if (propertyName == "textDecoration"
	&& element.tagName == "U") {
		return "underline";
	}

	// "Return null."
	return null;
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

	// "Return a list consisting of every Node contained in range in tree
	// order, omitting any whose parent is also contained in range."
	var ret = [];
	for (var node = startNode; node != nextNodeDescendants(endNode); node = nextNode(node)) {
		if (isContained(node, range)
		&& !isContained(node.parentNode, range)) {
			ret.push(node);
		}
	}
	return ret;
}

function clearStyles(element, propertyName, tagList) {
	// "If element is a potentially relevant styling element:"
	if (isPotentiallyRelevantStylingElement(element, propertyName, null, tagList)) {
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

		// "Remove element."
		element.parentNode.removeChild(element);

		// "Return children."
		return children;
	}

	// "Unset the CSS property property name of element."
	element.style[propertyName] = '';
	if (element.getAttribute("style") == "") {
		element.removeAttribute("style");
	}

	// "If element is a font element:"
	if (element.namespaceURI == htmlNamespace && element.tagName == "FONT") {
		// "If property name is "color", unset element's color attribute, if
		// set."
		if (propertyName == "color") {
			element.removeAttribute("color");
		}

		// "If property name is "font-family", unset element's face attribute,
		// if set."
		if (propertyName == "fontFamily") {
			element.removeAttribute("face");
		}

		// "If property name is "font-size", unset element's size attribute, if
		// set."
		if (propertyName == "fontSize") {
			element.removeAttribute("size");
		}
	}

	// "If element is not an HTML element or its local name is not in tag list,
	// return the empty list."
	if (element.namespaceURI != htmlNamespace
	|| tagList.indexOf(element.tagName.toLowerCase()) == -1) {
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

	// "Remove element."
	element.parentNode.removeChild(element);

	// "Return the one-Node list consisting of new element."
	return [newElement];
}

function recursivelyClearStyles(element, propertyName, tagList) {
	// "Let element children be the Element children of element."
	var elementChildren = [];
	for (var j = 0; j < element.childNodes.length; j++) {
		if (element.childNodes[j].nodeType == Node.ELEMENT_NODE) {
			elementChildren.push(element.childNodes[j]);
		}
	}

	// "Recursively clear styles on each Element in element children."
	for (var j = 0; j < elementChildren.length; j++) {
		recursivelyClearStyles(elementChildren[j], propertyName, tagList);
	}

	// "Clear styles on element, and return the resulting list."
	return clearStyles(element, propertyName, tagList);
}

function styleNode(node, propertyName, propertyValue, tagList) {
	// "If node's parent is null, or if node is not an Element, Text, Comment,
	// or ProcessingInstruction node, abort this algorithm."
	if (!node.parentNode
	|| [Node.ELEMENT_NODE, Node.TEXT_NODE, Node.COMMENT_NODE,
	Node.PROCESSING_INSTRUCTION_NODE].indexOf(node.nodeType) == -1) {
		return;
	}

	// "If node is an Element:"
	if (node.nodeType == Node.ELEMENT_NODE) {
		// "Clear styles on node, and let new nodes be the result."
		var newNodes = clearStyles(node, propertyName, tagList);

		// "For each new node in new nodes, style new node, with the same
		// inputs as this invocation of the algorithm."
		for (var i = 0; i < newNodes.length; i++) {
			styleNode(newNodes[i], propertyName, propertyValue, tagList);
		}

		// "If node's parent is null, abort this algorithm."
		if (!node.parentNode) {
			return;
		}
	}

	// "If node is an Element but not a phrasing element:"
	if (node.nodeType == Node.ELEMENT_NODE
	&& !isPhrasingElement(node)) {
		// "Let children be all children of node, omitting any that are
		// Elements whose specified style for property name is neither null nor
		// equal to property value."
		var children = [];
		for (var i = 0; i < node.childNodes.length; i++) {
			if (node.childNodes[i].nodeType == Node.ELEMENT_NODE) {
				var specifiedStyle = getSpecifiedStyle(node.childNodes[i], propertyName);

				if (specifiedStyle !== null
				&& !cssValuesEqual(propertyName, propertyValue, specifiedStyle)) {
					continue;
				}
			}
			children.push(node.childNodes[i]);
		}

		// "Style each Node in children."
		for (var i = 0; i < children.length; i++) {
			styleNode(children[i], propertyName, propertyValue, tagList);
		}

		// "Abort this algorithm."
		return;
	}

	// "If node's previousSibling is a relevant styling element, append node as
	// the last child of its previousSibling and abort this algorithm."
	if (isRelevantStylingElement(node.previousSibling, propertyName, propertyValue, tagList)) {
		node.previousSibling.appendChild(node);
		return;
	}

	// "If node's nextSibling is a relevant styling element, insert node as the
	// first child of its nextSibling and abort this algorithm."
	if (isRelevantStylingElement(node.nextSibling, propertyName, propertyValue, tagList)) {
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

	// "If node is an Element and the computed style of property name for it is
	// property value, abort this algorithm."
	if (node.nodeType == Node.ELEMENT_NODE
	&& cssValuesEqual(propertyName, getComputedStyle(node)[propertyName], propertyValue)) {
		return;
	}

	// "If node is a Text node and the computed style of property name for its
	// parent is property value, abort this algorithm."
	if (node.nodeType == Node.TEXT_NODE
	&& cssValuesEqual(propertyName, getComputedStyle(node.parentNode)[propertyName], propertyValue)) {
		return;
	}

	// "Let tag be the first string in tag list, if that is not empty, or
	// "span" if it is empty."
	var tag = tagList.length ? tagList[0] : "span";

	// "Let new parent be the result of calling createElement(tag) on the
	// ownerDocument of node."
	var newParent = node.ownerDocument.createElement(tag);

	// "Insert new parent in node's parent before node."
	node.parentNode.insertBefore(newParent, node);

	// "If the computed value of property name for new parent is not property
	// value, set the CSS property property name of new parent to property
	// value."
	if (!cssValuesEqual(propertyName, getComputedStyle(newParent)[propertyName], propertyValue)) {
		newParent.style[propertyName] = propertyValue;
	}

	// "Append node to new parent as its last child."
	newParent.appendChild(node);
}

function recursivelyStyleNode(node, propertyName, propertyValue, tagList) {
	// "If node's parent is null, or if node is not an Element, Text, Comment,
	// or ProcessingInstruction node, abort this algorithm."
	if (!node.parentNode
	|| [Node.ELEMENT_NODE, Node.TEXT_NODE, Node.COMMENT_NODE,
	Node.PROCESSING_INSTRUCTION_NODE].indexOf(node.nodeType) == -1) {
		return;
	}

	// "If node is an Element:"
	if (node.nodeType == Node.ELEMENT_NODE) {
		// "Recursively clear styles on node, and let new nodes be the result."
		var newNodes = recursivelyClearStyles(node, propertyName, tagList);

		// "For each new node in new nodes, recursively style new node, with
		// the same inputs as this invocation of the algorithm."
		for (var i = 0; i < newNodes.length; i++) {
			recursivelyStyleNode(newNodes[i], propertyName, propertyValue, tagList);
		}

		// "If node's parent is null, abort this algorithm."
		if (!node.parentNode) {
			return;
		}
	}

	// "Style node."
	styleNode(node, propertyName, propertyValue, tagList);
}

// "When a user agent is to style a Range, it must decompose the Range, then
// recursively style each Node in the returned list."
function styleRange(range, propertyName, propertyValue, tagList) {
	var nodeList = decomposeRange(range);
	for (var i = 0; i < nodeList.length; i++) {
		recursivelyStyleNode(nodeList[i], propertyName, propertyValue, tagList);
	}
}

function unstyleNode(node, propertyName, newValue, tagList) {
	// "If node's parent is null, or if node is not an Element or Text node,
	// abort this algorithm."
	if (!node.parentNode
	|| (node.nodeType != Node.ELEMENT_NODE && node.nodeType != Node.TEXT_NODE)) {
		return;
	}

	// "If node is an Element:"
	if (node.nodeType == Node.ELEMENT_NODE) {
		// "Recursively clear styles on node, and let new nodes be the result."
		var newNodes = recursivelyClearStyles(node, propertyName, tagList);

		// "For each new node in new nodes, unstyle new node, with the same
		// inputs as this invocation of the algorithm."
		for (var i = 0; i < newNodes.length; i++) {
			unstyleNode(newNodes[i], propertyName, newValue, tagList);
		}

		// "If node's parent is null, abort this algorithm."
		if (!node.parentNode) {
			return;
		}
	}

	// "If node is an Element, let current value equal the computed value of
	// property name on node. Otherwise, let current value equal the computed
	// value of property name on node's parent."
	var currentValue;
	if (node.nodeType == Node.ELEMENT_NODE) {
		currentValue = getComputedStyle(node)[propertyName];
	} else {
		currentValue = getComputedStyle(node.parentNode)[propertyName];
	}

	// "If current value equals new value, abort this algorithm."
	if (cssValuesEqual(propertyName, currentValue, newValue)) {
		return;
	}

	// "Let ancestor list be a list of Nodes, initially empty."
	var ancestorList = [];

	// "Let current ancestor equal node."
	var currentAncestor = node;

	// "While current ancestor's parent is an Element, set current ancestor to
	// its parent, then append it to ancestor list."
	while (currentAncestor.parentNode
	&& currentAncestor.parentNode.nodeType == Node.ELEMENT_NODE) {
		currentAncestor = currentAncestor.parentNode;
		ancestorList.push(currentAncestor);
	}

	// "While ancestor list is not empty, and the last member of ancestor list
	// has specified style for property name equal to new value or null, remove
	// the last member from ancestor list."
	while (ancestorList.length
	&& (getSpecifiedStyle(ancestorList[ancestorList.length - 1], propertyName) === null
	|| cssValuesEqual(propertyName, newValue, getSpecifiedStyle(ancestorList[ancestorList.length - 1], propertyName)))) {
		ancestorList.pop();
	}

	// "While ancestor list is not empty:"
	while (ancestorList.length) {
		// "Let current ancestor be the last member of ancestor list."
		// "Remove the last member from ancestor list."
		var currentAncestor = ancestorList.pop();

		// "Let propagated value be the specified style of current ancestor for
		// property name."
		var propagatedValue = getSpecifiedStyle(currentAncestor, propertyName);

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
		clearStyles(currentAncestor, propertyName, tagList);

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
			&& getSpecifiedStyle(child, propertyName) !== null
			&& !cssValuesEqual(propertyName, propagatedValue, getSpecifiedStyle(child, propertyName))) {
				continue;
			}

			// "If child is the last member of ancestor list, set child's CSS
			// property property name to propagated value and continue with the
			// next child."
			if (child == ancestorList[ancestorList.length - 1]) {
				child.style[propertyName] = propagatedValue;
				continue;
			}

			// "Style child, with property name and tag list as in this
			// algorithm, and property value equal to propagated value."
			styleNode(child, propertyName, propagatedValue, tagList);
		}
	}

	// "If node is an Element and property name does not compute to new value
	// on it, set property name to new value on it."
	if (node.nodeType == Node.ELEMENT_NODE
	&& !cssValuesEqual(propertyName, newValue, getComputedStyle(node)[propertyName])) {
		node.style[propertyName] = newValue;
	}

	// "If node is a Text node and property name does not compute to new value
	// on its parent:"
	if (node.nodeType == Node.TEXT_NODE
	&& !cssValuesEqual(propertyName, newValue, getComputedStyle(node.parentNode)[propertyName])) {
		// "Let new parent be the result of calling createElement("span") on
		// the ownerDocument of node."
		var newParent = node.ownerDocument.createElement("span");

		// "Set property name to new value on new parent."
		newParent.style[propertyName] = newValue;

		// "Insert new parent into node's parent before node."
		node.parentNode.insertBefore(newParent, node);

		// "Append node as the last child of new parent."
		newParent.appendChild(node);
	}
}

// "When a user agent is to unstyle a Range range, it must decompose the Range,
// then unstyle each Node in the returned list."
function unstyleRange(range, propertyName, propertyValue, tagList) {
	var nodeList = decomposeRange(range);

	for (var i = 0; i < nodeList.length; i++) {
		unstyleNode(nodeList[i], propertyName, propertyValue, tagList);
	}
}

function myExecCommand(commandId, showUI, value) {
	commandId = commandId.toLowerCase();
	var range = activeRange(document);

	if (!range) {
		return;
	}

	switch (commandId) {
		case "bold":
		if (getState("bold", range)) {
			unstyleRange(range, "fontWeight", "normal", ["b", "strong"]);
		} else {
			styleRange(range, "fontWeight", "bold", ["b", "strong"]);
		}
		break;

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
				while (ancestorLink.namespaceURI != htmlNamespace
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

		case "foreColor":
		// Hacky test to see if the color is valid
		var testEl = document.createElement("span");
		testEl.style.color = value;
		if (testEl.style.color === "") {
			return;
		}
		styleRange(range, "color", value, []);
		break;

		case "italic":
		if (getState("italic", range)) {
			unstyleRange(range, "fontStyle", "normal", ["i", "em"]);
		} else {
			styleRange(range, "fontStyle", "italic", ["i", "em"]);
		}
		break;

		default:
		break;
	}
}

function myQueryCommandState(commandId) {
	commandId = commandId.toLowerCase();
	var range = activeRange(document);

	if (!range) {
		return false;
	}

	return getState(commandId, range);
}

function getState(commandId, range) {
	var style = getComputedStyle(beginningElement(range));

	switch (commandId) {
		case "bold":
		return style.fontWeight == "bold"
			|| (/^[0-9]+$/.test(style.fontWeight) && style.fontWeight >= 700);

		case "italic":
		return style.fontStyle == "italic" || style.fontStyle == "oblique";

		default:
		return false;
	}
}

function myQueryCommandValue(commandId) {
	commandId = commandId.toLowerCase();
	var range = activeRange(document);

	if (!range) {
		return "";
	}

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
	}
}

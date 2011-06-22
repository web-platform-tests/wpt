"use strict";

var htmlNamespace = "http://www.w3.org/1999/xhtml";

var cssStylingFlag = false;

// This is bad :(
var globalRange = null;

// Commands are stored in a dictionary where we call their actions and such
var commands = {};

///////////////////////////////////////////////////////////////////////////////
////////////////////////////// Utility functions //////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//@{

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

/**
 * Returns true if ancestor is an ancestor of descendant, false otherwise.
 */
function isAncestor(ancestor, descendant) {
	if (!ancestor || !descendant) {
		return false;
	}
	while (descendant && descendant != ancestor) {
		descendant = descendant.parentNode;
	}
	return descendant == ancestor;
}

/**
 * Returns true if descendant is a descendant of ancestor, false otherwise.
 */
function isDescendant(descendant, ancestor) {
	return isAncestor(ancestor, descendant);
}

/**
 * Returns true if node1 is before node2 in tree order, false otherwise.
 */
function isBefore(node1, node2) {
	return Boolean(node1.compareDocumentPosition(node2) & Node.DOCUMENT_POSITION_FOLLOWING);
}

/**
 * Returns true if node1 is after node2 in tree order, false otherwise.
 */
function isAfter(node1, node2) {
	return Boolean(node1.compareDocumentPosition(node2) & Node.DOCUMENT_POSITION_PRECEDING);
}

function getDescendants(node) {
	var descendants = [];
	for (var i = 0; i < node.childNodes.length; i++) {
		descendants.push(node.childNodes[i]);
		descendants = descendants.concat(getDescendants(node.childNodes[i]));
	}
	return descendants;
}

function convertProperty(property) {
	// Special-case for now
	var map = {
		"fontFamily": "font-family",
		"fontSize": "font-size",
		"fontStyle": "font-style",
		"fontWeight": "font-weight",
		"textDecoration": "text-decoration",
	};
	if (typeof map[property] != "undefined") {
		return map[property];
	}

	return property;
}

// Return the <font size=X> value for the given CSS size, or undefined if there
// is none.
function getFontSize(cssVal) {
	return {
		"xx-small": 1,
		"small": 2,
		"medium": 3,
		"large": 4,
		"x-large": 5,
		"xx-large": 6,
		"xxx-large": 7
	}[cssVal];
}

// This entire function is a massive hack to work around browser
// incompatibility.  It wouldn't work in real life, but it's good enough for a
// test implementation.  It's not clear how all this should actually be specced
// in practice, since CSS defines no notion of equality, does it?
function valuesEqual(command, val1, val2) {
	if (val1 === null || val2 === null) {
		return val1 === val2;
	}

	if (command == "subscript" || command == "superscript") {
		return val1 === val2;
	}

	if (command == "bold") {
		return val1 == val2
			|| (val1.toLowerCase() == "bold" && val2 == "700")
			|| (val2.toLowerCase() == "bold" && val1 == "700")
			|| (val1.toLowerCase() == "normal" && val2 == "400")
			|| (val2.toLowerCase() == "normal" && val1 == "400");
	}
	var property = commands[command].relevantCssProperty;
	var test1 = document.createElement("span");
	test1.style[property] = val1;
	var test2 = document.createElement("span");
	test2.style[property] = val2;

	// Computing style doesn't seem to always work if the elements aren't in
	// the body?
	document.body.appendChild(test1);
	document.body.appendChild(test2);

	// We can't test xxx-large with CSS.  Also, some browsers (WebKit?) don't
	// actually make <span style="font-size: xx-small"> have the same size as
	// <font size="1">, and so on.  So we have to test both . . .
	var test1b = null, test2b = null;
	if (command == "fontsize") {
		if (typeof getFontSize(val1) != "undefined") {
			test1b = document.createElement("font");
			test1b.size = getFontSize(val1);
			document.body.appendChild(test1b);
		}
		if (typeof getFontSize(val2) != "undefined") {
			test2b = document.createElement("font");
			test2b.size = getFontSize(val2);
			document.body.appendChild(test2b);
		}
	}

	var computed1b = test1b
		? getComputedStyle(test1b)[property]
		: null;
	var computed2b = test2b
		? getComputedStyle(test2b)[property]
		: null;
	var computed1 = command == "fontsize" && val1 == "xxx-large"
		? computed1b
		: getComputedStyle(test1)[property];
	var computed2 = command == "fontsize" && val2 == "xxx-large"
		? computed2b
		: getComputedStyle(test2)[property];

	document.body.removeChild(test1);
	document.body.removeChild(test2);

	if (test1b) {
		document.body.removeChild(test1b);
	}
	if (test2b) {
		document.body.removeChild(test2b);
	}

	return computed1 == computed2
		|| computed1 === computed2b
		|| computed1b === computed2;
}

// Opera 11 puts HTML elements in the null namespace, it seems.
function isHtmlNamespace(ns) {
	return ns === null
		|| ns === htmlNamespace;
}

// For computing states of the form "True if every editable Text node that is
// effectively contained in the active range (has property X).  Otherwise
// false."
function stateHelper(callback) {
	var range = getActiveRange();
	// XXX: This algorithm for getting all effectively contained nodes might be
	// wrong . . .
	var node = range.startContainer;
	while (node.parentNode && node.parentNode.firstChild == node) {
		node = node.parentNode;
	}
	var stop = nextNodeDescendants(range.endContainer);

	for (; node && node != stop; node = nextNode(node)) {
		if (!isEffectivelyContained(node, range)
		|| node.nodeType != Node.TEXT_NODE
		|| !isEditable(node)) {
			continue;
		}

		if (!callback(node)) {
			return false;
		}
	}

	return true;
}

//@}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////// DOM Range functions /////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//@{

function getNodeIndex(node) {
	if (!node.parentNode) {
		// No preceding siblings, so . . .
		return 0;
	}

	var ret = 0;
	// These are no-ops to avoid a completely ridiculous bug in IE where
	// sometimes a node is not actually equal to any of its parents' children.
	// Somehow this makes it go away.  Sigh.
	if (node.nextSibling) {
		node = node.nextSibling.previousSibling;
	} else if (node.previousSibling) {
		node = node.previousSibling.nextSibling;
	} else {
		node = node.parentNode.firstChild;
	}
	while (ret < node.parentNode.childNodes.length && node != node.parentNode.childNodes[ret]) {
		ret++;
	}
	if (ret >= node.parentNode.childNodes.length) {
		// This actually happens in IE sometimes (although hopefully not with
		// my workaround in place).
		throw "node is not equal to any of its parents' children";
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

/**
 * Return all nodes contained in range that the provided function returns true
 * for, omitting any with an ancestor already being returned.
 */
function collectContainedNodes(range, condition) {
	if (typeof condition == "undefined") {
		condition = function() { return true };
	}
	var node = range.startContainer;
	if (node.hasChildNodes()
	&& range.startOffset < node.childNodes.length) {
		// A child is contained
		node = node.childNodes[range.startOffset];
	} else if (range.startOffset == getNodeLength(node)) {
		// No descendant can be contained
		node = nextNodeDescendants(node);
	} else {
		// No children; this node at least can't be contained
		node = nextNode(node);
	}

	var stop = range.endContainer;
	if (stop.hasChildNodes()
	&& range.endOffset < stop.childNodes.length) {
		// The node after the last contained node is a child
		stop = stop.childNodes[range.endOffset];
	} else {
		// This node and/or some of its children might be contained
		stop = nextNodeDescendants(stop);
	}

	var nodeList = [];
	while (isBefore(node, stop)) {
		if (isContained(node, range)
		&& condition(node)) {
			nodeList.push(node);
			node = nextNodeDescendants(node);
			continue;
		}
		node = nextNode(node);
	}
	return nodeList;
}

/**
 * As above, but includes nodes with an ancestor that's already been returned.
 */
function collectAllContainedNodes(range, condition) {
	if (typeof condition == "undefined") {
		condition = function() { return true };
	}
	var node = range.startContainer;
	if (node.hasChildNodes()
	&& range.startOffset < node.childNodes.length) {
		// A child is contained
		node = node.childNodes[range.startOffset];
	} else if (range.startOffset == getNodeLength(node)) {
		// No descendant can be contained
		node = nextNodeDescendants(node);
	} else {
		// No children; this node at least can't be contained
		node = nextNode(node);
	}

	var stop = range.endContainer;
	if (stop.hasChildNodes()
	&& range.endOffset < stop.childNodes.length) {
		// The node after the last contained node is a child
		stop = stop.childNodes[range.endOffset];
	} else {
		// This node and/or some of its children might be contained
		stop = nextNodeDescendants(stop);
	}

	var nodeList = [];
	while (isBefore(node, stop)) {
		if (isContained(node, range)
		&& condition(node)) {
			nodeList.push(node);
		}
		node = nextNode(node);
	}
	return nodeList;
}


function parseSimpleColor(color) {
	// This is stupid, but otherwise my automated tests will have places where
	// they're known to contradict the spec, which is annoying, so . . . I
	// don't aim for correctness, beyond my own provisional tests.  Real tests
	// will have to be more exhaustive.

	if (color.length == 7 && color[0] == "#") {
		return color;
	}

	if (color.length == 4 && color[0] == "#") {
		return "#" + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
	}

	// Otherwise, don't even try.
	return {
		"red": "red",
		"blue": "blue",
		"rgb(255, 0, 0)": "#ff0000",
		"rgb(100%, 0, 0)": "#ff0000",
		"rgb( 255 ,0 ,0)": "#ff0000",
		"rgba(255, 0, 0, 0.0)": false,
		"rgb(375, -10, 15)": false,
		"rgba(0, 0, 0, 1)": "#000000",
		"rgba(255, 255, 255, 1)": "#ffffff",
		"rgba(255, 0, 0, 0.5)": false,
		"hsl(0%, 100%, 50%)": "#ff0000",
		"cornsilk": "cornsilk",
		"transparent": false,
		"currentColor": false,
	}[color];
}
//@}


//////////////////////////////////////////////////////////////////////////////
/////////////////////////// Edit command functions ///////////////////////////
//////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////
///// Methods of the HTMLDocument interface /////
/////////////////////////////////////////////////
//@{
function myExecCommand(command, showUI, value, range) {
	command = command.toLowerCase();

	if (typeof range != "undefined") {
		globalRange = range;
	} else {
		globalRange = getActiveRange();
	}

	// "If the active range is null, all commands must behave as though they
	// were not defined except those in the miscellaneous commands section."
	if (!globalRange && command != "selectall" && command != "stylewithcss" && command != "usecss") {
		return;
	}

	if (!(command in commands)) {
		return;
	}

	commands[command].action(value);

	globalRange = null;
}

function myQueryCommandState(command) {
	command = command.toLowerCase();

	if (typeof range != "undefined") {
		globalRange = range;
	} else {
		globalRange = getActiveRange();
	}

	if (!globalRange && command != "selectall" && command != "stylewithcss" && command != "usecss") {
		return;
	}

	if (!(command in commands)) {
		return;
	}

	return commands[command].state();

	globalRange = null;
}

function myQueryCommandValue(command) {
	command = command.toLowerCase();

	if (typeof range != "undefined") {
		globalRange = range;
	} else {
		globalRange = getActiveRange();
	}

	if (!globalRange && command != "selectall" && command != "stylewithcss" && command != "usecss") {
		return;
	}

	if (!(command in commands)) {
		return;
	}

	return commands[command].value();

	globalRange = null;
}

/**
 * "Most commands act on the active range. This is defined to be the first
 * range in the Selection given by calling getSelection() on the context
 * object, or null if there is no such range."
 *
 * We cheat and return globalRange if that's defined.
 */
function getActiveRange() {
	if (globalRange) {
		return globalRange;
	}
	if (getSelection().rangeCount) {
		return getSelection().getRangeAt(0);
	}
	return null;
}
//@}

//////////////////////////////
///// Common definitions /////
//////////////////////////////
//@{

// "An HTML element is an Element whose namespace is the HTML namespace."
//
// I allow an extra argument to more easily check whether something is a
// particular HTML element, like isHtmlElement(node, "OL").  It accepts arrays
// too, like isHtmlElement(node, ["OL", "UL"]) to check if it's an ol or ul.
function isHtmlElement(node, tags) {
	if (typeof tags == "string") {
		tags = [tags];
	}
	if (typeof tags == "object") {
		tags = tags.map(function(tag) { return tag.toUpperCase() });
	}
	return node
		&& node.nodeType == Node.ELEMENT_NODE
		&& isHtmlNamespace(node.namespaceURI)
		&& (typeof tags == "undefined" || tags.indexOf(node.tagName) != -1);
}

// "An inline node is either a Text node, or an Element whose "display"
// property computes to "inline", "inline-block", or "inline-table"."
function isInlineNode(node) {
	return node
		&& (node.nodeType == Node.TEXT_NODE
		|| (node.nodeType == Node.ELEMENT_NODE
		&& ["inline", "inline-block", "inline-table"].indexOf(getComputedStyle(node).display) != -1));
}

// "An editing host is a node that is either an Element with a contenteditable
// attribute set to the true state, or the Element child of a Document whose
// designMode is enabled."
function isEditingHost(node) {
	return node
		&& node.nodeType == Node.ELEMENT_NODE
		&& (node.contentEditable == "true"
		|| (node.parentNode
		&& node.parentNode.nodeType == Node.DOCUMENT_NODE
		&& node.parentNodedesignMode == "on"));
}

// "Something is editable if it is a node which is not an editing host, does
// not have a contenteditable attribute set to the false state, and whose
// parent is an editing host or editable."
function isEditable(node) {
	// This is slightly a lie, because we're excluding non-HTML elements with
	// contentEditable attributes.
	return node
		&& !isEditingHost(node)
		&& (node.nodeType != Node.ELEMENT_NODE || node.contentEditable != "false")
		&& (isEditingHost(node.parentNode) || isEditable(node.parentNode));
}

// Helper function, not defined in the spec
function hasEditableDescendants(node) {
	for (var i = 0; i < node.childNodes.length; i++) {
		if (isEditable(node.childNodes[i])
		|| hasEditableDescendants(node.childNodes[i])) {
			return true;
		}
	}
	return false;
}

// "The editing host of node is null if node is neither editable nor an editing
// host; node itself, if node is an editing host; or the nearest ancestor of
// node that is an editing host, if node is editable."
function getEditingHostOf(node) {
	if (isEditingHost(node)) {
		return node;
	} else if (isEditable(node)) {
		var ancestor = node.parentNode;
		while (!isEditingHost(ancestor)) {
			ancestor = ancestor.parentNode;
		}
		return ancestor;
	} else {
		return null;
	}
}

// "Two nodes are in the same editing host if the editing host of the first is
// non-null and the same as the editing host of the second."
function inSameEditingHost(node1, node2) {
	return getEditingHostOf(node1)
		&& getEditingHostOf(node1) == getEditingHostOf(node2);
}

// "A collapsed line break is a br that begins a line box which has nothing
// else in it, and therefore has zero height."
function isCollapsedLineBreak(br) {
	if (!isHtmlElement(br, "br")) {
		return false;
	}

	// Add a zwsp after it and see if that changes the height of the nearest
	// non-inline parent.  Note: this is not actually reliable, because the
	// parent might have a fixed height or something.
	var ref = br.parentNode;
	while (getComputedStyle(ref).display == "inline") {
		ref = ref.parentNode;
	}
	var space = document.createTextNode("\u200b");
	var origHeight = ref.offsetHeight;
	br.parentNode.insertBefore(space, br.nextSibling);
	var finalHeight = ref.offsetHeight;
	space.parentNode.removeChild(space);

	return origHeight != finalHeight;
}

// "An extraneous line break is a br that has no visual effect, in that
// removing it from the DOM would not change layout, except that a br that is
// the sole child of an li is not extraneous."
function isExtraneousLineBreak(br) {
	if (!isHtmlElement(br, "br")) {
		return false;
	}

	if (isHtmlElement(br.parentNode, "li")
	&& br.parentNode.childNodes.length == 1) {
		return false;
	}

	var ref = br.parentNode;
	while (getComputedStyle(ref).display == "inline") {
		ref = ref.parentNode;
	}
	var style = br.hasAttribute("style") ? br.getAttribute("style") : null;
	var origHeight = ref.offsetHeight;
	br.setAttribute("style", "display:none");
	var finalHeight = ref.offsetHeight;
	if (style === null) {
		br.removeAttribute("style");
	} else {
		br.setAttribute("style", style);
	}

	return origHeight == finalHeight;
}

// "A visible node is a node that either is a prohibited paragraph child, or a
// Text node whose data is not empty, or an img, or a br that is not an
// extraneous line break, or any node with a descendant that is a visible
// node."
function isVisibleNode(node) {
	if (!node) {
		return false;
	}
	if (isProhibitedParagraphChild(node)
	|| (node.nodeType == Node.TEXT_NODE && node.length)
	|| isHtmlElement(node, "img")
	|| (isHtmlElement(node, "br") && !isExtraneousLineBreak(node))) {
		return true;
	}
	for (var i = 0; i < node.childNodes.length; i++) {
		if (isVisibleNode(node.childNodes[i])) {
			return true;
		}
	}
	return false;
}

// "An invisible node is a node that is not a visible node."
function isInvisibleNode(node) {
	return node && !isVisibleNode(node);
}

// "A collapsed block prop is either a collapsed line break that is not an
// extraneous line break, or an Element that is an inline node and whose
// children are all either invisible nodes or collapsed block props and that
// has at least one child that is a collapsed block prop."
function isCollapsedBlockProp(node) {
	if (isCollapsedLineBreak(node)
	&& !isExtraneousLineBreak(node)) {
		return true;
	}

	if (!isInlineNode(node)
	|| node.nodeType != Node.ELEMENT_NODE) {
		return false;
	}

	var hasCollapsedBlockPropChild = false;
	for (var i = 0; i < node.childNodes.length; i++) {
		if (!isInvisibleNode(node.childNodes[i])
		&& !isCollapsedBlockProp(node.childNodes[i])) {
			return false;
		}
		if (isCollapsedBlockProp(node.childNodes[i])) {
			hasCollapsedBlockPropChild = true;
		}
	}

	return hasCollapsedBlockPropChild;
}

//@}

/////////////////////////////
///// Common algorithms /////
/////////////////////////////

///// Assorted common algorithms /////
//@{

function movePreservingRanges(node, newParent, newIndex) {
	// For convenience, I allow newIndex to be -1 to mean "insert at the end".
	if (newIndex == -1) {
		newIndex = newParent.childNodes.length;
	}

	// "When the user agent is to move a Node to a new location, preserving
	// ranges, it must remove the Node from its original parent (if any), then
	// insert it in the new location. In doing so, however, it must ignore the
	// regular range mutation rules, and instead follow these rules:"

	// "Let node be the moved Node, old parent and old index be the old parent
	// (which may be null) and index, and new parent and new index be the new
	// parent and index."
	var oldParent = node.parentNode;
	var oldIndex = getNodeIndex(node);

	// We only even attempt to preserve the global range object, not every
	// range out there (the latter is probably impossible).
	var start = [globalRange.startContainer, globalRange.startOffset];
	var end = [globalRange.endContainer, globalRange.endOffset];

	// "If a boundary point's node is the same as or a descendant of node,
	// leave it unchanged, so it moves to the new location."
	//
	// No modifications necessary.

	// "If a boundary point's node is new parent and its offset is greater than
	// new index, add one to its offset."
	if (globalRange.startContainer == newParent
	&& globalRange.startOffset > newIndex) {
		start[1]++;
	}
	if (globalRange.endContainer == newParent
	&& globalRange.endOffset > newIndex) {
		end[1]++;
	}

	// "If a boundary point's node is old parent and its offset is old index or
	// old index + 1, set its node to new parent and add new index − old index
	// to its offset."
	if (globalRange.startContainer == oldParent
	&& (globalRange.startOffset == oldIndex
	|| globalRange.startOffset == oldIndex + 1)) {
		start[0] = newParent;
		start[1] += newIndex - oldIndex;
	}
	if (globalRange.endContainer == oldParent
	&& (globalRange.endOffset == oldIndex
	|| globalRange.endOffset == oldIndex + 1)) {
		end[0] = newParent;
		end[1] += newIndex - oldIndex;
	}

	// "If a boundary point's node is old parent and its offset is greater than
	// old index + 1, subtract one from its offset."
	if (globalRange.startContainer == oldParent
	&& globalRange.startOffset > oldIndex + 1) {
		start[1]--;
	}
	if (globalRange.endContainer == oldParent
	&& globalRange.endOffset > oldIndex + 1) {
		end[1]--;
	}

	// Now actually move it and preserve the range.
	if (newParent.childNodes.length == newIndex) {
		newParent.appendChild(node);
	} else {
		newParent.insertBefore(node, newParent.childNodes[newIndex]);
	}
	globalRange.setStart(start[0], start[1]);
	globalRange.setEnd(end[0], end[1]);
}

function setTagName(element, newName) {
	// "If element is an HTML element with local name equal to new name, return
	// element."
	if (isHtmlElement(element, newName.toUpperCase())) {
		return element;
	}

	// "If element's parent is null, return element."
	if (!element.parentNode) {
		return element;
	}

	// "Let replacement element be the result of calling createElement(new
	// name) on the ownerDocument of element."
	var replacementElement = element.ownerDocument.createElement(newName);

	// "Insert replacement element into element's parent immediately before
	// element."
	element.parentNode.insertBefore(replacementElement, element);

	// "Copy all attributes of element to replacement element, in order."
	for (var i = 0; i < element.attributes.length; i++) {
		replacementElement.setAttributeNS(element.attributes[i].namespaceURI, element.attributes[i].name, element.attributes[i].value);
	}

	// "While element has children, append the first child of element as the
	// last child of replacement element, preserving ranges."
	while (element.childNodes.length) {
		movePreservingRanges(element.firstChild, replacementElement, replacementElement.childNodes.length);
	}

	// "Remove element from its parent."
	element.parentNode.removeChild(element);

	// "Return replacement element."
	return replacementElement;
}

function removeExtraneousLineBreaksBefore(node) {
	// "Let ref be the previousSibling of node."
	var ref = node.previousSibling;

	// "If ref is null, abort these steps."
	if (!ref) {
		return;
	}

	// "While ref has children, set ref to its lastChild."
	while (ref.hasChildNodes()) {
		ref = ref.lastChild;
	}

	// "While ref is an invisible node but not an extraneous line break, and
	// ref does not equal node's parent, set ref to the node before it in tree
	// order."
	while (isInvisibleNode(ref)
	&& !isExtraneousLineBreak(ref)
	&& ref != node.parentNode) {
		ref = previousNode(ref);
	}

	// "If ref is an editable extraneous line break, remove it from its
	// parent."
	if (isEditable(ref)
	&& isExtraneousLineBreak(ref)) {
		ref.parentNode.removeChild(ref);
	}
}

function removeExtraneousLineBreaksAtTheEndOf(node) {
	// "Let ref be node."
	var ref = node;

	// "While ref has children, set ref to its lastChild."
	while (ref.hasChildNodes()) {
		ref = ref.lastChild;
	}

	// "While ref is an invisible node but not an extraneous line break, and
	// ref does not equal node, set ref to the node before it in tree order."
	while (isInvisibleNode(ref)
	&& !isExtraneousLineBreak(ref)
	&& ref != node) {
		ref = previousNode(ref);
	}

	// "If ref is an editable extraneous line break, remove it from its
	// parent."
	if (isEditable(ref)
	&& isExtraneousLineBreak(ref)) {
		ref.parentNode.removeChild(ref);
	}
}

// "To remove extraneous line breaks from a node, first remove extraneous line
// breaks before it, then remove extraneous line breaks at the end of it."
function removeExtraneousLineBreaksFrom(node) {
	removeExtraneousLineBreaksBefore(node);
	removeExtraneousLineBreaksAtTheEndOf(node);
}

function followsLineBreak(node) {
	// "Let offset be zero."
	var offset = 0;

	// "While offset is zero, set offset to the index of node and then set node
	// to its parent."
	while (offset == 0) {
		offset = getNodeIndex(node);
		node = node.parentNode;
	}

	// "Let range be a range with start and end (node, offset)."
	var range = document.createRange();
	range.setStart(node, offset);

	// "Block-extend range, and let new range be the result."
	var newRange = blockExtendRange(range);

	// "Return false if new range's start is before (node, offset), true
	// otherwise."
	return getPosition(newRange.startContainer, newRange.startOffset, node, offset) != "before";
}

function precedesLineBreak(node) {
	// "Let offset be the length of node."
	var offset = getNodeLength(node);

	// "While offset is the length of node, set offset to one plus the index of
	// node and then set node to its parent."
	while (offset == getNodeLength(node)) {
		offset = 1 + getNodeIndex(node);
		node = node.parentNode;
	}

	// "Let range be a range with start and end (node, offset)."
	var range = document.createRange();
	range.setStart(node, offset);

	// "Block-extend range, and let new range be the result."
	var newRange = blockExtendRange(range);

	// "Return false if new range's end is after (node, offset), true
	// otherwise."
	return getPosition(newRange.endContainer, newRange.endOffset, node, offset) != "after";
}

function splitParent(nodeList) {
	// "Let original parent be the parent of the first member of node list."
	var originalParent = nodeList[0].parentNode;

	// "If original parent is not editable or its parent is null, do nothing
	// and abort these steps."
	if (!isEditable(originalParent)
	|| !originalParent.parentNode) {
		return;
	}

	// "If the first child of original parent is in node list, remove
	// extraneous line breaks before original parent."
	if (nodeList.indexOf(originalParent.firstChild) != -1) {
		removeExtraneousLineBreaksBefore(originalParent);
	}

	// "If the first child of original parent is in node list, and original
	// parent follows a line break, set follows line break to true. Otherwise,
	// set follows line break to false."
	var followsLineBreak_ = nodeList.indexOf(originalParent.firstChild) != -1
		&& followsLineBreak(originalParent);

	// "If the last child of original parent is in node list, and original
	// parent precedes a line break, set precedes line break to true.
	// Otherwise, set precedes line break to false."
	var precedesLineBreak_ = nodeList.indexOf(originalParent.lastChild) != -1
		&& precedesLineBreak(originalParent);

	// "If the first child of original parent is not in node list, but its last
	// child is:"
	if (nodeList.indexOf(originalParent.firstChild) == -1
	&& nodeList.indexOf(originalParent.lastChild) != -1) {
		// "For each node in node list, in reverse order, insert node into the
		// parent of original parent immediately after original parent,
		// preserving ranges."
		for (var i = nodeList.length - 1; i >= 0; i--) {
			movePreservingRanges(nodeList[i], originalParent.parentNode, 1 + getNodeIndex(originalParent));
		}

		// "If precedes line break is true, and the last member of node list
		// does not precede a line break, call createElement("br") on the
		// context object and insert the result immediately after the last
		// member of node list."
		if (precedesLineBreak_
		&& !precedesLineBreak(nodeList[nodeList.length - 1])) {
			nodeList[nodeList.length - 1].parentNode.insertBefore(document.createElement("br"), nodeList[nodeList.length - 1].nextSibling);
		}

		// "Remove extraneous line breaks at the end of original parent."
		removeExtraneousLineBreaksAtTheEndOf(originalParent);

		// "Abort these steps."
		return;
	}

	// "If the first child of original parent is not in node list:"
	if (nodeList.indexOf(originalParent.firstChild) == -1) {
		// "Let cloned parent be the result of calling cloneNode(false) on
		// original parent."
		var clonedParent = originalParent.cloneNode(false);

		// "Insert cloned parent into the parent of original parent immediately
		// before original parent."
		originalParent.parentNode.insertBefore(clonedParent, originalParent);

		// "While the previousSibling of the first member of node list is not
		// null, append the first child of original parent as the last child of
		// cloned parent, preserving ranges."
		while (nodeList[0].previousSibling) {
			movePreservingRanges(originalParent.firstChild, clonedParent, clonedParent.childNodes.length);
		}
	}

	// "For each node in node list, insert node into the parent of original
	// parent immediately before original parent, preserving ranges."
	for (var i = 0; i < nodeList.length; i++) {
		movePreservingRanges(nodeList[i], originalParent.parentNode, getNodeIndex(originalParent));
	}

	// "If follows line break is true, and the first member of node list does
	// not follow a line break, call createElement("br") on the context object
	// and insert the result immediately before the first member of node list."
	if (followsLineBreak_
	&& !followsLineBreak(nodeList[0])) {
		nodeList[0].parentNode.insertBefore(document.createElement("br"), nodeList[0]);
	}

	// "If the last member of node list is an inline node other than a br, and
	// the first child of original parent is a br, and original parent is not
	// an inline node, remove the first child of original parent from original
	// parent."
	if (isInlineNode(nodeList[nodeList.length - 1])
	&& !isHtmlElement(nodeList[nodeList.length - 1], "br")
	&& isHtmlElement(originalParent.firstChild, "br")
	&& !isInlineNode(originalParent)) {
		originalParent.removeChild(originalParent.firstChild);
	}

	// "If original parent has no children:"
	if (!originalParent.hasChildNodes()) {
		// "Remove original parent from its parent."
		originalParent.parentNode.removeChild(originalParent);

		// "If precedes line break is true, and the last member of node list
		// does not precede a line break, call createElement("br") on the
		// context object and insert the result immediately after the last
		// member of node list."
		if (precedesLineBreak_
		&& !precedesLineBreak(nodeList[nodeList.length - 1])) {
			nodeList[nodeList.length - 1].parentNode.insertBefore(document.createElement("br"), nodeList[nodeList.length - 1].nextSibling);
		}

	// "Otherwise, remove extraneous line breaks before original parent."
	} else {
		removeExtraneousLineBreaksBefore(originalParent);
	}

	// "If node list's last member's nextSibling is null, but its parent is not
	// null, remove extraneous line breaks at the end of node list's last
	// member's parent."
	if (!nodeList[nodeList.length - 1].nextSibling
	&& nodeList[nodeList.length - 1].parentNode) {
		removeExtraneousLineBreaksAtTheEndOf(nodeList[nodeList.length - 1].parentNode);
	}
}

// "To remove a node node while preserving its descendants, split the parent of
// node's children."
function removePreservingDescendants(node) {
	splitParent([].slice.call(node.childNodes));
}

//@}

///// Wrapping a list of nodes /////
//@{

function wrap(nodeList, siblingCriteria, newParentInstructions) {
	// "If node list is empty, or the first member of node list is not
	// editable, return null and abort these steps."
	if (!nodeList.length
	|| !isEditable(nodeList[0])) {
		return null;
	}

	// "If node list's last member is an inline node that's not a br, and node
	// list's last member's nextSibling is a br, append that br to node list."
	if (isInlineNode(nodeList[nodeList.length - 1])
	&& !isHtmlElement(nodeList[nodeList.length - 1], "br")
	&& isHtmlElement(nodeList[nodeList.length - 1].nextSibling, "br")) {
		nodeList.push(nodeList[nodeList.length - 1].nextSibling);
	}

	// "If the previousSibling of the first member of node list is editable and
	// meets the sibling criteria, let new parent be the previousSibling of the
	// first member of node list."
	var newParent;
	if (isEditable(nodeList[0].previousSibling)
	&& siblingCriteria(nodeList[0].previousSibling)) {
		newParent = nodeList[0].previousSibling;

	// "Otherwise, if the nextSibling of the last member of node list is
	// editable and meets the sibling criteria, let new parent be the
	// nextSibling of the last member of node list."
	} else if (isEditable(nodeList[nodeList.length - 1].nextSibling)
	&& siblingCriteria(nodeList[nodeList.length - 1].nextSibling)) {
		newParent = nodeList[nodeList.length - 1].nextSibling;

	// "Otherwise, run the new parent instructions, and let new parent be the
	// result."
	} else {
		newParent = newParentInstructions();
	}

	// "If new parent is null, abort these steps and return null."
	if (!newParent) {
		return null;
	}

	// "If new parent's parent is null:"
	if (!newParent.parentNode) {
		// "Insert new parent into the parent of the first member of node list
		// immediately before the first member of node list."
		nodeList[0].parentNode.insertBefore(newParent, nodeList[0]);

		// "If any range has a boundary point with node equal to the parent of
		// new parent and offset equal to the index of new parent, add one to
		// that boundary point's offset."
		//
		// Only try to fix the global range.
		if (globalRange.startContainer == newParent.parentNode
		&& globalRange.startOffset == getNodeIndex(newParent)) {
			globalRange.setStart(globalRange.startContainer, globalRange.startOffset + 1);
		}
		if (globalRange.endContainer == newParent.parentNode
		&& globalRange.endOffset == getNodeIndex(newParent)) {
			globalRange.setEnd(globalRange.endContainer, globalRange.endOffset + 1);
		}
	}

	// "Let original parent be the parent of the first member of node list."
	var originalParent = nodeList[0].parentNode;

	// "If new parent is before the first member of node list in tree order:"
	if (isBefore(newParent, nodeList[0])) {
		// "If new parent is not an inline node, but the last child of new
		// parent and the first member of node list are both inline nodes, and
		// the last child of new parent is not a br, call createElement("br")
		// on the ownerDocument of new parent and append the result as the last
		// child of new parent."
		if (!isInlineNode(newParent)
		&& isInlineNode(newParent.lastChild)
		&& isInlineNode(nodeList[0])
		&& !isHtmlElement(newParent.lastChild, "BR")) {
			newParent.appendChild(newParent.ownerDocument.createElement("br"));
		}

		// "For each node in node list, append node as the last child of new
		// parent, preserving ranges."
		for (var i = 0; i < nodeList.length; i++) {
			movePreservingRanges(nodeList[i], newParent, -1);
		}

	// "Otherwise:"
	} else {
		// "If new parent is not an inline node, but the first child of new
		// parent and the last member of node list are both inline nodes, and
		// the last member of node list is not a br, call createElement("br")
		// on the ownerDocument of new parent and insert the result as the
		// first child of new parent."
		if (!isInlineNode(newParent)
		&& isInlineNode(newParent.firstChild)
		&& isInlineNode(nodeList[nodeList.length - 1])
		&& !isHtmlElement(nodeList[nodeList.length - 1], "BR")) {
			newParent.insertBefore(newParent.ownerDocument.createElement("br"), newParent.firstChild);
		}

		// "For each node in node list, in reverse order, insert node as the
		// first child of new parent, preserving ranges."
		for (var i = nodeList.length - 1; i >= 0; i--) {
			movePreservingRanges(nodeList[i], newParent, 0);
		}
	}

	// "If original parent is editable and has no children, remove it from its
	// parent."
	if (isEditable(originalParent) && !originalParent.hasChildNodes()) {
		originalParent.parentNode.removeChild(originalParent);
	}

	// "If new parent's nextSibling is editable and meets the sibling
	// criteria:"
	if (isEditable(newParent.nextSibling)
	&& siblingCriteria(newParent.nextSibling)) {
		// "If new parent is not an inline node, but new parent's last child
		// and new parent's nextSibling's first child are both inline nodes,
		// and new parent's last child is not a br, call createElement("br") on
		// the ownerDocument of new parent and append the result as the last
		// child of new parent."
		if (!isInlineNode(newParent)
		&& isInlineNode(newParent.lastChild)
		&& isInlineNode(newParent.nextSibling.firstChild)
		&& !isHtmlElement(newParent.lastChild, "BR")) {
			newParent.appendChild(newParent.ownerDocument.createElement("br"));
		}

		// "While new parent's nextSibling has children, append its first child
		// as the last child of new parent, preserving ranges."
		while (newParent.nextSibling.hasChildNodes()) {
			movePreservingRanges(newParent.nextSibling.firstChild, newParent, -1);
		}

		// "Remove new parent's nextSibling from its parent."
		newParent.parentNode.removeChild(newParent.nextSibling);
	}

	// "Remove extraneous line breaks from new parent."
	removeExtraneousLineBreaksFrom(newParent);

	// "Return new parent."
	return newParent;
}

//@}


//////////////////////////////////////
///// Inline formatting commands /////
//////////////////////////////////////

///// Inline formatting command definitions /////
//@{

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

// "An unwrappable node is an HTML element which may not be used where only
// phrasing content is expected (not counting unknown or obsolete elements,
// which cannot be used at all); or any Element whose display property computes
// to something other than "inline", "inline-block", or "inline-table"; or any
// node that is not editable."
//
// I don't bother implementing this exactly, just well enough for testing.
function isUnwrappableNode(node) {
	if (!node) {
		return false;
	}

	if (!isEditable(node)) {
		return true;
	}

	if (node.nodeType != Node.ELEMENT_NODE) {
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

// "A modifiable element is a b, em, i, s, span, strong, sub, sup, or u element
// with no attributes except possibly style; or a font element with no
// attributes except possibly style, color, face, and/or size; or an a element
// with no attributes except possibly style and/or href."
function isModifiableElement(node) {
	if (!isHtmlElement(node)) {
		return false;
	}

	if (["B", "EM", "I", "S", "SPAN", "STRIKE", "STRONG", "SUB", "SUP", "U"].indexOf(node.tagName) != -1) {
		if (node.attributes.length == 0) {
			return true;
		}

		if (node.attributes.length == 1
		&& node.hasAttribute("style")) {
			return true;
		}
	}

	if (node.tagName == "FONT" || node.tagName == "A") {
		var numAttrs = node.attributes.length;

		if (node.hasAttribute("style")) {
			numAttrs--;
		}

		if (node.tagName == "FONT") {
			if (node.hasAttribute("color")) {
				numAttrs--;
			}

			if (node.hasAttribute("face")) {
				numAttrs--;
			}

			if (node.hasAttribute("size")) {
				numAttrs--;
			}
		}

		if (node.tagName == "A"
		&& node.hasAttribute("href")) {
			numAttrs--;
		}

		if (numAttrs == 0) {
			return true;
		}
	}

	return false;
}

function isSimpleModifiableElement(node) {
	// "A simple modifiable element is an HTML element for which at least one
	// of the following holds:"
	if (!isHtmlElement(node)) {
		return false;
	}

	// Only these elements can possibly be a simple modifiable element.
	if (["A", "B", "EM", "FONT", "I", "S", "SPAN", "STRIKE", "STRONG", "SUB", "SUP", "U"].indexOf(node.tagName) == -1) {
		return false;
	}

	// "It is an a, b, em, font, i, s, span, strike, strong, sub, sup, or u
	// element with no attributes."
	if (node.attributes.length == 0) {
		return true;
	}

	// If it's got more than one attribute, everything after this fails.
	if (node.attributes.length > 1) {
		return false;
	}

	// "It is an a, b, em, font, i, s, span, strike, strong, sub, sup, or u
	// element with exactly one attribute, which is style, which sets no CSS
	// properties (including invalid or unrecognized properties)."
	//
	// Not gonna try for invalid or unrecognized.
	if (node.hasAttribute("style")
	&& node.style.length == 0) {
		return true;
	}

	// "It is an a element with exactly one attribute, which is href."
	if (node.tagName == "A"
	&& node.hasAttribute("href")) {
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

	// "It is a sub or sub element with exactly one attribute, which is style,
	// and the style attribute sets exactly one CSS property (including invalid
	// or unrecognized properties), which is "vertical-align"."
	if ((node.tagName == "SUB" || node.tagName == "SUP")
	&& node.hasAttribute("style")
	&& node.style.length == 1
	&& node.style.verticalAlign != "") {
		return true;
	}

	// "It is an a, font, or span element with exactly one attribute, which is
	// style, and the style attribute sets exactly one CSS property (including
	// invalid or unrecognized properties), and that property is not
	// "text-decoration"."
	if ((node.tagName == "A" || node.tagName == "FONT" || node.tagName == "SPAN")
	&& node.hasAttribute("style")
	&& node.style.length == 1
	&& node.style.textDecoration == "") {
		return true;
	}

	// "It is an a, font, s, span, strike, or u element with exactly one
	// attribute, which is style, and the style attribute sets exactly one CSS
	// property (including invalid or unrecognized properties), which is
	// "text-decoration", which is set to "line-through" or "underline" or
	// "overline" or "none"."
	if (["A", "FONT", "S", "SPAN", "STRIKE", "U"].indexOf(node.tagName) != -1
	&& node.hasAttribute("style")
	&& node.style.length == 1
	&& (node.style.textDecoration == "line-through"
	|| node.style.textDecoration == "underline"
	|| node.style.textDecoration == "overline"
	|| node.style.textDecoration == "none")) {
		return true;
	}

	return false;
}

//@}

///// Assorted inline formatting command algorithms /////
//@{

function getEffectiveValue(node, command) {
	// "If neither node nor its parent is an Element, return null."
	if (node.nodeType != Node.ELEMENT_NODE
	&& (!node.parentNode || node.parentNode.nodeType != Node.ELEMENT_NODE)) {
		return null;
	}

	// "If node is not an Element, return the effective value of its parent for
	// command."
	if (node.nodeType != Node.ELEMENT_NODE) {
		return getEffectiveValue(node.parentNode, command);
	}

	// "If command is "createLink" or "unlink":"
	if (command == "createlink" || command == "unlink") {
		// "While node is not null, and is not an a element that has an href
		// attribute, set node to its parent."
		while (node
		&& (!isHtmlElement(node)
		|| node.tagName != "A"
		|| !node.hasAttribute("href"))) {
			node = node.parentNode;
		}

		// "If node is null, return null."
		if (!node) {
			return null;
		}

		// "Return the value of node's href attribute."
		return node.getAttribute("href");
	}

	// "If command is "hiliteColor":"
	if (command == "hilitecolor") {
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

	// "If command is "subscript" or "superscript":"
	if (command == "subscript" || command == "superscript") {
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

	// "If command is "strikethrough", and the "text-decoration" property of
	// node or any of its ancestors computes to a value containing
	// "line-through", return "line-through". Otherwise, return null."
	if (command == "strikethrough") {
		do {
			if (getComputedStyle(node).textDecoration.indexOf("line-through") != -1) {
				return "line-through";
			}
			node = node.parentNode;
		} while (node && node.nodeType == Node.ELEMENT_NODE);
		return null;
	}

	// "If command is "underline", and the "text-decoration" property of node
	// or any of its ancestors computes to a value containing "underline",
	// return "underline". Otherwise, return null."
	if (command == "underline") {
		do {
			if (getComputedStyle(node).textDecoration.indexOf("underline") != -1) {
				return "underline";
			}
			node = node.parentNode;
		} while (node && node.nodeType == Node.ELEMENT_NODE);
		return null;
	}

	// "Return the computed style for node of the relevant CSS property for
	// command."
	return getComputedStyle(node)[commands[command].relevantCssProperty];
}

function getSpecifiedValue(element, command) {
	// "If command is "hiliteColor" and element's display property does not
	// compute to "inline", return null."
	if (command == "hilitecolor"
	&& getComputedStyle(element).display != "inline") {
		return null;
	}

	// "If command is "createLink" or "unlink":"
	if (command == "createlink" || command == "unlink") {
		// "If element is an a element and has an href attribute, return the
		// value of that attribute."
		if (isHtmlElement(element)
		&& element.tagName == "A"
		&& element.hasAttribute("href")) {
			return element.getAttribute("href");
		}

		// "Return null."
		return null;
	}

	// "If command is "subscript" or "superscript":"
	if (command == "subscript" || command == "superscript") {
		// "If the computed style of element's "display" property is
		// neither "inline" nor "inline-block" nor "inline-table", return
		// null."
		var style = getComputedStyle(element);
		if (style.display != "inline"
		&& style.display != "inline-block"
		&& style.display != "inline-table") {
			return null;
		}

		// "If element has a style attribute set, and that attribute has
		// the effect of setting "vertical-align", return the value that it
		// sets "vertical-align" to."
		if (element.style.verticalAlign != "") {
			return element.style.verticalAlign;
		}

		// "If element is a sup, return "super"."
		if (isHtmlElement(element, "SUP")) {
			return "super";
		}

		// "If element is a sub, return "sub"."
		if (isHtmlElement(element, "SUB")) {
			return "sub";
		}

		// "Return null."
		return null;
	}

	// "If command is "strikethrough", and element has a style attribute set,
	// and that attribute sets "text-decoration":"
	if (command == "strikethrough"
	&& element.style.textDecoration != "") {
		// "If element's style attribute sets "text-decoration" to a value
		// containing "line-through", return "line-through"."
		if (element.style.textDecoration.indexOf("line-through") != -1) {
			return "line-through";
		}

		// "Return null."
		return null;
	}

	// "If command is "strikethrough" and element is a s or strike element,
	// return "line-through"."
	if (command == "strikethrough"
	&& isHtmlElement(element, ["S", "STRIKE"])) {
		return "line-through";
	}

	// "If command is "underline", and element has a style attribute set, and
	// that attribute sets "text-decoration":"
	if (command == "underline"
	&& element.style.textDecoration != "") {
		// "If element's style attribute sets "text-decoration" to a value
		// containing "underline", return "underline"."
		if (element.style.textDecoration.indexOf("underline") != -1) {
			return "underline";
		}

		// "Return null."
		return null;
	}

	// "If command is "underline" and element is a u element, return
	// "underline"."
	if (command == "underline"
	&& isHtmlElement(element, "U")) {
		return "underline";
	}

	// "Let property be the relevant CSS property for command."
	var property = commands[command].relevantCssProperty;

	// "If property is null, return null."
	if (property === null) {
		return null;
	}

	// "If element has a style attribute set, and that attribute has the
	// effect of setting property, return the value that it sets property to."
	if (element.style[property] != "") {
		return element.style[property];
	}

	// "If element is a font element that has an attribute whose effect is
	// to create a presentational hint for property, return the value that the
	// hint sets property to.  (For a size of 7, this will be the non-CSS value
	// "xxx-large".)"
	if (isHtmlNamespace(element.namespaceURI)
	&& element.tagName == "FONT") {
		if (property == "color" && element.hasAttribute("color")) {
			return element.color;
		}
		if (property == "fontFamily" && element.hasAttribute("face")) {
			return element.face;
		}
		if (property == "fontSize" && element.hasAttribute("size")) {
			// This is not even close to correct in general.
			var size = parseInt(element.size);
			if (size < 1) {
				size = 1;
			}
			if (size > 7) {
				size = 7;
			}
			return {
				1: "xx-small",
				2: "small",
				3: "medium",
				4: "large",
				5: "x-large",
				6: "xx-large",
				7: "xxx-large"
			}[size];
		}
	}

	// "If element is in the following list, and property is equal to the
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

	// "Return null."
	return null;
}

function reorderModifiableDescendants(node, command, newValue) {
	// "Let candidate equal node."
	var candidate = node;

	// "While candidate is a modifiable element, and candidate has exactly one
	// child, and that child is also a modifiable element, and candidate is not
	// a simple modifiable element or candidate's specified value for command
	// is not new value, set candidate to its child."
	while (isModifiableElement(candidate)
	&& candidate.childNodes.length == 1
	&& (!isSimpleModifiableElement(candidate)
	|| !valuesEqual(command, getSpecifiedValue(candidate, command), newValue))) {
		candidate = candidate.firstChild;
	}

	// "If candidate is node, or is not a simple modifiable element, or its
	// specified value and effective value for command are not both new value,
	// abort these steps."
	if (candidate == node
	|| !isSimpleModifiableElement(candidate)
	|| !valuesEqual(command, getSpecifiedValue(candidate, command), newValue)
	|| !valuesEqual(command, getEffectiveValue(candidate, command), newValue)) {
		return;
	}

	// "While candidate has children, insert the first child of candidate into
	// candidate's parent immediately before candidate, preserving ranges."
	while (candidate.hasChildNodes()) {
		movePreservingRanges(candidate.firstChild, candidate.parentNode, getNodeIndex(candidate));
	}

	// "Insert candidate into node's parent immediately after node."
	node.parentNode.insertBefore(candidate, node.nextSibling);

	// "Append the node as the last child of candidate, preserving ranges."
	movePreservingRanges(node, candidate, -1);
}

//@}

///// Decomposing a range into nodes /////
//@{

function decomposeRange(range) {
	// "If range's start and end are the same, return an empty list."
	if (range.startContainer == range.endContainer
	&& range.startOffset == range.endOffset) {
		return [];
	}

	// "If range's start node is a Text node and its start offset is neither 0
	// nor the length of its start node, run splitText() on its start node with
	// argument equal to its start offset."
	if (range.startContainer.nodeType == Node.TEXT_NODE
	&& range.startOffset != 0
	&& range.startOffset != getNodeLength(range.startContainer)) {
		// Account for UAs not following range mutation rules
		if (range.startContainer == range.endContainer) {
			var newEndOffset = range.endOffset - range.startOffset;
			var newText = range.startContainer.splitText(range.startOffset);
			range.setStart(newText, 0);
			range.setEnd(newText, newEndOffset);
		} else {
			var newText = range.startContainer.splitText(range.startOffset);
			range.setStart(newText, 0);
		}
	}

	// "If range's end node is a Text node and its end offset is neither 0 nor
	// the length of its end node, run splitText() on its end node with
	// argument equal to its end offset."
	if (range.endContainer.nodeType == Node.TEXT_NODE
	&& range.endOffset != 0
	&& range.endOffset != getNodeLength(range.endContainer)) {
		// IE seems to mutate the range incorrectly here, so we need correction
		// here as well.
		var newStart = [range.startContainer, range.startOffset];
		var newEnd = [range.endContainer, range.endOffset];
		range.endContainer.splitText(range.endOffset);
		range.setStart(newStart[0], newStart[1]);
		range.setEnd(newEnd[0], newEnd[1]);
	}

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

//@}

///// Clearing an element's value /////
//@{

function clearValue(element, command) {
	// "If element's specified value for command is null, return the empty
	// list."
	if (getSpecifiedValue(element, command) === null) {
		return [];
	}

	// "If element is a simple modifiable element:"
	if (isSimpleModifiableElement(element)) {
		// "Let children be the children of element."
		var children = Array.prototype.slice.call(element.childNodes);

		// "While element has children, insert its first child into its parent
		// immediately before it, preserving ranges."
		while (element.childNodes.length) {
			movePreservingRanges(element.firstChild, element.parentNode, getNodeIndex(element));
		}

		// "Remove element from its parent."
		element.parentNode.removeChild(element);

		// "Return children."
		return children;
	}

	// "If command is "strikethrough", and element has a style attribute that
	// sets "text-decoration" to some value containing "line-through", delete
	// "line-through" from the value."
	if (command == "strikethrough"
	&& element.style.textDecoration.indexOf("line-through") != -1) {
		if (element.style.textDecoration == "line-through") {
			element.style.textDecoration = "";
		} else {
			element.style.textDecoration = element.style.textDecoration.replace("line-through", "");
		}
		if (element.getAttribute("style") == "") {
			element.removeAttribute("style");
		}
	}

	// "If command is "underline", and element has a style attribute that sets
	// "text-decoration" to some value containing "underline", delete
	// "underline" from the value."
	if (command == "underline"
	&& element.style.textDecoration.indexOf("underline") != -1) {
		if (element.style.textDecoration == "underline") {
			element.style.textDecoration = "";
		} else {
			element.style.textDecoration = element.style.textDecoration.replace("underline", "");
		}
		if (element.getAttribute("style") == "") {
			element.removeAttribute("style");
		}
	}

	// "If the relevant CSS property for command is not null, unset the CSS
	// property property of element."
	if (commands[command].relevantCssProperty !== null) {
		element.style[commands[command].relevantCssProperty] = '';
		if (element.getAttribute("style") == "") {
			element.removeAttribute("style");
		}
	}

	// "If element is a font element:"
	if (isHtmlNamespace(element.namespaceURI) && element.tagName == "FONT") {
		// "If command is "foreColor", unset element's color attribute, if set."
		if (command == "forecolor") {
			element.removeAttribute("color");
		}

		// "If command is "fontName", unset element's face attribute, if set."
		if (command == "fontname") {
			element.removeAttribute("face");
		}

		// "If command is "fontSize", unset element's size attribute, if set."
		if (command == "fontsize") {
			element.removeAttribute("size");
		}
	}

	// "If element is an a element and command is "createLink" or "unlink",
	// unset the href property of element."
	if (isHtmlElement(element, "A")
	&& (command == "createlink" || command == "unlink")) {
		element.removeAttribute("href");
	}

	// "If element's specified value for command is null, return the empty
	// list."
	if (getSpecifiedValue(element, command) === null) {
		return [];
	}

	// "Let new element be a new HTML element with name "span", with the
	// same attributes and ownerDocument as element."
	var newElement = element.ownerDocument.createElement("span");
	for (var j = 0; j < element.attributes.length; j++) {
		// FIXME: Namespaces?
		newElement.setAttribute(element.attributes[j].localName, element.attributes[j].value);
	}

	// "Insert new element into the parent of element immediately before it."
	element.parentNode.insertBefore(newElement, element);

	// "While element has children, append its first child as the last child of
	// new element, preserving ranges."
	while (element.childNodes.length) {
		movePreservingRanges(element.firstChild, newElement, newElement.childNodes.length);
	}

	// "Remove element from its parent."
	element.parentNode.removeChild(element);

	// "Return the one-Node list consisting of new element."
	return [newElement];
}

//@}

///// Pushing down values /////
//@{

function pushDownValues(node, command, newValue) {
	// "If node's parent is not an Element, abort this algorithm."
	if (!node.parentNode
	|| node.parentNode.nodeType != Node.ELEMENT_NODE) {
		return;
	}

	// "If the effective value of command is new value on node, abort this
	// algorithm."
	if (valuesEqual(command, getEffectiveValue(node, command), newValue)) {
		return;
	}

	// "Let current ancestor be node's parent."
	var currentAncestor = node.parentNode;

	// "Let ancestor list be a list of Nodes, initially empty."
	var ancestorList = [];

	// "While current ancestor is an editable Element and the effective value
	// of command is not new value on it, append current ancestor to ancestor
	// list, then set current ancestor to its parent."
	while (isEditable(currentAncestor)
	&& currentAncestor.nodeType == Node.ELEMENT_NODE
	&& !valuesEqual(command, getEffectiveValue(currentAncestor, command), newValue)) {
		ancestorList.push(currentAncestor);
		currentAncestor = currentAncestor.parentNode;
	}

	// "If ancestor list is empty, abort this algorithm."
	if (!ancestorList.length) {
		return;
	}

	// "Let propagated value be the specified value of command on the last
	// member of ancestor list."
	var propagatedValue = getSpecifiedValue(ancestorList[ancestorList.length - 1], command);

	// "If propagated value is null and is not equal to new value, abort this
	// algorithm."
	if (propagatedValue === null && propagatedValue != newValue) {
		return;
	}

	// "If the effective value of command is not new value on the parent of
	// the last member of ancestor list, and new value is not null, abort this
	// algorithm."
	if (newValue !== null
	&& !valuesEqual(command, getEffectiveValue(ancestorList[ancestorList.length - 1].parentNode, command), newValue)) {
		return;
	}

	// "While ancestor list is not empty:"
	while (ancestorList.length) {
		// "Let current ancestor be the last member of ancestor list."
		// "Remove the last member from ancestor list."
		var currentAncestor = ancestorList.pop();

		// "If the specified value of current ancestor for command is not null,
		// set propagated value to that value."
		if (getSpecifiedValue(currentAncestor, command) !== null) {
			propagatedValue = getSpecifiedValue(currentAncestor, command);
		}

		// "Let children be the children of current ancestor."
		var children = Array.prototype.slice.call(currentAncestor.childNodes);

		// "If the specified value of current ancestor for command is not null,
		// clear the value of current ancestor."
		if (getSpecifiedValue(currentAncestor, command) !== null) {
			clearValue(currentAncestor, command);
		}

		// "For every child in children:"
		for (var i = 0; i < children.length; i++) {
			var child = children[i];

			// "If child is node, continue with the next child."
			if (child == node) {
				continue;
			}

			// "If child is an Element whose specified value for command
			// is neither null nor equal to propagated value, continue with the
			// next child."
			if (child.nodeType == Node.ELEMENT_NODE
			&& getSpecifiedValue(child, command) !== null
			&& !valuesEqual(command, propagatedValue, getSpecifiedValue(child, command))) {
				continue;
			}

			// "If child is the last member of ancestor list, continue with the
			// next child."
			if (child == ancestorList[ancestorList.length - 1]) {
				continue;
			}

			// "Force the value of child, with command as in this algorithm
			// and new value equal to propagated value."
			forceValue(child, command, propagatedValue);
		}
	}
}

//@}

///// Forcing the value of a node /////
//@{

function forceValue(node, command, newValue) {
	// "If node's parent is null, abort this algorithm."
	if (!node.parentNode) {
		return;
	}

	// "If new value is null, abort this algorithm."
	if (newValue === null) {
		return;
	}

	// "If node is an Element, Text, Comment, or ProcessingInstruction node,
	// and is not an unwrappable node:"
	if ((node.nodeType == Node.ELEMENT_NODE
	|| node.nodeType == Node.TEXT_NODE
	|| node.nodeType == Node.COMMENT_NODE
	|| node.nodeType == Node.PROCESSING_INSTRUCTION_NODE)
	&& !isUnwrappableNode(node)) {
		// "Reorder modifiable descendants of node's previousSibling."
		reorderModifiableDescendants(node.previousSibling, command, newValue);

		// "Reorder modifiable descendants of node's nextSibling."
		reorderModifiableDescendants(node.nextSibling, command, newValue);

		// "Wrap the one-node list consisting of node, with sibling criteria
		// matching a simple modifiable element whose specified value and
		// effective value for command are both new value, and with new parent
		// instructions returning null."
		wrap([node],
			function(node) {
				return isSimpleModifiableElement(node)
					&& valuesEqual(command, getSpecifiedValue(node, command), newValue)
					&& valuesEqual(command, getEffectiveValue(node, command), newValue);
			},
			function() { return null }
		);
	}

	// "If the effective value of command is new value on node, abort this
	// algorithm."
	if (valuesEqual(command, getEffectiveValue(node, command), newValue)) {
		return;
	}

	// "If node is an unwrappable node:"
	if (isUnwrappableNode(node)) {
		// "Let children be all children of node, omitting any that are
		// Elements whose specified value for command is neither null nor
		// equal to new value."
		var children = [];
		for (var i = 0; i < node.childNodes.length; i++) {
			if (node.childNodes[i].nodeType == Node.ELEMENT_NODE) {
				var specifiedValue = getSpecifiedValue(node.childNodes[i], command);

				if (specifiedValue !== null
				&& !valuesEqual(command, newValue, specifiedValue)) {
					continue;
				}
			}
			children.push(node.childNodes[i]);
		}

		// "Force the value of each Node in children, with command and new
		// value as in this invocation of the algorithm."
		for (var i = 0; i < children.length; i++) {
			forceValue(children[i], command, newValue);
		}

		// "Abort this algorithm."
		return;
	}

	// "If node is a Comment or ProcessingInstruction, abort this algorithm."
	if (node.nodeType == Node.COMMENT_NODE
	|| node.nodeType == Node.PROCESSING_INSTRUCTION_NODE) {
		return;
	}

	// "If the effective value of command is new value on node, abort this
	// algorithm."
	if (valuesEqual(command, getEffectiveValue(node, command), newValue)) {
		return;
	}

	// "Let new parent be null."
	var newParent = null;

	// "If the CSS styling flag is false:"
	if (!cssStylingFlag) {
		// "If command is "bold" and new value is "bold", let new parent be the
		// result of calling createElement("b") on the ownerDocument of node."
		if (command == "bold" && (newValue == "bold" || newValue == "700")) {
			newParent = node.ownerDocument.createElement("b");
		}

		// "If command is "italic" and new value is "italic", let new parent be
		// the result of calling createElement("i") on the ownerDocument of
		// node."
		if (command == "italic" && newValue == "italic") {
			newParent = node.ownerDocument.createElement("i");
		}

		// "If command is "strikethrough" and new value is "line-through", let
		// new parent be the result of calling createElement("s") on the
		// ownerDocument of node."
		if (command == "strikethrough" && newValue == "line-through") {
			newParent = node.ownerDocument.createElement("s");
		}

		// "If command is "underline" and new value is "underline", let new
		// parent be the result of calling createElement("u") on the
		// ownerDocument of node."
		if (command == "underline" && newValue == "underline") {
			newParent = node.ownerDocument.createElement("u");
		}

		// "If command is "foreColor", and new value is fully opaque with red,
		// green, and blue components in the range 0 to 255:"
		//
		// Not going to do this properly, only well enough to pass tests.
		if (command == "forecolor" && parseSimpleColor(newValue)) {
			// "Let new parent be the result of calling createElement("font")
			// on the ownerDocument of node."
			newParent = node.ownerDocument.createElement("font");

			// "If new value is one of the colors listed in the SVG color
			// keywords section of CSS3 Color, set the color attribute of new
			// parent to new value."
			//
			// "Otherwise, set the color attribute of new parent to the result
			// of applying the rules for serializing simple color values to new
			// value (interpreted as a simple color)."
			newParent.setAttribute("color", parseSimpleColor(newValue));
		}

		// "If command is "fontName", let new parent be the result of calling
		// createElement("font") on the ownerDocument of node, then set the
		// face attribute of new parent to new value."
		if (command == "fontname") {
			newParent = node.ownerDocument.createElement("font");
			newParent.face = newValue;
		}
	}

	// "If command is "createLink" or "unlink":"
	if (command == "createlink" || command == "unlink") {
		// "Let new parent be the result of calling createElement("a") on the
		// ownerDocument of node."
		newParent = node.ownerDocument.createElement("a");

		// "Set the href attribute of new parent to new value."
		newParent.setAttribute("href", newValue);

		// "Let ancestor be node's parent."
		var ancestor = node.parentNode;

		// "While ancestor is not null:"
		while (ancestor) {
			// "If ancestor is an a, set the tag name of ancestor to "span",
			// and let ancestor be the result."
			if (isHtmlElement(ancestor, "A")) {
				ancestor = setTagName(ancestor, "span");
			}

			// "Set ancestor to its parent."
			ancestor = ancestor.parentNode;
		}
	}

	// "If command is "fontSize"; and new value is one of "xx-small", "small",
	// "medium", "large", "x-large", "xx-large", or "xxx-large"; and either the
	// CSS styling flag is false, or new value is "xxx-large": let new parent
	// be the result of calling createElement("font") on the ownerDocument of
	// node, then set the size attribute of new parent to the number from the
	// following table based on new value: [table omitted]"
	if (command == "fontsize"
	&& ["xx-small", "small", "medium", "large", "x-large", "xx-large", "xxx-large"].indexOf(newValue) != -1
	&& (!cssStylingFlag || newValue == "xxx-large")) {
		newParent = node.ownerDocument.createElement("font");
		newParent.size = {
			"xx-small": 1,
			"small": 2,
			"medium": 3,
			"large": 4,
			"x-large": 5,
			"xx-large": 6,
			"xxx-large": 7
		}[newValue];
	}

	// "If command is "subscript" or "superscript" and new value is "sub", let
	// new parent be the result of calling createElement("sub") on the
	// ownerDocument of node."
	if ((command == "subscript" || command == "superscript")
	&& newValue == "sub") {
		newParent = node.ownerDocument.createElement("sub");
	}

	// "If command is "subscript" or "superscript" and new value is "super",
	// let new parent be the result of calling createElement("sup") on the
	// ownerDocument of node."
	if ((command == "subscript" || command == "superscript")
	&& newValue == "super") {
		newParent = node.ownerDocument.createElement("sup");
	}

	// "If new parent is null, let new parent be the result of calling
	// createElement("span") on the ownerDocument of node."
	if (!newParent) {
		newParent = node.ownerDocument.createElement("span");
	}

	// "Insert new parent in node's parent before node."
	node.parentNode.insertBefore(newParent, node);

	// "If the effective value of command for new parent is not new value, and
	// the relevant CSS property for command is not null, set that CSS property
	// of new parent to new value (if the new value would be valid)."
	var property = commands[command].relevantCssProperty;
	if (property !== null
	&& !valuesEqual(command, getEffectiveValue(newParent, command), newValue)) {
		newParent.style[property] = newValue;
	}

	// "If command is "strikethrough", and new value is "line-through", and the
	// effective value of "strikethrough" for new parent is not "line-through",
	// set the "text-decoration" property of new parent to "line-through"."
	if (command == "strikethrough"
	&& newValue == "line-through"
	&& getEffectiveValue(newParent, "strikethrough") != "line-through") {
		newParent.style.textDecoration = "line-through";
	}

	// "If command is "underline", and new value is "underline", and the
	// effective value of "underline" for new parent is not "underline", set
	// the "text-decoration" property of new parent to "underline"."
	if (command == "underline"
	&& newValue == "underline"
	&& getEffectiveValue(newParent, "underline") != "underline") {
		newParent.style.textDecoration = "underline";
	}

	// "Append node to new parent as its last child, preserving ranges."
	movePreservingRanges(node, newParent, newParent.childNodes.length);

	// "If node is an Element and the effective value of command for node is
	// not new value:"
	if (node.nodeType == Node.ELEMENT_NODE
	&& !valuesEqual(command, getEffectiveValue(node, command), newValue)) {
		// "Insert node into the parent of new parent before new parent,
		// preserving ranges."
		movePreservingRanges(node, newParent.parentNode, getNodeIndex(newParent));

		// "Remove new parent from its parent."
		newParent.parentNode.removeChild(newParent);

		// "If new parent is a span, and either a) command is "underline" or
		// "strikethrough", or b) command is "fontSize" and new value is not
		// "xxx-large", or c) command is not "fontSize" and the relevant CSS
		// property for command is not null:"
		if (newParent.tagName == "SPAN"
		&& (
			(command == "underline" || command == "strikethrough")
			|| (command == "fontsize" && newValue != "xxx-large")
			|| (command != "fontsize" && property !== null)
		)) {
			// "If the relevant CSS property for command is not null, set that
			// CSS property of node to new value."
			if (property !== null) {
				node.style[property] = newValue;
			}

			// "If command is "strikethrough" and new value is "line-through",
			// alter the "text-decoration" property of node to include
			// "line-through" (preserving "overline" or "underline" if
			// present)."
			if (command == "strikethrough" && newValue == "line-through") {
				if (node.style.textDecoration == ""
				|| node.style.textDecoration == "none") {
					node.style.textDecoration = "line-through";
				} else {
					node.style.textDecoration += " line-through";
				}
			}

			// "If command is "underline" and new value is "underline", alter
			// the "text-decoration" property of node to include "underline"
			// (preserving "overline" or "line-through" if present)."
			if (command == "underline" && newValue == "underline") {
				if (node.style.textDecoration == ""
				|| node.style.textDecoration == "none") {
					node.style.textDecoration = "underline";
				} else {
					node.style.textDecoration += " underline";
				}
			}

		// "Otherwise:"
		} else {
			// "Let children be all children of node, omitting any that are
			// Elements whose specified value for command is neither null nor
			// equal to new value."
			var children = [];
			for (var i = 0; i < node.childNodes.length; i++) {
				if (node.childNodes[i].nodeType == Node.ELEMENT_NODE) {
					var specifiedValue = getSpecifiedValue(node.childNodes[i], command);

					if (specifiedValue !== null
					&& !valuesEqual(command, newValue, specifiedValue)) {
						continue;
					}
				}
				children.push(node.childNodes[i]);
			}

			// "Force the value of each Node in children, with command and new
			// value as in this invocation of the algorithm."
			for (var i = 0; i < children.length; i++) {
				forceValue(children[i], command, newValue);
			}
		}
	}
}

//@}

///// Setting the value of a node /////
//@{

function setNodeValue(node, command, newValue) {
	// "If node is not editable:"
	if (!isEditable(node)) {
		// "Let children be the children of node."
		var children = Array.prototype.slice.call(node.childNodes);

		// "Set the value of each member of children."
		for (var i = 0; i < children.length; i++) {
			setNodeValue(children[i], command, newValue);
		}

		// "Abort this algorithm."
		return;
	}

	// "If node is an Element:"
	if (node.nodeType == Node.ELEMENT_NODE) {
		// "Clear the value of node, and let new nodes be the result."
		var newNodes = clearValue(node, command);

		// "For each new node in new nodes, set the value of new node, with the
		// same inputs as this invocation of the algorithm."
		for (var i = 0; i < newNodes.length; i++) {
			setNodeValue(newNodes[i], command, newValue);
		}

		// "If node's parent is null, abort this algorithm."
		if (!node.parentNode) {
			return;
		}
	}

	// "Push down values on node."
	pushDownValues(node, command, newValue);

	// "Force the value of node."
	forceValue(node, command, newValue);

	// "Let children be the children of node."
	var children = Array.prototype.slice.call(node.childNodes);

	// "Set the value of each member of children."
	for (var i = 0; i < children.length; i++) {
		setNodeValue(children[i], command, newValue);
	}
}

//@}

///// The backColor command /////
// Unimplemented
commands.backcolor = {};

///// The bold command /////
//@{
commands.bold = {
	action: function() {
		// "Decompose the active range. If the state is then false, set the
		// value of each returned node to "bold", otherwise set the value to
		// "normal"."
		var nodeList = decomposeRange(getActiveRange());
		var newValue = commands.bold.state() ? "normal" : "bold";
		for (var i = 0; i < nodeList.length; i++) {
			setNodeValue(nodeList[i], "bold", newValue);
		}
	}, state: function() { return stateHelper(function(node) {
		// "True if every editable Text node that is effectively contained in
		// the active range has effective value at least 700. Otherwise false."
		var fontWeight = getEffectiveValue(node, "bold");
		return fontWeight === "bold"
			|| fontWeight === "700"
			|| fontWeight === "800"
			|| fontWeight === "900";
	})}, relevantCssProperty: "fontWeight"
};
//@}

///// The createLink command /////
//@{
commands.createlink = {
	action: function(value) {
		// "If value is the empty string, abort these steps and do nothing."
		if (value === "") {
			return;
		}

		// "Decompose the active range, and let node list be the result."
		var nodeList = decomposeRange(getActiveRange());

		// "For each a element that has an href attribute and is an ancestor of
		// some node in node list, set that element's href attribute to value."
		for (var i = 0; i < nodeList.length; i++) {
			var candidate = nodeList[i].parentNode;
			while (candidate) {
				if (isHtmlElement(candidate, "A")
				&& candidate.hasAttribute("href")) {
					candidate.setAttribute("href", value);
				}

				candidate = candidate.parentNode;
			}
		}

		// "Set the value of each node in node list to value."
		for (var i = 0; i < nodeList.length; i++) {
			setNodeValue(nodeList[i], "createlink", value);
		}
	}
};
//@}

///// The fontName command /////
//@{
commands.fontname = {
	action: function(value) {
		// "Decompose the active range, then set the value of each returned
		// node to value."
		var nodeList = decomposeRange(getActiveRange());
		for (var i = 0; i < nodeList.length; i++) {
			setNodeValue(nodeList[i], "fontname", value);
		}
	}, relevantCssProperty: "fontFamily"
};
//@}

///// The fontSize command /////
//@{
commands.fontsize = {
	action: function(value) {
		// "If value is the empty string, do nothing and abort these steps."
		if (value === "") {
			return;
		}

		// "Strip leading and trailing whitespace from value."
		//
		// Cheap hack, not following the actual algorithm.
		value = value.trim();

		// "If value is a valid floating point number, or would be a valid
		// floating point number if a single leading "+" character were
		// stripped:"
		if (/^[-+]?[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?$/.test(value)) {
			var mode;

			// "If the first character of value is "+", delete the character
			// and let mode be "relative-plus"."
			if (value[0] == "+") {
				value = value.slice(1);
				mode = "relative-plus";
			// "Otherwise, if the first character of value is "-", delete the
			// character and let mode be "relative-minus"."
			} else if (value[0] == "-") {
				value = value.slice(1);
				mode = "relative-minus";
			// "Otherwise, let mode be "absolute"."
			} else {
				mode = "absolute";
			}

			// "Apply the rules for parsing non-negative integers to value, and
			// let number be the result."
			//
			// Another cheap hack.
			var num = parseInt(value);

			// "If mode is "relative-plus", add three to number."
			if (mode == "relative-plus") {
				num += 3;
			}

			// "If mode is "relative-minus", negate number, then add three to
			// it."
			if (mode == "relative-minus") {
				num = 3 - num;
			}

			// "If number is less than one, let number equal 1."
			if (num < 1) {
				num = 1;
			}

			// "If number is greater than seven, let number equal 7."
			if (num > 7) {
				num = 7;
			}

			// "Set value to the string here corresponding to number:" [table
			// omitted]
			value = {
				1: "xx-small",
				2: "small",
				3: "medium",
				4: "large",
				5: "x-large",
				6: "xx-large",
				7: "xxx-large"
			}[num];
		}

		// "If value is not one of the strings "xx-small", "x-small", "small",
		// "medium", "large", "x-large", "xx-large", "xxx-large", and is not a
		// valid CSS absolute length, then do nothing and abort these steps."
		//
		// More cheap hacks to skip valid CSS absolute length checks.
		if (["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "xxx-large"].indexOf(value) == -1
		&& !/^[0-9]+(\.[0-9]+)?(cm|mm|in|pt|pc)$/.test(value)) {
			return;
		}

		// "Decompose the active range, then set the value of each returned
		// node to value."
		var nodeList = decomposeRange(getActiveRange());
		for (var i = 0; i < nodeList.length; i++) {
			setNodeValue(nodeList[i], "fontsize", value);
		}
	}, relevantCssProperty: "fontSize"
};
//@}

///// The foreColor command /////
//@{
commands.forecolor = {
	action: function(value) {
		// Copy-pasted, same as hiliteColor

		// "If value is not a valid CSS color, prepend "#" to it."
		//
		// "If value is still not a valid CSS color, or if it is currentColor,
		// do nothing and abort these steps."
		//
		// Cheap hack for testing, no attempt to be comprehensive.
		if (/^([0-9a-fA-F]{3}){1,2}$/.test(value)) {
			value = "#" + value;
		}
		if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(value)
		&& !/^(rgba?|hsla?)\(.*\)$/.test(value)
		// Not gonna list all the keywords, only the ones I use.
		&& value != "red"
		&& value != "cornsilk"
		&& value != "transparent") {
			return;
		}

		// "Decompose the active range, then set the value of each returned
		// node to value."
		var nodeList = decomposeRange(getActiveRange());
		for (var i = 0; i < nodeList.length; i++) {
			setNodeValue(nodeList[i], "forecolor", value);
		}
	}, relevantCssProperty: "color"
};
//@}

///// The hiliteColor command /////
//@{
commands.hilitecolor = {
	action: function(value) {
		// Copy-pasted, same as foreColor

		// "If value is not a valid CSS color, prepend "#" to it."
		//
		// "If value is still not a valid CSS color, or if it is currentColor,
		// do nothing and abort these steps."
		//
		// Cheap hack for testing, no attempt to be comprehensive.
		if (/^([0-9a-fA-F]{3}){1,2}$/.test(value)) {
			value = "#" + value;
		}
		if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(value)
		&& !/^(rgba?|hsla?)\(.*\)$/.test(value)
		// Not gonna list all the keywords, only the ones I use.
		&& value != "red"
		&& value != "cornsilk"
		&& value != "transparent") {
			return;
		}

		// "Decompose the active range, then set the value of each returned
		// node to value."
		var nodeList = decomposeRange(getActiveRange());
		for (var i = 0; i < nodeList.length; i++) {
			setNodeValue(nodeList[i], "hilitecolor", value);
		}
	}, relevantCssProperty: "backgroundColor"
};
//@}

///// The italic command /////
//@{
commands.italic = {
	action: function() {
		// "Decompose the active range. If the state is then false, set the
		// value of each returned node to "italic", otherwise set the value to
		// "normal"."
		var nodeList = decomposeRange(getActiveRange());
		var newValue = commands.italic.state() ? "normal" : "italic";
		for (var i = 0; i < nodeList.length; i++) {
			setNodeValue(nodeList[i], "italic", newValue);
		}
	}, state: function() { return stateHelper(function(node) {
		// "True if every editable Text node that is effectively contained in
		// the active range has effective value either "italic" or "oblique".
		// Otherwise false."
		var value = getEffectiveValue(node, "italic");
		return value == "italic" || value == "oblique";
	})}, relevantCssProperty: "fontStyle"
};
//@}

///// The removeFormat command /////
//@{
commands.removeformat = {
	action: function() {
		// "Decompose the active range, and let node list be the result."
		var nodeList = decomposeRange(getActiveRange());

		// "For each node in node list, unset the style attribute of node (if
		// it's an Element) and then all its Element descendants."
		for (var i = 0; i < nodeList.length; i++) {
			for (
				var node = nodeList[i];
				node != nextNodeDescendants(nodeList[i]);
				node = nextNode(node)
			) {
				if (node.nodeType == Node.ELEMENT_NODE) {
					node.removeAttribute("style");
				}
			}
		}

		// "Let elements to remove be a list of all HTML elements that are the
		// same as or descendants of some member of node list and have non-null
		// parents and satisfy (insert conditions here)."
		var elementsToRemove = [];
		for (var i = 0; i < nodeList.length; i++) {
			for (
				var node = nodeList[i];
				node == nodeList[i] || isDescendant(node, nodeList[i]);
				node = nextNode(node)
			) {
				if (isHtmlElement(node)
				&& node.parentNode
				// FIXME: Extremely partial list for testing
				&& ["A", "AUDIO", "BR", "DIV", "HR", "IMG", "P", "TD", "VIDEO", "WBR"].indexOf(node.tagName) == -1) {
					elementsToRemove.push(node);
				}
			}
		}

		// "For each element in elements to remove:"
		for (var i = 0; i < elementsToRemove.length; i++) {
			var element = elementsToRemove[i];

			// "While element has children, insert the first child of element
			// into the parent of element immediately before element,
			// preserving ranges."
			while (element.childNodes.length) {
				movePreservingRanges(element.firstChild, element.parentNode, getNodeIndex(element));
			}

			// "Remove element from its parent."
			element.parentNode.removeChild(element);
		}

		// "For each of the entries in the following table, in the given order:
		// decompose the active range again; then set the value of the
		// resulting nodes, with command and new value as given."
		var table = {
			"subscript": "baseline",
			"bold": "normal",
			"fontname": null,
			"fontsize": null,
			"forecolor": null,
			"hilitecolor": null,
			"italic": "normal",
			"strikethrough": null,
			"underline": null,
		};
		for (var command in table) {
			var nodeList = decomposeRange(getActiveRange());
			for (var i = 0; i < nodeList.length; i++) {
				setNodeValue(nodeList[i], command, table[command]);
			}
		}
	}
};
//@}

///// The strikethrough command /////
//@{
commands.strikethrough = {
	action: function() {
		// "Decompose the active range. If the state is then false, set the
		// value of each returned node to "line-through", otherwise set the
		// value to null."
		var nodeList = decomposeRange(getActiveRange());
		var newValue = commands.strikethrough.state() ? null : "line-through";
		for (var i = 0; i < nodeList.length; i++) {
			setNodeValue(nodeList[i], "strikethrough", newValue);
		}
	}, state: function() { return stateHelper(function(node) {
		// "True if every editable Text node that is effectively contained in
		// the active range has effective value "line-through". Otherwise
		// false."
		return getEffectiveValue(node, "strikethrough") == "line-through";
	})}
};
//@}

///// The subscript command /////
//@{
commands.subscript = {
	action: function() {
		// "Decompose the active range, and let node list be the result."
		var nodeList = decomposeRange(getActiveRange());

		// "Let state be the state."
		var state = commands.subscript.state();

		// "Set the value of each node in node list to "baseline"."
		for (var i = 0; i < nodeList.length; i++) {
			setNodeValue(nodeList[i], "subscript", "baseline");
		}

		// "If state is false, decompose the active range again and set the
		// value of each returned node to "sub"."
		if (!state) {
			nodeList = decomposeRange(getActiveRange());
			for (var i = 0; i < nodeList.length; i++) {
				setNodeValue(nodeList[i], "subscript", "sub");
			}
		}
	}, state: function() { return stateHelper(function(node) {
		// "True if every editable Text node that is effectively contained in
		// the active range has effective value "sub". Otherwise false."
		return getEffectiveValue(node, "subscript") == "sub";
	})}, relevantCssProperty: "verticalAlign"
};
//@}

///// The superscript command /////
//@{
commands.superscript = {
	action: function() {
		// "Decompose the active range, and let node list be the result."
		var nodeList = decomposeRange(getActiveRange());

		// "Let state be the state."
		var state = commands.superscript.state();

		// "Set the value of each node in node list to "baseline"."
		for (var i = 0; i < nodeList.length; i++) {
			setNodeValue(nodeList[i], "superscript", "baseline");
		}

		// "If state is false, decompose the active range again and set the
		// value of each returned node to "super"."
		if (!state) {
			nodeList = decomposeRange(getActiveRange());
			for (var i = 0; i < nodeList.length; i++) {
				setNodeValue(nodeList[i], "superscript", "super");
			}
		}
	}, state: function() { return stateHelper(function(node) {
		// "True if every editable Text node that is effectively contained in
		// the active range has effective value "super". Otherwise false."
		return getEffectiveValue(node, "superscript") == "super";
	})}, relevantCssProperty: "verticalAlign"
};
//@}

///// The underline command /////
//@{
commands.underline = {
	action: function() {
		// "Decompose the active range. If the state is then false, set the
		// value of each returned node to "underline", otherwise set the value
		// to null."
		var nodeList = decomposeRange(getActiveRange());
		var newValue = commands.underline.state() ? null : "underline";
		for (var i = 0; i < nodeList.length; i++) {
			setNodeValue(nodeList[i], "underline", newValue);
		}
	}, state: function() { return stateHelper(function(node) {
		// "True if every editable Text node that is effectively contained in
		// the active range has effective value "underline". Otherwise false."
		return getEffectiveValue(node, "underline") === "underline";
	})}
};
//@}

///// The unlink command /////
//@{
commands.unlink = {
	action: function() {
		// "Let hyperlinks be a list of every a element that has an href
		// attribute and is contained in the active range or is an ancestor of
		// one of its boundary points."
		//
		// As usual, take care to ensure it's tree order.  The correctness of
		// the following is left as an exercise for the reader.
		var range = getActiveRange();
		var hyperlinks = [];
		for (
			var node = range.startContainer;
			node;
			node = node.parentNode
		) {
			if (isHtmlElement(node, "A")
			&& node.hasAttribute("href")) {
				hyperlinks.unshift(node);
			}
		}
		for (
			var node = range.startContainer;
			node != nextNodeDescendants(range.endContainer);
			node = nextNode(node)
		) {
			if (isHtmlElement(node, "A")
			&& node.hasAttribute("href")
			&& (isContained(node, range)
			|| isAncestor(node, range.endContainer)
			|| node == range.endContainer)) {
				hyperlinks.push(node);
			}
		}

		// "Clear the value of each member of hyperlinks."
		for (var i = 0; i < hyperlinks.length; i++) {
			clearValue(hyperlinks[i], "unlink");
		}
	}
};
//@}


/////////////////////////////////////
///// Block formatting commands /////
/////////////////////////////////////

///// Block formatting command definitions /////
//@{

// "A prohibited paragraph child name is "address", "article", "aside",
// "blockquote", "caption", "center", "col", "colgroup", "details", "dd",
// "dir", "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer",
// "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "li",
// "listing", "menu", "nav", "ol", "p", "plaintext", "pre", "section",
// "summary", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul", or
// "xmp"."
var prohibitedParagraphChildNames = ["address", "article", "aside",
	"blockquote", "caption", "center", "col", "colgroup", "details", "dd",
	"dir", "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer",
	"form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "li",
	"listing", "menu", "nav", "ol", "p", "plaintext", "pre", "section",
	"summary", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul",
	"xmp"];

// "A prohibited paragraph child is an HTML element whose local name is a
// prohibited paragraph child name."
function isProhibitedParagraphChild(node) {
	return isHtmlElement(node, prohibitedParagraphChildNames);
}

// "A name of an element with inline contents is "a", "abbr", "b", "bdi",
// "bdo", "cite", "code", "dfn", "em", "h1", "h2", "h3", "h4", "h5", "h6", "i",
// "kbd", "mark", "pre", "q", "rp", "rt", "ruby", "s", "samp", "small", "span",
// "strong", "sub", "sup", "u", "var", "acronym", "listing", "strike", "xmp",
// "big", "blink", "font", "marquee", "nobr", or "tt"."
var namesOfElementsWithInlineContents = ["a", "abbr", "b", "bdi", "bdo",
	"cite", "code", "dfn", "em", "h1", "h2", "h3", "h4", "h5", "h6", "i",
	"kbd", "mark", "pre", "q", "rp", "rt", "ruby", "s", "samp", "small",
	"span", "strong", "sub", "sup", "u", "var", "acronym", "listing", "strike",
	"xmp", "big", "blink", "font", "marquee", "nobr", "tt"];

// "An element with inline contents is an HTML element whose local name is a
// name of an element with inline contents."
function isElementWithInlineContents(node) {
	return isHtmlElement(node, namesOfElementsWithInlineContents);
}

// "A potential indentation element is either a blockquote, or a div that has a
// style attribute that sets "margin" or some subproperty of it."
function isPotentialIndentationElement(node) {
	if (!isHtmlElement(node)) {
		return false;
	}

	if (node.tagName == "BLOCKQUOTE") {
		return true;
	}

	if (node.tagName != "DIV") {
		return false;
	}

	for (var i = 0; i < node.style.length; i++) {
		// Approximate check
		if (/^(-[a-z]+-)?margin/.test(node.style[i])) {
			return true;
		}
	}

	return false;
}

// "An indentation element is a potential indentation element that has no
// attributes other than one or more of
//
//   * "a style attribute that sets no properties other than "margin", "border",
//     "padding", or subproperties of those;
//   * "a class attribute;
//   * "a dir attribute."
function isIndentationElement(node) {
	if (!isPotentialIndentationElement(node)) {
		return false;
	}

	if (node.tagName != "BLOCKQUOTE" && node.tagName != "DIV") {
		return false;
	}

	for (var i = 0; i < node.attributes.length; i++) {
		if (!isHtmlNamespace(node.attributes[i].namespaceURI)
		|| ["style", "class", "dir"].indexOf(node.attributes[i].name) == -1) {
			return false;
		}
	}

	for (var i = 0; i < node.style.length; i++) {
		// This is approximate, but it works well enough for my purposes.
		if (!/^(-[a-z]+-)?(margin|border|padding)/.test(node.style[i])) {
			return false;
		}
	}

	return true;
}

// "A non-list single-line container is an HTML element with local name
// "address", "div", "h1", "h2", "h3", "h4", "h5", "h6", "p", or "pre"."
function isNonListSingleLineContainer(node) {
	return isHtmlElement(node, ["address", "div", "h1", "h2", "h3", "h4", "h5",
		"h6", "p", "pre"]);
}

// "A single-line container is either a non-list single-line container, or an
// HTML element with local name "li", "dt", or "dd"."
function isSingleLineContainer(node) {
	return isNonListSingleLineContainer(node)
		|| isHtmlElement(node, ["li", "dt", "dd"]);
}

// "The default single-line container name is "p"."
var defaultSingleLineContainerName = "p";

//@}

///// Assorted block formatting command algorithms /////
//@{

function fixDisallowedAncestors(node) {
	// "If node is not an allowed child of any of its ancestors in the same
	// editing host:"
	var hasAllowedAncestor = false;
	for (var ancestor = node.parentNode; inSameEditingHost(node, ancestor); ancestor = ancestor.parentNode) {
		if (isAllowedChild(node, ancestor)) {
			hasAllowedAncestor = true;
			break;
		}
	}
	if (!hasAllowedAncestor) {
		// "If node is not a prohibited paragraph child, abort these steps."
		if (!isProhibitedParagraphChild(node)) {
			return;
		}

		// "Set the tag name of node to the default single-line container name,
		// and let node be the result."
		node = setTagName(node, defaultSingleLineContainerName);

		// "Fix disallowed ancestors of node."
		fixDisallowedAncestors(node);

		// "Let descendants be all descendants of node."
		var descendants = getDescendants(node);

		// "Fix disallowed ancestors of each member of descendants."
		for (var i = 0; i < descendants.length; i++) {
			fixDisallowedAncestors(descendants[i]);
		}

		// "Abort these steps."
		return;
	}

	// "While node is not an allowed child of its parent, split the parent of
	// the one-node list consisting of node."
	while (!isAllowedChild(node, node.parentNode)) {
		splitParent([node]);
	}
}

function fixProhibitedParagraphDescendants(node) {
	// "If node has no children, return the one-node list consisting of node."
	if (!node.hasChildNodes()) {
		return [node];
	}

	// "Let children be the children of node."
	var children = [].slice.call(node.childNodes);

	// "Fix prohibited paragraph descendants of each member of children."
	for (var i = 0; i < children.length; i++) {
		fixProhibitedParagraphDescendants(children[i]);
	}

	// "Let children be the children of node."
	children = [].slice.call(node.childNodes);

	// "For each child in children, if child is a prohibited paragraph child,
	// split the parent of the one-node list consisting of child."
	for (var i = 0; i < children.length; i++) {
		if (isProhibitedParagraphChild(children[i])) {
			splitParent([children[i]]);
		}
	}

	// "If node's parent is null, let node equal the last member of children."
	if (!node.parentNode) {
		node = children[children.length - 1];
	}

	// "Let node list be a list of nodes, initially empty."
	var nodeList = [];

	// "Repeat these steps:"
	while (true) {
		// "Prepend node to node list."
		nodeList.unshift(node);

		// "If node is children's first member, or children's first member's
		// parent, break from this loop."
		if (node == children[0]
		|| node == children[0].parentNode) {
			break;
		}

		// "Set node to its previousSibling."
		node = node.previousSibling;
	}

	// "Return node list."
	return nodeList;
}

function indentNodes(nodeList) {
	// "If node list is empty, do nothing and abort these steps."
	if (!nodeList.length) {
		return;
	}

	// "Let first node be the first member of node list."
	var firstNode = nodeList[0];

	// "If first node's parent is an ol or ul:"
	if (isHtmlElement(firstNode.parentNode, ["OL", "UL"])) {
		// "Let tag be the local name of the parent of first node."
		var tag = firstNode.parentNode.tagName;

		// "Wrap node list, with sibling criteria matching only HTML elements
		// with local name tag and new parent instructions returning the result
		// of calling createElement(tag) on the ownerDocument of first node."
		wrap(nodeList,
			function(node) { return isHtmlElement(node, tag) },
			function() { return firstNode.ownerDocument.createElement(tag) });

		// "Abort these steps."
		return;
	}

	// "Wrap node list, with sibling criteria matching any indentation element,
	// and new parent instructions to return the result of calling
	// createElement("blockquote") on the ownerDocument of first node. Let new
	// parent be the result."
	var newParent = wrap(nodeList,
		function(node) { return isIndentationElement(node) },
		function() { return firstNode.ownerDocument.createElement("blockquote") });

	// "Fix disallowed ancestors of new parent."
	fixDisallowedAncestors(newParent);
}

function normalizeSublists(item) {
	// "If item is not an li or it is not editable or its parent is not
	// editable, abort these steps."
	if (!isHtmlElement(item, "LI")
	|| !isEditable(item)
	|| !isEditable(item.parentNode)) {
		return;
	}

	// "Let new item be null."
	var newItem = null;

	// "While item has an ol or ul child:"
	while ([].some.call(item.childNodes, function (node) { return isHtmlElement(node, ["OL", "UL"]) })) {
		// "Let child be the last child of item."
		var child = item.lastChild;

		// "If child is an ol or ul, or new item is null and child is a Text
		// node whose data consists of zero of more space characters:"
		if (isHtmlElement(child, ["OL", "UL"])
		|| (!newItem && child.nodeType == Node.TEXT_NODE && /^[ \t\n\f\r]*$/.test(child.data))) {
			// "Set new item to null."
			newItem = null;

			// "Insert child into the parent of item immediately following
			// item, preserving ranges."
			movePreservingRanges(child, item.parentNode, 1 + getNodeIndex(item));

		// "Otherwise:"
		} else {
			// "If new item is null, let new item be the result of calling
			// createElement("li") on the ownerDocument of item, then insert
			// new item into the parent of item immediately after item."
			if (!newItem) {
				newItem = item.ownerDocument.createElement("li");
				item.parentNode.insertBefore(newItem, item.nextSibling);
			}

			// "Insert child into new item as its first child, preserving
			// ranges."
			movePreservingRanges(child, newItem, 0);
		}
	}
}

function canonicalSpaceSequence(n, nonBreakingStart, nonBreakingEnd) {
	// "If n is zero, return the empty string."
	if (n == 0) {
		return "";
	}

	// "If n is one and both non-breaking start and non-breaking end are false,
	// return a single space (U+0020)."
	if (n == 1 && !nonBreakingStart && !nonBreakingEnd) {
		return " ";
	}

	// "If n is one, return a single non-breaking space (U+00A0)."
	if (n == 1) {
		return "\xa0";
	}

	// "Let buffer be the empty string."
	var buffer = "";

	// "If non-breaking start is true, let repeated pair be U+00A0 U+0020.
	// Otherwise, let it be U+0020 U+00A0."
	var repeatedPair;
	if (nonBreakingStart) {
		repeatedPair = "\xa0 ";
	} else {
		repeatedPair = " \xa0";
	}

	// "While n is greater than three, append repeated pair to buffer and
	// subtract two from n."
	while (n > 3) {
		buffer += repeatedPair;
		n -= 2;
	}

	// "If n is three, append a three-element string to buffer depending on
	// non-breaking start and non-breaking end:"
	if (n == 3) {
		buffer +=
			!nonBreakingStart && !nonBreakingEnd ? " \xa0 "
			: nonBreakingStart && !nonBreakingEnd ? "\xa0\xa0 "
			: !nonBreakingStart && nonBreakingEnd ? " \xa0\xa0"
			: nonBreakingStart && nonBreakingEnd ? "\xa0 \xa0"
			: "impossible";

	// "Otherwise, append a two-element string to buffer depending on
	// non-breaking start and non-breaking end:"
	} else {
		buffer +=
			!nonBreakingStart && !nonBreakingEnd ? "\xa0 "
			: nonBreakingStart && !nonBreakingEnd ? "\xa0 "
			: !nonBreakingStart && nonBreakingEnd ? " \xa0"
			: nonBreakingStart && nonBreakingEnd ? "\xa0\xa0"
			: "impossible";
	}

	// "Return buffer."
	return buffer;
}

function canonicalizeWhitespace(node, offset) {
	// "If node is not a Text node, or is not editable, or its parent's
	// computed value for "white-space" is "pre" or "pre-wrap", abort these
	// steps."
	if (node.nodeType != Node.TEXT_NODE
	|| !isEditable(node)
	|| ["pre", "pre-wrap"].indexOf(getComputedStyle(node.parentNode).whiteSpace) != -1) {
		return;
	}

	// "Let start offset equal offset."
	var startOffset = offset;

	// "While start offset is positive and the (start offset − 1)st element of
	// node's data is a space (0x0020) or non-breaking space (0x00A0), subtract
	// one from start offset."
	while (startOffset > 0
	&& /[ \xa0]/.test(node.data[startOffset - 1])) {
		startOffset--;
	}

	// "Let end offset equal start offset."
	var endOffset = startOffset;

	// "While end offset is less than node's length, and the end offsetth
	// element of node's data is 0x0020 or 0x00A0:"
	while (endOffset < node.length
	&& /[ \xa0]/.test(node.data[endOffset])) {
		// "Let length equal zero."
		var length = 0;

		// "While end offset plus length is less than node's length, and the
		// (end offset + length)th element of node's data is 0x0020, add one to
		// length."
		while (endOffset + length < node.length
		&& node.data[endOffset + length] == " ") {
			length++;
		}

		// "If length is greater than one, call deleteData(end offset + 1,
		// length − 1) on node."
		if (length > 1) {
			node.deleteData(endOffset + 1, length - 1);
		}

		// "Add one to end offset."
		endOffset++;
	}

	// "Let replacement whitespace be the canonical space sequence of length
	// end offset minus start offset. non-breaking start is true if start
	// offset is zero and false otherwise, and non-breaking end is true if end
	// offset is node's length and false otherwise."
	var replacementWhitespace = canonicalSpaceSequence(endOffset - startOffset,
		startOffset == 0,
		endOffset == node.length);

	// "While start offset is less than end offset:"
	while (startOffset < endOffset) {
		// "Remove the first element from replacement whitespace, and let
		// element be that element."
		var element = replacementWhitespace[0];
		replacementWhitespace = replacementWhitespace.slice(1);

		// "If element is not the same as the start offsetth element of node's
		// data:"
		if (element != node.data[startOffset]) {
			// "Call insertData(start offset, element) on node."
			node.insertData(startOffset, element);

			// "Call deleteData(start offset + 1, 1) on node."
			node.deleteData(startOffset + 1, 1);
		}

		// "Add one to start offset."
		startOffset++;
	}
}

//@}

///// Allowed children /////
//@{

function isAllowedChild(child, parent_) {
	// "If parent is "colgroup", "table", "tbody", "tfoot", "thead", "tr", or
	// an HTML element with local name equal to one of those, and child is a
	// Text node whose data does not consist solely of space characters, return
	// false."
	if ((["colgroup", "table", "tbody", "tfoot", "thead", "tr"].indexOf(parent_) != -1
	|| isHtmlElement(parent_, ["colgroup", "table", "tbody", "tfoot", "thead", "tr"]))
	&& typeof child == "object"
	&& child.nodeType == Node.TEXT_NODE
	&& !/^[ \t\n\f\r]*$/.test(child.data)) {
		return false;
	}

	// "If parent is "script", "style", "plaintext", or "xmp", or an HTML
	// element with local name equal to one of those, and child is not a Text
	// node, return false."
	if ((["script", "style", "plaintext", "xmp"].indexOf(parent_) != -1
	|| isHtmlElement(parent_, ["script", "style", "plaintext", "xmp"]))
	&& (typeof child != "object" || child.nodeType != Node.TEXT_NODE)) {
		return false;
	}

	// "If child is a Document, DocumentFragment, or DocumentType, return
	// false."
	if (typeof child == "object"
	&& (child.nodeType == Node.DOCUMENT_NODE
	|| child.nodeType == Node.DOCUMENT_FRAGMENT_NODE
	|| child.nodeType == Node.DOCUMENT_TYPE_NODE)) {
		return false;
	}

	// "If child is an HTML element, set child to the local name of child."
	if (isHtmlElement(child)) {
		child = child.tagName.toLowerCase();
	}

	// "If child is not a string, return true."
	if (typeof child != "string") {
		return true;
	}

	// "If parent is an HTML element:"
	if (isHtmlElement(parent_)) {
		// "If child is "a", and parent or some ancestor of parent is an a,
		// return false."
		//
		// "If child is a prohibited paragraph child name and parent or some
		// ancestor of parent is a p or element with inline contents, return
		// false."
		//
		// "If child is "h1", "h2", "h3", "h4", "h5", or "h6", and parent or
		// some ancestor of parent is an HTML element with local name "h1",
		// "h2", "h3", "h4", "h5", or "h6", return false."
		var ancestor = parent_;
		while (ancestor) {
			if (child == "a" && isHtmlElement(ancestor, "a")) {
				return false;
			}
			if (prohibitedParagraphChildNames.indexOf(child) != -1
			&& (isHtmlElement(ancestor, "p")
			|| isElementWithInlineContents(ancestor))) {
				return false;
			}
			if (/^h[1-6]$/.test(child)
			&& isHtmlElement(ancestor)
			&& /^H[1-6]$/.test(ancestor.tagName)) {
				return false;
			}
			ancestor = ancestor.parentNode;
		}

		// "Let parent be the local name of parent."
		parent_ = parent_.tagName.toLowerCase();
	}

	// "If parent is an Element or DocumentFragment, return true."
	if (typeof parent_ == "object"
	&& (parent_.nodeType == Node.ELEMENT_NODE
	|| parent_.nodeType == Node.DOCUMENT_FRAGMENT_NODE)) {
		return true;
	}

	// "If parent is not a string, return false."
	if (typeof parent_ != "string") {
		return false;
	}

	// "If parent is in the following table, then return true if child is
	// listed as an allowed child, and false otherwise."
	switch (parent_) {
		case "colgroup":
			return child == "col";
		case "table":
			return ["caption", "col", "colgroup", "tbody", "td", "tfoot", "th", "thead", "tr"].indexOf(child) != -1;
		case "tbody":
		case "thead":
		case "tfoot":
			return ["td", "th", "tr"].indexOf(child) != -1;
		case "tr":
			return ["td", "th"].indexOf(child) != -1;
		case "dl":
			return ["dt", "dd"].indexOf(child) != -1;
		case "dir":
		case "ol":
		case "ul":
			return ["dir", "li", "ol", "ul"].indexOf(child) != -1;
		case "hgroup":
			return /^h[1-6]$/.test(child);
	}

	// "If child is "body", "caption", "col", "colgroup", "frame", "frameset",
	// "head", "html", "tbody", "td", "tfoot", "th", "thead", or "tr", return
	// false."
	if (["body", "caption", "col", "colgroup", "frame", "frameset", "head",
	"html", "tbody", "td", "tfoot", "th", "thead", "tr"].indexOf(child) != -1) {
		return false;
	}

	// "If child is "dd" or "dt" and parent is not "dl", return false."
	if (["dd", "dt"].indexOf(child) != -1
	&& parent_ != "dl") {
		return false;
	}

	// "If child is "li" and parent is not "ol" or "ul", return false."
	if (child == "li"
	&& parent_ != "ol"
	&& parent_ != "ul") {
		return false;
	}

	// "If parent is in the following table and child is listed as a prohibited
	// child, return false."
	var table = [
		[["a"], ["a"]],
		[["dd", "dt"], ["dd", "dt"]],
		[["h1", "h2", "h3", "h4", "h5", "h6"], ["h1", "h2", "h3", "h4", "h5", "h6"]],
		[["li"], ["li"]],
		[["nobr"], ["nobr"]],
		[["p"].concat(namesOfElementsWithInlineContents), prohibitedParagraphChildNames],
		[["td", "th"], ["caption", "col", "colgroup", "tbody", "td", "tfoot", "th", "thead", "tr"]],
	];
	for (var i = 0; i < table.length; i++) {
		if (table[i][0].indexOf(parent_) != -1
		&& table[i][1].indexOf(child) != -1) {
			return false;
		}
	}

	// "Return true."
	return true;
}

//@}

///// Block-extending a range /////
//@{

function blockExtendRange(range) {
	// "Let start node, start offset, end node, and end offset be the start
	// and end nodes and offsets of the range."
	var startNode = range.startContainer;
	var startOffset = range.startOffset;
	var endNode = range.endContainer;
	var endOffset = range.endOffset;

	// "If some ancestor container of start node is an li, set start offset to
	// the index of the last such li in tree order, and set start node to that
	// li's parent."
	for (
		var ancestorContainer = startNode;
		ancestorContainer;
		ancestorContainer = ancestorContainer.parentNode
	) {
		if (isHtmlElement(ancestorContainer, "LI")) {
			startOffset = getNodeIndex(ancestorContainer);
			startNode = ancestorContainer.parentNode;
			break;
		}
	}

	// "Repeat the following steps:"
	while (true) {
		// "If start node is a Text or Comment node or start offset is 0,
		// set start offset to the index of start node and then set start
		// node to its parent."
		if (startNode.nodeType == Node.TEXT_NODE
		|| startNode.nodeType == Node.COMMENT_NODE
		|| startOffset == 0) {
			startOffset = getNodeIndex(startNode);
			startNode = startNode.parentNode;

		// "Otherwise, if start offset is start node's length and start node's
		// last child is an inline node that's not a br, subtract one from
		// start offset."
		} else if (startOffset == getNodeLength(startNode)
		&& isInlineNode(startNode.lastChild)
		&& !isHtmlElement(startNode.lastChild, "br")) {
			startOffset--;

		// "Otherwise, if start node has a child with index start offset, and
		// that child and its previousSibling are both inline nodes and the
		// previousSibling isn't a br, subtract one from start offset."
		} else if (startOffset < startNode.childNodes.length
		&& isInlineNode(startNode.childNodes[startOffset])
		&& isInlineNode(startNode.childNodes[startOffset].previousSibling)
		&& !isHtmlElement(startNode.childNodes[startOffset].previousSibling, "BR")) {
			startOffset--;

		// "Otherwise, break from this loop."
		} else {
			break;
		}
	}

	// "If some ancestor container of end node is an li, set end offset to one
	// plus the index of the last such li in tree order, and set end node to
	// that li's parent."
	for (
		var ancestorContainer = endNode;
		ancestorContainer;
		ancestorContainer = ancestorContainer.parentNode
	) {
		if (isHtmlElement(ancestorContainer, "LI")) {
			endOffset = 1 + getNodeIndex(ancestorContainer);
			endNode = ancestorContainer.parentNode;
			break;
		}
	}

	// "Repeat the following steps:"
	while (true) {
		// "If end node is a Text or Comment node or end offset is equal to the
		// length of end node, set end offset to one plus the index of end node
		// and then set end node to its parent."
		if (endNode.nodeType == Node.TEXT_NODE
		|| endNode.nodeType == Node.COMMENT_NODE
		|| endOffset == getNodeLength(endNode)) {
			endOffset = 1 + getNodeIndex(endNode);
			endNode = endNode.parentNode;

		// "Otherwise, if end offset is 0 and end node's first child is an
		// inline node that's not a br, add one to end offset."
		} else if (endOffset == 0
		&& isInlineNode(endNode.firstChild)
		&& !isHtmlElement(endNode.firstChild, "br")) {
			endOffset++;

		// "Otherwise, if end node has a child with index end offset, and that
		// child and its previousSibling are both inline nodes, and the
		// previousSibling isn't a br, add one to end offset."
		} else if (endOffset < endNode.childNodes.length
		&& isInlineNode(endNode.childNodes[endOffset])
		&& isInlineNode(endNode.childNodes[endOffset].previousSibling)
		&& !isHtmlElement(endNode.childNodes[endOffset], "BR")) {
			endOffset++;

		// "Otherwise, break from this loop."
		} else {
			break;
		}
	}

	// "If the child of end node with index end offset is a br, add one to end
	// offset."
	if (isHtmlElement(endNode.childNodes[endOffset], "BR")) {
		endOffset++;
	}

	// "While end offset is equal to the length of end node, set end offset to
	// one plus the index of end node and then set end node to its parent."
	while (endOffset == getNodeLength(endNode)) {
		endOffset = 1 + getNodeIndex(endNode);
		endNode = endNode.parentNode;
	}

	// "Let new range be a new range whose start and end nodes and offsets
	// are start node, start offset, end node, and end offset."
	var newRange = startNode.ownerDocument.createRange();
	newRange.setStart(startNode, startOffset);
	newRange.setEnd(endNode, endOffset);

	// "Return new range."
	return newRange;
}

//@}

///// Deleting the contents of a range /////
//@{

function deleteContents(node1, offset1, node2, offset2) {
	var range;

	// We allow passing four arguments instead of one, in which case they're
	// the start and end points of the range.
	if (typeof offset1 == "undefined") {
		range = node1;
	} else {
		range = document.createRange();
		range.setStart(node1, offset1);
		range.setEnd(node2, offset2);
	}

	// "If range is null, abort these steps and do nothing."
	if (!range) {
		return;
	}

	// "Let start node, start offset, end node, and end offset be range's start
	// and end nodes and offsets."
	var startNode = range.startContainer;
	var startOffset = range.startOffset;
	var endNode = range.endContainer;
	var endOffset = range.endOffset;

	// "While start node has at least one child:"
	while (startNode.hasChildNodes()) {
		// "If start offset is start node's length, and start node's parent is
		// in the same editing host, and start node is not a prohibited
		// paragraph child, set start offset to one plus the index of start
		// node, then set start node to its parent and continue this loop from
		// the beginning."
		if (startOffset == getNodeLength(startNode)
		&& inSameEditingHost(startNode, startNode.parentNode)
		&& !isProhibitedParagraphChild(startNode)) {
			startOffset = 1 + getNodeIndex(startNode);
			startNode = startNode.parentNode;
			continue;
		}

		// "If start offset is start node's length, break from this loop."
		if (startOffset == getNodeLength(startNode)) {
			break;
		}

		// "Let reference node be the child of start node with index equal to
		// start offset."
		var referenceNode = startNode.childNodes[startOffset];

		// "If reference node is a prohibited paragraph child or an Element
		// with no children, or is neither an Element nor a Text node, break
		// from this loop."
		if (isProhibitedParagraphChild(referenceNode)
		|| (referenceNode.nodeType == Node.ELEMENT_NODE
		&& !referenceNode.hasChildNodes())
		|| (referenceNode.nodeType != Node.ELEMENT_NODE
		&& referenceNode.nodeType != Node.TEXT_NODE)) {
			break;
		}

		// "Set start node to reference node and start offset to 0."
		startNode = referenceNode;
		startOffset = 0;
	}

	// "While end node has at least one child:"
	while (endNode.hasChildNodes()) {
		// "If end offset is 0, and end node's parent is in the same editing
		// host, and end node is not a prohibited paragraph child, set end
		// offset to the index of end node, then set end node to its parent and
		// continue this loop from the beginning."
		if (endOffset == 0
		&& inSameEditingHost(endNode, endNode.parentNode)
		&& !isProhibitedParagraphChild(endNode)) {
			endOffset = getNodeIndex(endNode);
			endNode = endNode.parentNode;
			continue;
		}

		// "If end offset is 0, break from this loop."
		if (endOffset == 0) {
			break;
		}

		// "Let reference node be the child of end node with index equal to end
		// offset minus one."
		var referenceNode = endNode.childNodes[endOffset - 1];

		// "If reference node is a prohibited paragraph child or an Element
		// with no children, or is neither an Element nor a Text node, break
		// from this loop."
		if (isProhibitedParagraphChild(referenceNode)
		|| (referenceNode.nodeType == Node.ELEMENT_NODE
		&& !referenceNode.hasChildNodes())
		|| (referenceNode.nodeType != Node.ELEMENT_NODE
		&& referenceNode.nodeType != Node.TEXT_NODE)) {
			break;
		}

		// "Set end node to reference node and end offset to the length of
		// reference node."
		endNode = referenceNode;
		endOffset = getNodeLength(referenceNode);
	}

	// "If (end node, end offset) is before (start node, start offset), set
	// range's end to its start and abort these steps."
	var startPoint = document.createRange();
	startPoint.setStart(startNode, startOffset);
	var endPoint = document.createRange();
	endPoint.setStart(endNode, endOffset);
	if (startPoint.compareBoundaryPoints(Range.START_TO_START, endPoint) == 1) {
		range.setEnd(range.startContainer, range.startOffset);
		return;
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

	// "Let start block be the start node of range."
	var startBlock = range.startContainer;

	// "While start block's parent is in the same editing host and start block
	// is not a prohibited paragraph child, set start block to its parent."
	while (inSameEditingHost(startBlock, startBlock.parentNode)
	&& !isProhibitedParagraphChild(startBlock)) {
		startBlock = startBlock.parentNode;
	}

	// "If start block is neither a prohibited paragraph child nor an editing
	// host, or "span" is not an allowed child of start block, or start block
	// is a td or th, set start block to null."
	if ((!isProhibitedParagraphChild(startBlock) && !isEditingHost(startBlock))
	|| !isAllowedChild("span", startBlock)
	|| isHtmlElement(startBlock, ["td", "th"])) {
		startBlock = null;
	}

	// "Let end block be the end node of range."
	var endBlock = range.endContainer;

	// "While end block's parent is in the same editing host and end block is
	// not a prohibited paragraph child, set end block to its parent."
	while (inSameEditingHost(endBlock, endBlock.parentNode)
	&& !isProhibitedParagraphChild(endBlock)) {
		endBlock = endBlock.parentNode;
	}

	// "If end block is neither a prohibited paragraph child nor an editing
	// host, or "span" is not an allowed child of end block, or end block is a
	// td or th, set end block to null."
	if ((!isProhibitedParagraphChild(endBlock) && !isEditingHost(endBlock))
	|| !isAllowedChild("span", endBlock)
	|| isHtmlElement(endBlock, ["td", "th"])) {
		endBlock = null;
	}

	// "If start node and end node are the same, and start node is an editable
	// Text node:"
	if (startNode == endNode
	&& isEditable(startNode)
	&& startNode.nodeType == Node.TEXT_NODE) {
		// "Call deleteData(start offset, end offset − start offset) on start
		// node."
		startNode.deleteData(startOffset, endOffset - startOffset);

		// "Canonicalize whitespace at (start node, start offset)."
		canonicalizeWhitespace(startNode, startOffset);

	// "Otherwise:"
	} else {
		// "If start node is an editable Text node, call deleteData() on it,
		// with start offset as the first argument and (length of start node −
		// start offset) as the second argument."
		if (isEditable(startNode)
		&& startNode.nodeType == Node.TEXT_NODE) {
			startNode.deleteData(startOffset, getNodeLength(startNode) - startOffset);
		}

		// "Let node list be a list of nodes, initially empty."
		//
		// "For each node contained in range, append node to node list if the
		// last member of node list (if any) is not an ancestor of node; node
		// is editable; and node is not a thead, tbody, tfoot, tr, th, or td."
		var nodeList = collectContainedNodes(range,
			function(node) {
				return isEditable(node)
					&& !isHtmlElement(node, ["thead", "tbody", "tfoot", "tr", "th", "td"]);
			}
		);

		// "For each node in node list:"
		for (var i = 0; i < nodeList.length; i++) {
			var node = nodeList[i];

			// "Let parent be the parent of node."
			var parent_ = node.parentNode;

			// "Remove node from parent."
			parent_.removeChild(node);

			// "While parent is an editable inline node with length 0, let
			// grandparent be the parent of parent, then remove parent from
			// grandparent, then set parent to grandparent."
			while (isEditable(parent_)
			&& isInlineNode(parent_)
			&& getNodeLength(parent_) == 0) {
				var grandparent = parent_.parentNode;
				grandparent.removeChild(parent_);
				parent_ = grandparent;
			}

			// "If parent is editable or an editing host, is not an inline
			// node, and has no children, call createElement("br") on the
			// context object and append the result as the last child of
			// parent."
			if ((isEditable(parent_) || isEditingHost(parent_))
			&& !isInlineNode(parent_)
			&& !parent_.hasChildNodes()) {
				parent_.appendChild(document.createElement("br"));
			}
		}

		// "If end node is an editable Text node, call deleteData(0, end
		// offset) on it."
		if (isEditable(endNode)
		&& endNode.nodeType == Node.TEXT_NODE) {
			endNode.deleteData(0, endOffset);
		}
	}

	// "If start block or end block is null, or start block is not in the same
	// editing host as end block, or start block and end block are the same,
	// set range's end to its start and then abort these steps."
	if (!startBlock
	|| !endBlock
	|| !inSameEditingHost(startBlock, endBlock)
	|| startBlock == endBlock) {
		range.setEnd(range.startContainer, range.startOffset);
		return;
	}

	// "If start block has one child, which is a collapsed block prop, remove
	// its child from it."
	if (startBlock.children.length == 1
	&& isCollapsedBlockProp(startBlock.firstChild)) {
		startBlock.removeChild(startBlock.firstChild);
	}

	// "If end block has one child, which is a collapsed block prop, remove its
	// child from it."
	if (endBlock.children.length == 1
	&& isCollapsedBlockProp(endBlock.firstChild)) {
		endBlock.removeChild(endBlock.firstChild);
	}

	// "If start block is an ancestor of end block:"
	if (isAncestor(startBlock, endBlock)) {
		// "Let reference node be end block."
		var referenceNode = endBlock;

		// "While reference node is not a child of start block, set reference
		// node to its parent."
		while (referenceNode.parentNode != startBlock) {
			referenceNode = referenceNode.parentNode;
		}

		// "Set the start and end of range to (start block, index of reference
		// node)."
		range.setStart(startBlock, getNodeIndex(referenceNode));
		range.setEnd(startBlock, getNodeIndex(referenceNode));

		// "If end block has no children:"
		if (!endBlock.hasChildNodes()) {
			// "While end block is editable and is the only child of its parent
			// and is not a child of start block, let parent equal end block,
			// then remove end block from parent, then set end block to
			// parent."
			while (isEditable(endBlock)
			&& endBlock.parentNode.childNodes.length == 1
			&& endBlock.parentNode != startBlock) {
				var parent_ = endBlock;
				parent_.removeChild(endBlock);
				endBlock = parent_;
			}

			// "If end block is editable and is not an inline node, and its
			// previousSibling and nextSibling are both inline nodes, call
			// createElement("br") on the context object and insert it into end
			// block's parent immediately after end block."
			if (isEditable(endBlock)
			&& !isInlineNode(endBlock)
			&& isInlineNode(endBlock.previousSibling)
			&& isInlineNode(endBlock.nextSibling)) {
				endBlock.parentNode.insertBefore(document.createElement("br"), endBlock.nextSibling);
			}

			// "If end block is editable, remove it from its parent."
			if (isEditable(endBlock)) {
				endBlock.parentNode.removeChild(endBlock);
			}

			// "Abort these steps."
			return;
		}

		// "If end block's firstChild is not an inline node, abort these
		// steps."
		if (!isInlineNode(endBlock.firstChild)) {
			return;
		}

		// "Let children be an array of nodes, initially empty."
		var children = [];

		// "Append the first child of end block to children."
		children.push(endBlock.firstChild);

		// "While children's last member is not a br, and children's last
		// member's nextSibling is an inline node, append children's last
		// member's nextSibling to children."
		while (!isHtmlElement(children[children.length - 1], "br")
		&& isInlineNode(children[children.length - 1].nextSibling)) {
			children.push(children[children.length - 1].nextSibling);
		}

		// "While children's first member's parent is not start block, split
		// the parent of children."
		while (children[0].parentNode != startBlock) {
			splitParent(children);
		}

		// "If children's first member's previousSibling is an editable br,
		// remove that br from its parent."
		if (isEditable(children[0].previousSibling)
		&& isHtmlElement(children[0].previousSibling, "br")) {
			children[0].parentNode.removeChild(children[0].previousSibling);
		}

	// "Otherwise, if start block is a descendant of end block:"
	} else if (isDescendant(startBlock, endBlock)) {
		// "Set the start and end of range to (start block, length of start
		// block)."
		range.setStart(startBlock, getNodeLength(startBlock));
		range.setEnd(startBlock, getNodeLength(startBlock));

		// "Let reference node be start block."
		var referenceNode = startBlock;

		// "While reference node is not a child of end block, set reference
		// node to its parent."
		while (referenceNode.parentNode != endBlock) {
			referenceNode = referenceNode.parentNode;
		}

		// "If reference node's nextSibling is an inline node and start block's
		// lastChild is a br, remove start block's lastChild from it."
		if (isInlineNode(referenceNode.nextSibling)
		&& isHtmlElement(startBlock.lastChild, "br")) {
			startBlock.removeChild(startBlock.lastChild);
		}

		// "While the nextSibling of reference node is neither null nor a br
		// nor a prohibited paragraph child, append the nextSibling of
		// reference node as the last child of start block, preserving ranges."
		while (referenceNode.nextSibling
		&& !isHtmlElement(referenceNode.nextSibling, "br")
		&& !isProhibitedParagraphChild(referenceNode.nextSibling)) {
			movePreservingRanges(referenceNode.nextSibling, startBlock, -1);
		}

		// "If the nextSibling of reference node is a br, remove it from its
		// parent."
		if (isHtmlElement(referenceNode.nextSibling, "br")) {
			referenceNode.parentNode.removeChild(referenceNode.nextSibling);
		}

	// "Otherwise:"
	} else {
		// "Set the start and end of range to (start block, length of start
		// block)."
		range.setStart(startBlock, getNodeLength(startBlock));
		range.setEnd(startBlock, getNodeLength(startBlock));

		// "If end block's firstChild is an inline node and start block's
		// lastChild is a br, remove start block's lastChild from it."
		if (isInlineNode(endBlock.firstChild)
		&& isHtmlElement(startBlock.lastChild, "br")) {
			startBlock.removeChild(startBlock.lastChild);
		}

		// "While end block has children, append the first child of end block
		// to start block, preserving ranges."
		while (endBlock.hasChildNodes()) {
			movePreservingRanges(endBlock.firstChild, startBlock, -1);
		}

		// "While end block has no children, let parent be the parent of end
		// block, then remove end block from parent, then set end block to
		// parent."
		while (!endBlock.hasChildNodes()) {
			var parent_ = endBlock.parentNode;
			parent_.removeChild(endBlock);
			endBlock = parent_;
		}
	}

	// "If start block has no children, call createElement("br") on the context
	// object and append the result as the last child of start block."
	if (!startBlock.hasChildNodes()) {
		startBlock.appendChild(document.createElement("br"));
	}
}

//@}

///// Outdenting a node /////
//@{

function outdentNode(node) {
	// "If node is not editable, abort these steps."
	if (!isEditable(node)) {
		return;
	}

	// "If node is an indentation element, remove node, preserving its
	// descendants.  Then abort these steps."
	if (isIndentationElement(node)) {
		removePreservingDescendants(node);
		return;
	}

	// "If node is a potential indentation element:"
	if (isPotentialIndentationElement(node)) {
		// "Unset the class and dir attributes of node, if any."
		node.removeAttribute("class");
		node.removeAttribute("dir");

		// "Unset the margin, padding, and border CSS properties of node."
		node.style.margin = "";
		node.style.padding = "";
		node.style.border = "";
		if (node.getAttribute("style") == "") {
			node.removeAttribute("style");
		}

		// "Set the tag name of node to "div"."
		setTagName(node, "div");

		// "Abort these steps."
		return;
	}

	// "Let current ancestor be node's parent."
	var currentAncestor = node.parentNode;

	// "Let ancestor list be a list of nodes, initially empty."
	var ancestorList = [];

	// "While current ancestor is an editable Element that is not an
	// indentation element, append current ancestor to ancestor list and then
	// set current ancestor to its parent."
	while (isEditable(currentAncestor)
	&& currentAncestor.nodeType == Node.ELEMENT_NODE
	&& !isIndentationElement(currentAncestor)) {
		ancestorList.push(currentAncestor);
		currentAncestor = currentAncestor.parentNode;
	}

	// "If current ancestor is not an editable indentation element:"
	if (!isEditable(currentAncestor)
	|| !isIndentationElement(currentAncestor)) {
		// "Let current ancestor be node's parent."
		currentAncestor = node.parentNode;

		// "Let ancestor list be the empty list."
		ancestorList = [];

		// "While current ancestor is an editable Element that is not a
		// potential indentation element, append current ancestor to ancestor
		// list and then set current ancestor to its parent."
		while (isEditable(currentAncestor)
		&& currentAncestor.nodeType == Node.ELEMENT_NODE
		&& !isPotentialIndentationElement(currentAncestor)) {
			ancestorList.push(currentAncestor);
			currentAncestor = currentAncestor.parentNode;
		}
	}

	// "If node is an ol or ul, and either current ancestor is not an editable
	// potential indentation element or node's parent is an ol or ul:"
	if (isHtmlElement(node, ["OL", "UL"])
	&& (!isEditable(currentAncestor)
	|| !isPotentialIndentationElement(currentAncestor)
	|| isHtmlElement(node.parentNode, ["OL", "UL"]))) {
		// "Unset the reversed, start, and type attributes of node, if any are
		// set."
		node.removeAttribute("reversed");
		node.removeAttribute("start");
		node.removeAttribute("type");

		// "Let children be the children of node."
		var children = [].slice.call(node.childNodes);

		// "If node has attributes, and its parent or not an ol or ul, set the
		// tag name of node to "div"."
		if (node.attributes.length
		&& !isHtmlElement(node.parentNode, ["OL", "UL"])) {
			setTagName(node, "div");

		// "Otherwise remove node, preserving its descendants."
		} else {
			removePreservingDescendants(node);
		}

		// "Fix disallowed ancestors of each member of children."
		for (var i = 0; i < children.length; i++) {
			fixDisallowedAncestors(children[i]);
		}

		// "Abort these steps."
		return;
	}

	// "If current ancestor is not an editable potential indentation element,
	// abort these steps."
	if (!isEditable(currentAncestor)
	|| !isPotentialIndentationElement(currentAncestor)) {
		return;
	}

	// "Append current ancestor to ancestor list."
	ancestorList.push(currentAncestor);

	// "Let original ancestor be current ancestor."
	var originalAncestor = currentAncestor;

	// "While ancestor list is not empty:"
	while (ancestorList.length) {
		// "Let current ancestor be the last member of ancestor list."
		//
		// "Remove the last member of ancestor list."
		currentAncestor = ancestorList.pop();

		// "Let target be the child of current ancestor that is equal to either
		// node or the last member of ancestor list."
		var target = node.parentNode == currentAncestor
			? node
			: ancestorList[ancestorList.length - 1];

		// "If target is an inline node that is not a br, and its nextSibling
		// is a br, remove target's nextSibling from its parent."
		if (isInlineNode(target)
		&& !isHtmlElement(target, "BR")
		&& isHtmlElement(target.nextSibling, "BR")) {
			target.parentNode.removeChild(target.nextSibling);
		}

		// "Let preceding siblings be the preceding siblings of target, and let
		// following siblings be the following siblings of target."
		var precedingSiblings = [].slice.call(currentAncestor.childNodes, 0, getNodeIndex(target));
		var followingSiblings = [].slice.call(currentAncestor.childNodes, 1 + getNodeIndex(target));

		// "Indent preceding siblings."
		indentNodes(precedingSiblings);

		// "Indent following siblings."
		indentNodes(followingSiblings);
	}

	// "Outdent original ancestor."
	outdentNode(originalAncestor);
}

//@}

///// Toggling lists /////
//@{

function toggleLists(tagName) {
	var range = getActiveRange();
	tagName = tagName.toUpperCase();

	// "Let other tag name be "ol" if tag name is "ul", and "ul" if tag name is
	// "ol"."
	var otherTagName = tagName == "OL" ? "UL" : "OL";

	// "Let items be a list of all lis that are ancestor containers of the
	// range's start and/or end node."
	//
	// Has to be in tree order, remember!
	var items = [];
	for (var node = range.endContainer; node != range.commonAncestorContainer; node = node.parentNode) {
		if (isHtmlElement(node, "LI")) {
			items.unshift(node);
		}
	}
	for (var node = range.startContainer; node != range.commonAncestorContainer; node = node.parentNode) {
		if (isHtmlElement(node, "LI")) {
			items.unshift(node);
		}
	}
	for (var node = range.commonAncestorContainer; node; node = node.parentNode) {
		if (isHtmlElement(node, "LI")) {
			items.unshift(node);
		}
	}

	// "For each item in items, normalize sublists of item."
	for (var i = 0; i < items.length; i++) {
		normalizeSublists(items[i]);
	}

	// "Block-extend the range, and let new range be the result."
	var newRange = blockExtendRange(range);

	// "Let node list be a list of nodes, initially empty."
	var nodeList = [];

	// "For each node node contained in new range, if node is editable; the
	// last member of node list (if any) is not an ancestor of node; node
	// is not a potential indentation element; and either node is an ol or
	// ul, or its parent is an ol or ul, or it is an allowed child of "li";
	// then append node to node list."
	for (
		var node = newRange.startContainer;
		node != nextNodeDescendants(newRange.endContainer);
		node = nextNode(node)
	) {
		if (isEditable(node)
		&& isContained(node, newRange)
		&& (!nodeList.length || !isAncestor(nodeList[nodeList.length - 1], node))
		&& !isPotentialIndentationElement(node)
		&& (isHtmlElement(node, ["OL", "UL"])
		|| isHtmlElement(node.parentNode, ["OL", "UL"])
		|| isAllowedChild(node, "li"))) {
			nodeList.push(node);
		}
	}

	// "If every member of node list is equal to or the child of an HTML
	// element with local name tag name, and no member of node list is equal to
	// or the ancestor of an HTML element with local name other tag name, then
	// while node list is not empty:"
	if (nodeList.every(function(node) { return isHtmlElement(node, tagName) || isHtmlElement(node.parentNode, tagName) })
	&& !nodeList.some(function(node) { return isHtmlElement(node, otherTagName) || node.querySelector(otherTagName) })) {
		while (nodeList.length) {
			// "Let sublist be an empty list of nodes."
			var sublist = [];

			// "Remove the first member from node list and append it to
			// sublist."
			sublist.push(nodeList.shift());

			// "If the first member of sublist is an HTML element with local
			// name tag name, outdent it and continue this loop from the
			// beginning."
			if (isHtmlElement(sublist[0], tagName)) {
				outdentNode(sublist[0]);
				continue;
			}

			// "While node list is not empty, and the first member of node list
			// is the nextSibling of the last member of sublist and is not an
			// HTML element with local name tag name, remove the first member
			// from node list and append it to sublist."
			while (nodeList.length
			&& nodeList[0] == sublist[sublist.length - 1].nextSibling
			&& !isHtmlElement(nodeList[0], tagName)) {
				sublist.push(nodeList.shift());
			}

			// "Split the parent of sublist."
			splitParent(sublist);

			// "Fix disallowed ancestors of each member of sublist."
			for (var i = 0; i < sublist.length; i++) {
				fixDisallowedAncestors(sublist[i]);
			}
		}

	// "Otherwise, while node list is not empty:"
	} else {
		while (nodeList.length) {
			// "Let sublist be an empty list of nodes."
			var sublist = [];

			// "Remove the first member from node list and append it to
			// sublist."
			sublist.push(nodeList.shift());

			// "While node list is not empty, and the first member of node
			// list is the nextSibling of the last member of sublist, and
			// the last member of sublist and first member of node list are
			// both inline nodes, and the last member of sublist is not a
			// br, remove the first member from node list and append it to
			// sublist."
			while (nodeList.length
			&& nodeList[0] == sublist[sublist.length - 1].nextSibling
			&& isInlineNode(sublist[sublist.length - 1])
			&& isInlineNode(nodeList[0])
			&& !isHtmlElement(sublist[sublist.length - 1], "BR")) {
				sublist.push(nodeList.shift());
			}

			// "If sublist contains more than one member, wrap sublist, with
			// sibling criteria matching nothing and new parent instructions
			// returning the result of calling createElement("li") on the
			// context object. Let node be the result."
			var node;
			if (sublist.length > 1) {
				node = wrap(sublist,
					function() { return false },
					function() { return document.createElement("li") });

			// "Otherwise, let node be the sole member of sublist."
			} else {
				node = sublist[0];
			}

			// "If node is an HTML element with local name other tag name:"
			if (isHtmlElement(node, otherTagName)) {
				// "Let children be the children of node."
				var children = [].slice.call(node.childNodes);

				// "Remove node, preserving its descendants."
				removePreservingDescendants(node);

				// "Wrap children, with sibling criteria matching any HTML
				// element with local name tag name and new parent instructions
				// returning the result of calling createElement(tag name) on
				// the context object. Let node be the result."
				node = wrap(children,
					function(node) { return isHtmlElement(node, tagName) },
					function() { return document.createElement(tagName) });

				// "Prepend the descendants of node that are HTML elements with
				// local name other tag name (if any) to node list."
				nodeList = [].slice.call(node.querySelectorAll(otherTagName)).concat(nodeList);

				// "Continue from the beginning of this loop."
				continue;
			}

			// "If node is a p or div, set the tag name of node to "li",
			// and let node be the result."
			if (isHtmlElement(node, ["P", "DIV"])) {
				node = setTagName(node, "li");
			}

			// "If node is the child of an HTML element with local name other
			// tag name:"
			if (isHtmlElement(node.parentNode, otherTagName)) {
				// "Split the parent of the one-node list consisting of
				// node."
				splitParent([node]);

				// "Wrap the one-node list consisting of node, with sibling
				// criteria matching any HTML element with local name tag name,
				// and with new parent instructions returning the result of
				// calling createElement(tag name) on the context object."
				wrap([node],
					function(node) { return isHtmlElement(node, tagName) },
					function() { return document.createElement(tagName) });

				// "Prepend the descendants of node that are HTML elements with
				// local name other tag name (if any) to node list."
				nodeList = [].slice.call(node.querySelectorAll(otherTagName)).concat(nodeList);

				// "Continue from the beginning of this loop."
				continue;
			}

			// "If node is equal to or the child of an HTML element with local
			// name tag name, prepend the descendants of node that are HTML
			// elements with local name other tag name (if any) to node list
			// and continue from the beginning of this loop."
			if (isHtmlElement(node, tagName)
			|| isHtmlElement(node.parentNode, tagName)) {
				nodeList = [].slice.call(node.querySelectorAll(otherTagName)).concat(nodeList);
				continue;
			}

			// "If node is not an li, wrap the one-node list consisting of
			// node, with sibling criteria matching nothing and new parent
			// instructions returning the result of calling createElement("li")
			// on the context object. Set node to the result."
			if (!isHtmlElement(node, "LI")) {
				node = wrap([node],
					function() { return false },
					function() { return document.createElement("li") });
			}

			// "Wrap the one-node list consisting of node, with the sibling
			// criteria matching any HTML element with local name tag name, and
			// the new parent instructions being the following:"
			var newParent = wrap([node],
				function(node) { return isHtmlElement(node, tagName) },
				function() {
					// "If the parent of node is not an editable indentation
					// element, or the previousSibling of the parent of node is
					// not an editable HTML element with local name tag name,
					// call createElement(tag name) on the context object and
					// return the result. Otherwise:"
					if (!isEditable(node.parentNode)
					|| !isIndentationElement(node.parentNode)
					|| !isEditable(node.parentNode.previousSibling)
					|| !isHtmlElement(node.parentNode.previousSibling, tagName)) {
						return document.createElement(tagName);
					}

					// "Let list be the previousSibling of the parent of node."
					var list = node.parentNode.previousSibling;

					// "Normalize sublists of list's last child."
					normalizeSublists(list.lastChild);

					// "If list's last child is not an editable HTML element
					// with local name tag name, call createElement(tag name)
					// on the context object, and append the result as the last
					// child of list."
					if (!isEditable(list.lastChild)
					|| !isHtmlElement(list.lastChild, tagName)) {
						list.appendChild(document.createElement(tagName));
					}

					// "Return the last child of list."
					return list.lastChild;
				});

			// "Fix disallowed ancestors of the previous step's result."
			fixDisallowedAncestors(newParent);
		}
	}
}

//@}

///// Justifying the selection /////
//@{

function justifySelection(alignment) {
	// "Block-extend the active range, and let new range be the result."
	var newRange = blockExtendRange(globalRange);

	// "Let element list be a list of all editable Elements contained in new
	// range that either has an attribute in the HTML namespace whose local
	// name is "align", or has a style attribute that sets "text-align", or is
	// a center."
	var elementList = collectAllContainedNodes(newRange, function(node) {
		return node.nodeType == Node.ELEMENT_NODE
			&& isEditable(node)
			// Ignoring namespaces here
			&& (
				node.hasAttribute("align")
				|| node.style.textAlign != ""
				|| isHtmlElement(node, "center")
			);
	});

	// "For each element in element list:"
	for (var i = 0; i < elementList.length; i++) {
		var element = elementList[i];

		// "If element has an attribute in the HTML namespace whose local name
		// is "align", remove that attribute."
		element.removeAttribute("align");

		// "Unset the CSS property "text-align" on element, if it's set by a
		// style attribute."
		element.style.textAlign = "";
		if (element.getAttribute("style") == "") {
			element.removeAttribute("style");
		}

		// "If element is a div or center with no attributes, remove it,
		// preserving its descendants."
		if (isHtmlElement(element, ["div", "center"])
		&& !element.attributes.length) {
			removePreservingDescendants(element);
		}

		// "If element is a center with one or more attributes, set the tag
		// name of element to "div"."
		if (isHtmlElement(element, "center")
		&& element.attributes.length) {
			setTagName(element, "div");
		}
	}

	// "Block-extend the active range, and let new range be the result."
	newRange = blockExtendRange(globalRange);

	// "Let node list be a list of nodes, initially empty."
	var nodeList = [];

	// "For each node node contained in new range, append node to node list if
	// the last member of node list (if any) is not an ancestor of node; node
	// is editable; and either node is an Element and the CSS property
	// "text-align" does not compute to alignment on it, or it is not an
	// Element, but its parent is an Element, and the CSS property "text-align"
	// does not compute to alignment on its parent."
	nodeList = collectContainedNodes(newRange, function(node) {
		if (!isEditable(node)) {
			return false;
		}
		// Gecko and WebKit have lots of fun here confusing us with
		// vendor-specific values, and in Gecko's case "start".
		var element = node.nodeType == Node.ELEMENT_NODE
			? node
			: node.parentNode;
		if (!element || element.nodeType != Node.ELEMENT_NODE) {
			return false;
		}
		var computedAlign = getComputedStyle(element).textAlign
			.replace(/^-(moz|webkit)-/, "");
		if (computedAlign == "auto" || computedAlign == "start") {
			// Depends on directionality.  Note: this is a serious hack.
			do {
				var dir = element.dir.toLowerCase();
				element = element.parentNode;
			} while (element && element.nodeType == Node.ELEMENT_NODE && dir != "ltr" && dir != "rtl");
			if (dir == "rtl") {
				computedAlign = "right";
			} else {
				computedAlign = "left";
			}
		}
		return computedAlign != alignment;
	});

	// "While node list is not empty:"
	while (nodeList.length) {
		// "Let sublist be a list of nodes, initially empty."
		var sublist = [];

		// "Remove the first member of node list and append it to sublist."
		sublist.push(nodeList.shift());

		// "While node list is not empty, and the first member of node list is
		// the nextSibling of the last member of sublist, remove the first
		// member of node list and append it to sublist."
		while (nodeList.length
		&& nodeList[0] == sublist[sublist.length - 1].nextSibling) {
			sublist.push(nodeList.shift());
		}

		// "Wrap sublist. Sibling criteria match any div that has one or both
		// of the following two attributes, and no other attributes:
		//
		//   * "An align attribute whose value is an ASCII case-insensitive
		//     match for alignment.
		//   * "A style attribute which sets exactly one CSS property
		//     (including unrecognized or invalid attributes), which is
		//     "text-align", which is set to alignment.
		//
		// "New parent instructions are to call createElement("div") on the
		// context object, then set its CSS property "text-align" to alignment,
		// and return the result."
		wrap(sublist,
			function(node) {
				return isHtmlElement(node, "div")
					&& [].every.call(node.attributes, function(attr) {
						return (attr.name == "align" && attr.value.toLowerCase() == alignment)
							|| (attr.name == "style" && node.style.length == 1 && node.style.textAlign == alignment);
					});
			},
			function() {
				var newParent = document.createElement("div");
				newParent.setAttribute("style", "text-align: " + alignment);
				return newParent;
			}
		);
	}
}

//@}

///// The delete command /////
//@{
commands["delete"] = {
	action: function() {
		// "If the active range is not collapsed, delete the contents of the
		// active range and abort these steps."
		if (!getActiveRange().collapsed) {
			deleteContents(getActiveRange());
			return;
		}

		// "Canonicalize whitespace at (active range's start node, active
		// range's start offset)."
		canonicalizeWhitespace(getActiveRange().startContainer, getActiveRange().startOffset);

		// "Let node and offset be the active range's start node and offset."
		var node = getActiveRange().startContainer;
		var offset = getActiveRange().startOffset;

		// "Repeat the following steps:"
		while (true) {
			// "If offset is zero and node's previousSibling is an editable
			// invisible node, remove node's previousSibling from its parent."
			if (offset == 0
			&& isEditable(node.previousSibling)
			&& isInvisibleNode(node.previousSibling)) {
				node.parentNode.removeChild(node.previousSibling);

			// "Otherwise, if node has a child with index offset − 1 and that
			// child is an editable invisible node, remove that child from
			// node, then subtract one from offset."
			} else if (0 <= offset - 1
			&& offset - 1 < node.childNodes.length
			&& isEditable(node.childNodes[offset - 1])
			&& isInvisibleNode(node.childNodes[offset - 1])) {
				node.removeChild(node.childNodes[offset - 1]);
				offset--;

			// "Otherwise, if offset is zero and node is not a prohibited
			// paragraph child, or if node is an invisible node, set offset to
			// the index of node, then set node to its parent."
			} else if ((offset == 0
			&& !isProhibitedParagraphChild(node))
			|| isInvisibleNode(node)) {
				offset = getNodeIndex(node);
				node = node.parentNode;

			// "Otherwise, if node has a child with index offset − 1 and that
			// child is not a prohibited paragraph child or a br or an img, set
			// node to that child, then set offset to the length of node."
			} else if (0 <= offset - 1
			&& offset - 1 < node.childNodes.length
			&& !isProhibitedParagraphChild(node.childNodes[offset - 1])
			&& !isHtmlElement(node.childNodes[offset - 1], ["br", "img"])) {
				node = node.childNodes[offset - 1];
				offset = getNodeLength(node);

			// "Otherwise, break from this loop."
			} else {
				break;
			}
		}

		// "If node is a Text node and offset is not zero, call collapse(node,
		// offset) on the Selection. Then delete the contents of the range with
		// start (node, offset − 1) and end (node, offset) and abort these
		// steps."
		if (node.nodeType == Node.TEXT_NODE
		&& offset != 0) {
			getActiveRange().setStart(node, offset);
			getActiveRange().setEnd(node, offset);
			deleteContents(node, offset - 1, node, offset);
			return;
		}

		// "If node is not a prohibited paragraph child, abort these steps."
		if (!isProhibitedParagraphChild(node)) {
			return;
		}

		// "If node has a child with index offset − 1 and that child is a br or
		// hr or img, call collapse(node, offset) on the Selection. Then delete
		// the contents of the range with start (node, offset − 1) and end
		// (node, offset) and abort these steps."
		if (0 <= offset - 1
		&& offset - 1 < node.childNodes.length
		&& isHtmlElement(node.childNodes[offset - 1], ["br", "hr", "img"])) {
			getActiveRange().setStart(node, offset);
			getActiveRange().setEnd(node, offset);
			deleteContents(node, offset - 1, node, offset);
			return;
		}

		// "If node is an li or dt or dd and is the first child of its parent:"
		if (isHtmlElement(node, ["li", "dt", "dd"])
		&& node == node.parentNode.firstChild) {
			// "Let items be a list of all lis that are ancestors of node."
			//
			// Remember, must be in tree order.
			var items = [];
			for (var ancestor = node.parentNode; ancestor; ancestor = ancestor.parentNode) {
				if (isHtmlElement(ancestor, "li")) {
					items.unshift(ancestor);
				}
			}

			// "Normalize sublists of each item in items."
			for (var i = 0; i < items.length; i++) {
				normalizeSublists(items[i]);
			}

			// "Split the parent of the one-node list consisting of node."
			splitParent([node]);

			// "Fix disallowed ancestors of node."
			fixDisallowedAncestors(node);

			// "Abort these steps."
			return;
		}

		// "Let start node equal node and let start offset equal offset."
		var startNode = node;
		var startOffset = offset;

		// "While start offset is zero, set start offset to the index of start
		// node and then set start node to its parent."
		while (startOffset == 0) {
			startOffset = getNodeIndex(startNode);
			startNode = startNode.parentNode;
		}

		// "If offset is zero, and node has an ancestor container that is both
		// a potential indentation element and a descendant of start node:"
		var outdentableAncestor = false;
		for (
			var ancestor = node;
			isDescendant(ancestor, startNode);
			ancestor = ancestor.parentNode
		) {
			if (isPotentialIndentationElement(ancestor)) {
				outdentableAncestor = true;
				break;
			}
		}
		if (offset == 0
		&& outdentableAncestor) {
			// "Block-extend the range whose start and end are both (node, 0),
			// and let new range be the result."
			var newRange = document.createRange();
			newRange.setStart(node, 0);
			newRange = blockExtendRange(newRange);

			// "Let node list be a list of nodes, initially empty."
			//
			// "For each node current node contained in new range, append
			// current node to node list if the last member of node list (if
			// any) is not an ancestor of current node, and current node is
			// editable but has no editable descendants."
			var nodeList = collectContainedNodes(newRange, function(currentNode) {
				return isEditable(currentNode)
					&& !hasEditableDescendants(currentNode);
			});

			// "Outdent each node in node list."
			for (var i = 0; i < nodeList.length; i++) {
				outdentNode(nodeList[i]);
			}

			// "Abort these steps."
			return;
		}

		// "If the child of start node with index start offset is a table,
		// abort these steps."
		if (isHtmlElement(startNode.childNodes[startOffset], "table")) {
			return;
		}

		// "If start node has a child with index start offset − 1, and that
		// child is a table:"
		if (0 <= startOffset - 1
		&& startOffset - 1 < startNode.childNodes.length
		&& isHtmlElement(startNode.childNodes[startOffset - 1], "table")) {
			// "Call collapse(start node, start offset − 1) on the context
			// object's Selection."
			getActiveRange().setStart(startNode, startOffset - 1);

			// "Call extend(start node, start offset) on the context object's
			// Selection."
			getActiveRange().setEnd(startNode, startOffset);

			// "Abort these steps."
			return;
		}

		// "If offset is zero; and either the child of start node with index
		// start offset minus one is an hr, or the child is a br whose
		// previousSibling is either a br or not an inline node:"
		if (offset == 0
		&& (isHtmlElement(startNode.childNodes[startOffset - 1], "hr")
			|| (
				isHtmlElement(startNode.childNodes[startOffset - 1], "br")
				&& (
					isHtmlElement(startNode.childNodes[startOffset - 1].previousSibling, "br")
					|| !isInlineNode(startNode.childNodes[startOffset - 1].previousSibling)
				)
			)
		)) {
			// "Call collapse(node, offset) on the Selection."
			getActiveRange().setStart(node, offset);
			getActiveRange().setEnd(node, offset);

			// "Delete the contents of the range with start (start node, start
			// offset − 1) and end (start node, start offset)."
			deleteContents(startNode, startOffset - 1, startNode, startOffset);

			// "Abort these steps."
			return;
		}

		// "If the child of start node with index start offset is an li or dt
		// or dd, and that child's firstChild is an inline node, and start
		// offset is not zero:"
		if (isHtmlElement(startNode.childNodes[startOffset], ["li", "dt", "dd"])
		&& isInlineNode(startNode.childNodes[startOffset].firstChild)
		&& startOffset != 0) {
			// "Let previous item be the child of start node with index start
			// offset minus one."
			var previousItem = startNode.childNodes[startOffset - 1];

			// "If previous item's lastChild is an inline node other than a br,
			// call createElement("br") on the context object and append the
			// result as the last child of previous item."
			if (isInlineNode(previousItem.lastChild)
			&& !isHtmlElement(previousItem.lastChild, "br")) {
				previousItem.appendChild(document.createElement("br"));
			}

			// "If previous item's lastChild is an inline node, call
			// createElement("br") on the context object and append the result
			// as the last child of previous item."
			if (isInlineNode(previousItem.lastChild)) {
				previousItem.appendChild(document.createElement("br"));
			}
		}

		// "If the child of start node with index start offset is an li or dt
		// or dd, and its previousSibling is also an li or dt or dd, set start
		// node to its child with index start offset − 1, then set start offset
		// to start node's length, then set node to start node's nextSibling,
		// then set offset to 0."
		if (isHtmlElement(startNode.childNodes[startOffset], ["li", "dt", "dd"])
		&& isHtmlElement(startNode.childNodes[startOffset - 1], ["li", "dt", "dd"])) {
			startNode = startNode.childNodes[startOffset - 1];
			startOffset = getNodeLength(startNode);
			node = startNode.nextSibling;
			offset = 0;

		// "Otherwise, while start node has a child with index start offset
		// minus one, set start node to that child, then set start offset to
		// the length of start node."
		} else {
			while (0 <= startOffset - 1
			&& startOffset - 1 < startNode.childNodes.length) {
				startNode = startNode.childNodes[startOffset - 1];
				startOffset = getNodeLength(startNode);
			}
		}

		// "Delete the contents of the range with start (start node, start
		// offset) and end (node, offset)."
		deleteContents(startNode, startOffset, node, offset);
	}
};
//@}

///// The formatBlock command /////
//@{
commands.formatblock = {
	action: function(value) {
		// "If value begins with a "<" character and ends with a ">" character,
		// remove the first and last characters from it."
		if (/^<.*>$/.test(value)) {
			value = value.slice(1, -1);
		}

		// "Let value be converted to lowercase."
		value = value.toLowerCase();

		// "If value is not "address", "div", "h1", "h2", "h3", "h4", "h5",
		// "h6", "p", or "pre", then do nothing and abort these steps."
		if (["ADDRESS", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "P",
		"PRE"].indexOf(value.toUpperCase()) == -1) {
			return;
		}

		// "Block-extend the active range, and let new range be the result."
		var newRange = blockExtendRange(getActiveRange());

		// "Let original node list be an empty list of nodes."
		var originalNodeList = [];

		// "For each node node contained in new range, append node to original
		// node list if it is editable, the last member of original node list
		// (if any) is not an ancestor of node, and node is either a non-list
		// single-line container or an allowed child of "p"."
		originalNodeList = collectContainedNodes(newRange, function(node) {
			return isEditable(node)
				&& (isNonListSingleLineContainer(node)
				|| isAllowedChild(node, "p"));
		});

		// "For each node in original node list, while either node is a
		// descendant of an editable HTML element in the same editing host with
		// local name "address", "h1", "h2", "h3", "h4", "h5", "h6", "p", or
		// "pre"; or node's parent is not null, and "p" is not an allowed child
		// of node's parent: split the parent of the one-node list consisting
		// of node."
		for (var i = 0; i < originalNodeList.length; i++) {
			var node = originalNodeList[i];

			while (true) {
				if (node.parentNode
				&& !isAllowedChild("p", node.parentNode)) {
					splitParent([node]);
					continue;
				}

				var ancestor = node.parentNode;
				while (ancestor
				&& !isHtmlElement(ancestor, ["ADDRESS", "H1", "H2", "H3", "H4", "H5", "H6", "P", "PRE"])) {
					ancestor = ancestor.parentNode;
				}
				if (ancestor
				&& isEditable(ancestor)
				&& inSameEditingHost(node, ancestor)) {
					splitParent([node]);
				} else {
					break;
				}
			}
		}

		// "Let node list be a list of nodes, initially empty."
		var nodeList = [];

		// "For each node in original node list, fix prohibited paragraph
		// descendants of node, and append the resulting nodes to node list."
		for (var i = 0; i < originalNodeList.length; i++) {
			nodeList = nodeList.concat(fixProhibitedParagraphDescendants(originalNodeList[i]));
		}

		// "If value is "div" or "p", then while node list is not empty:"
		if (value == "div" || value == "p") {
			while (nodeList.length) {
				// "If the first member of node list is a non-list single-line
				// container, set the tag name of the first member of node list
				// to value, then remove the first member from node list and
				// continue this loop from the beginning."
				if (isNonListSingleLineContainer(nodeList[0])) {
					setTagName(nodeList[0], value);
					nodeList.shift();
					continue;
				}

				// "Let sublist be an empty list of nodes."
				var sublist = [];

				// "Remove the first member of node list and append it to
				// sublist."
				sublist.push(nodeList.shift());

				// "While node list is not empty, and the first member of node
				// list is the nextSibling of the last member of sublist, and
				// the first member of node list is not a non-list single-line
				// container, and the last member of sublist is not a br,
				// remove the first member of node list and append it to
				// sublist."
				while (nodeList.length
				&& nodeList[0] == sublist[sublist.length - 1].nextSibling
				&& !isNonListSingleLineContainer(nodeList[0])
				&& !isHtmlElement(sublist[sublist.length - 1], "BR")) {
					sublist.push(nodeList.shift());
				}

				// "Wrap sublist, with sibling criteria matching nothing and
				// new parent instructions returning the result of running
				// createElement(value) on the context object."
				wrap(sublist,
					function() { return false },
					function() { return document.createElement(value) });
			}

		// "Otherwise, while node list is not empty:"
		} else {
			while (nodeList.length) {
				var sublist;

				// "If the first member of node list is a non-list single-line
				// container:"
				if (isNonListSingleLineContainer(nodeList[0])) {
					// "Let sublist be the children of the first member of node
					// list."
					sublist = [].slice.call(nodeList[0].childNodes);

					// "Remove the first member of node list from its parent,
					// preserving its descendants."
					removePreservingDescendants(nodeList[0]);

					// "Remove the first member from node list."
					nodeList.shift();

				// "Otherwise:"
				} else {
					// "Let sublist be an empty list of nodes."
					sublist = [];

					// "Remove the first member of node list and append it to
					// sublist."
					sublist.push(nodeList.shift());

					// "While node list is not empty, and the first member of
					// node list is the nextSibling of the last member of
					// sublist, and the first member of node list is not a
					// non-list single-line container, and the last member of
					// sublist is not a br, remove the first member of node
					// list and append it to sublist."
					while (nodeList.length
					&& nodeList[0] == sublist[sublist.length - 1].nextSibling
					&& !isNonListSingleLineContainer(nodeList[0])
					&& !isHtmlElement(sublist[sublist.length - 1], "BR")) {
						sublist.push(nodeList.shift());
					}
				}

				// "Wrap sublist, with sibling criteria matching any HTML
				// element with local name value and no attributes, and new
				// parent instructions returning the result of running
				// createElement(value) on the context object."
				wrap(sublist,
					function(node) { return isHtmlElement(node, value.toUpperCase()) && !node.attributes.length },
					function() { return document.createElement(value) });
			}
		}
	}
};
//@}

///// The forwardDelete command /////
//@{
commands["forwarddelete"] = {
	action: function() {
		// "If the active range is not collapsed, delete the contents of the
		// active range and abort these steps."
		if (!getActiveRange().collapsed) {
			deleteContents(getActiveRange());
			return;
		}

		// "Canonicalize whitespace at (active range's start node, active
		// range's start offset)."
		canonicalizeWhitespace(getActiveRange().startContainer, getActiveRange().startOffset);

		// "Let node and offset be the active range's start node and offset."
		var node = getActiveRange().startContainer;
		var offset = getActiveRange().startOffset;

		// "Repeat the following steps:"
		while (true) {
			// "If offset is the length of node and node's nextSibling is an
			// editable invisible node, remove node's nextSibling from its
			// parent."
			if (offset == getNodeLength(node)
			&& isEditable(node.nextSibling)
			&& isInvisibleNode(node.nextSibling)) {
				node.parentNode.removeChild(node.nextSibling);

			// "Otherwise, if node has a child with index offset and that child
			// is an editable invisible node, remove that child from node."
			} else if (offset < node.childNodes.length
			&& isEditable(node.childNodes[offset])
			&& isInvisibleNode(node.childNodes[offset])) {
				node.removeChild(node.childNodes[offset]);

			// "Otherwise, if node has a child with index offset and that child
			// is a collapsed block prop, add one to offset."
			} else if (offset < node.childNodes.length
			&& isCollapsedBlockProp(node.childNodes[offset])) {
				offset++;

			// "Otherwise, if offset is the length of node and node is not a
			// prohibited paragraph child, or if node is an invisible node, set
			// offset to one plus the index of node, then set node to its
			// parent."
			} else if ((offset == getNodeLength(node)
			&& !isProhibitedParagraphChild(node))
			|| isInvisibleNode(node)) {
				offset = 1 + getNodeIndex(node);
				node = node.parentNode;

			// "Otherwise, if node has a child with index offset and that child
			// is not a prohibited paragraph child or a br or an img, set node
			// to that child, then set offset to zero."
			} else if (offset < node.childNodes.length
			&& !isProhibitedParagraphChild(node.childNodes[offset])
			&& !isHtmlElement(node.childNodes[offset], ["br", "img"])) {
				node = node.childNodes[offset];
				offset = 0;

			// "Otherwise, break from this loop."
			} else {
				break;
			}
		}

		// "If node is a Text node and offset is not node's length, call
		// collapse(node, offset) on the Selection. Then delete the contents of
		// the range with start (node, offset) and end (node, offset + 1) and
		// abort these steps."
		if (node.nodeType == Node.TEXT_NODE
		&& offset != getNodeLength(node)) {
			getActiveRange().setStart(node, offset);
			getActiveRange().setEnd(node, offset);
			deleteContents(node, offset, node, offset + 1);
			return;
		}

		// "If node is not a prohibited paragraph child, abort these steps."
		if (!isProhibitedParagraphChild(node)) {
			return;
		}

		// "If node has a child with index offset and that child is a br or hr
		// or img, call collapse(node, offset) on the Selection. Then delete
		// the contents of the range with start (node, offset) and end (node,
		// offset + 1) and abort these steps."
		if (offset < node.childNodes.length
		&& isHtmlElement(node.childNodes[offset], ["br", "hr", "img"])) {
			getActiveRange().setStart(node, offset);
			getActiveRange().setEnd(node, offset);
			deleteContents(node, offset, node, offset + 1);
			return;
		}

		// "Let end node equal node and let end offset equal offset."
		var endNode = node;
		var endOffset = offset;

		// "While end offset is the length of end node, set end offset to one
		// plus the index of end node and then set end node to its parent."
		while (endOffset == getNodeLength(endNode)) {
			endOffset = 1 + getNodeIndex(endNode);
			endNode = endNode.parentNode;
		}

		// "If the child of end node with index end offset minus one is a
		// table, abort these steps."
		if (isHtmlElement(endNode.childNodes[endOffset - 1], "table")) {
			return;
		}

		// "If the child of end node with index end offset is a table:"
		if (isHtmlElement(endNode.childNodes[endOffset], "table")) {
			// "Call collapse(end node, end offset) on the context object's
			// Selection."
			getActiveRange().setStart(endNode, endOffset);

			// "Call extend(end node, end offset + 1) on the context object's
			// Selection."
			getActiveRange().setEnd(endNode, endOffset + 1);

			// "Abort these steps."
			return;
		}

		// "If offset is the length of node, and the child of end node with
		// index end offset is an hr or br:"
		if (offset == getNodeLength(node)
		&& isHtmlElement(endNode.childNodes[endOffset], ["br", "hr"])) {
			// "Call collapse(node, offset) on the Selection."
			getActiveRange().setStart(node, offset);
			getActiveRange().setEnd(node, offset);

			// "Delete the contents of the range with end (end node, end
			// offset) and end (end node, end offset + 1)."
			deleteContents(endNode, endOffset, endNode, endOffset + 1);

			// "Abort these steps."
			return;
		}

		// "While end node has a child with index end offset, set end node to
		// that child and set end offset to zero."
		while (endOffset < endNode.childNodes.length) {
			endNode = endNode.childNodes[endOffset];
			endOffset = 0;
		}

		// "Delete the contents of the range with start (node, offset) and end
		// (end node, end offset)."
		deleteContents(node, offset, endNode, endOffset);
	}
};
//@}

///// The indent command /////
//@{
commands.indent = {
	action: function() {
		// "Let items be a list of all lis that are ancestor containers of the
		// active range's start and/or end node."
		//
		// Has to be in tree order, remember!
		var items = [];
		for (var node = getActiveRange().endContainer; node != getActiveRange().commonAncestorContainer; node = node.parentNode) {
			if (isHtmlElement(node, "LI")) {
				items.unshift(node);
			}
		}
		for (var node = getActiveRange().startContainer; node != getActiveRange().commonAncestorContainer; node = node.parentNode) {
			if (isHtmlElement(node, "LI")) {
				items.unshift(node);
			}
		}
		for (var node = getActiveRange().commonAncestorContainer; node; node = node.parentNode) {
			if (isHtmlElement(node, "LI")) {
				items.unshift(node);
			}
		}

		// "For each item in items, normalize sublists of item."
		for (var i = 0; i < items.length; i++) {
			normalizeSublists(items[i]);
		}

		// "Block-extend the active range, and let new range be the result."
		var newRange = blockExtendRange(getActiveRange());

		// "Let node list be a list of nodes, initially empty."
		var nodeList = [];

		// "For each node node contained in new range, if node is editable and
		// is an allowed child of "div" or "ol" and if the last member of node
		// list (if any) is not an ancestor of node, append node to node list."
		nodeList = collectContainedNodes(newRange, function(node) {
			return isEditable(node)
				&& (isAllowedChild(node, "div")
				|| isAllowedChild(node, "ol"));
		});

		// "If the first member of node list is an li whose parent is an ol or
		// ul, and its previousSibling is an li as well, normalize sublists of
		// its previousSibling."
		if (nodeList.length
		&& isHtmlElement(nodeList[0], "LI")
		&& isHtmlElement(nodeList[0].parentNode, ["OL", "UL"])
		&& isHtmlElement(nodeList[0].previousSibling, "LI")) {
			normalizeSublists(nodeList[0].previousSibling);
		}

		// "While node list is not empty:"
		while (nodeList.length) {
			// "Let sublist be a list of nodes, initially empty."
			var sublist = [];

			// "Remove the first member of node list and append it to sublist."
			sublist.push(nodeList.shift());

			// "While the first member of node list is the nextSibling of the
			// last member of sublist, remove the first member of node list and
			// append it to sublist."
			while (nodeList.length
			&& nodeList[0] == sublist[sublist.length - 1].nextSibling) {
				sublist.push(nodeList.shift());
			}

			// "Indent sublist."
			indentNodes(sublist);
		}
	}
};
//@}

///// The insertHorizontalRule command /////
//@{
commands.inserthorizontalrule = {
	action: function() {
		// "Let range be the active range."
		var range = getActiveRange();

		// "While range's start offset is 0 and its start node's parent is not
		// null, set range's start to (parent of start node, index of start
		// node)."
		while (range.startOffset == 0
		&& range.startContainer.parentNode) {
			range.setStart(range.startContainer.parentNode, getNodeIndex(range.startContainer));
		}

		// "While range's end offset is the length of its end node, and its end
		// node's parent is not null, set range's end to (parent of end node, 1
		// + index of start node)."
		while (range.endOffset == getNodeLength(range.endContainer)
		&& range.endContainer.parentNode) {
			range.setEnd(range.endContainer.parentNode, 1 + getNodeIndex(range.endContainer));
		}

		// "Run deleteContents() on the range."
		range.deleteContents();

		// "Let hr be the result of calling createElement("hr") on the
		// context object."
		var hr = document.createElement("hr");

		// "Run insertNode(hr) on the range."
		range.insertNode(hr);

		// "Fix disallowed ancestors of hr."
		fixDisallowedAncestors(hr);

		// "Run collapse() on the Selection, with first argument equal to the
		// parent of hr and the second argument equal to one plus the index of
		// hr."
		//
		// Not everyone actually supports collapse(), so we do it manually
		// instead.  Also, we need to modify the actual range we're given as
		// well, for the sake of autoimplementation.html's range-filling-in.
		range.setStart(hr.parentNode, 1 + getNodeIndex(hr));
		range.setEnd(hr.parentNode, 1 + getNodeIndex(hr));
		getSelection().removeAllRanges();
		getSelection().addRange(range);
	}
};
//@}

///// The insertHTML command /////
//@{
commands.inserthtml = {
	action: function(value) {
		// "Delete the contents of the active range."
		deleteContents(getActiveRange());

		// "Let frag be the result of calling createContextualFragment(value)
		// on the active range."
		var frag = getActiveRange().createContextualFragment(value);

		// "Let last child be the lastChild of frag."
		var lastChild = frag.lastChild;

		// "If last child is null, abort these steps."
		if (!lastChild) {
			return;
		}

		// "Let descendants be all descendants of frag."
		var descendants = getDescendants(frag);

		// "If the active range's start node is a prohibited paragraph child
		// whose sole child is a br, and its start offset is 0, remove its
		// start node's child from it."
		if (isProhibitedParagraphChild(getActiveRange().startContainer)
		&& getActiveRange().startContainer.childNodes.length == 1
		&& isHtmlElement(getActiveRange().startContainer.firstChild, "br")
		&& getActiveRange().startOffset == 0) {
			getActiveRange().startContainer.removeChild(getActiveRange().startContainer.firstChild);
		}

		// "Call insertNode(frag) on the active range."
		getActiveRange().insertNode(frag);

		// "Set the active range's start and end to (last child, length of last
		// child)."
		getActiveRange().setStart(lastChild, getNodeLength(lastChild));
		getActiveRange().setEnd(lastChild, getNodeLength(lastChild));

		// "Fix disallowed ancestors of each member of descendants."
		for (var i = 0; i < descendants.length; i++) {
			fixDisallowedAncestors(descendants[i]);
		}
	}
};
//@}

///// The insertImage command /////
//@{
commands.insertimage = {
	action: function(value) {
		// "If value is the empty string, abort these steps and do nothing."
		if (value === "") {
			return;
		}

		// "Let range be the active range."
		var range = getActiveRange();

		// "Delete the contents of range."
		deleteContents(range);

		// "If range's start node is a prohibited paragraph child whose sole
		// child is a br, and its start offset is 0, remove its start node's
		// child from it."
		if (isProhibitedParagraphChild(range.startContainer)
		&& range.startContainer.childNodes.length == 1
		&& isHtmlElement(range.startContainer.firstChild, "br")
		&& range.startOffset == 0) {
			range.startContainer.removeChild(range.startContainer.firstChild);
		}

		// "Let img be the result of calling createElement("img") on the
		// context object."
		var img = document.createElement("img");

		// "Run setAttribute("src", value) on img."
		img.setAttribute("src", value);

		// "Run insertNode(img) on the range."
		range.insertNode(img);

		// "Run collapse() on the Selection, with first argument equal to the
		// parent of img and the second argument equal to one plus the index of
		// img."
		//
		// Not everyone actually supports collapse(), so we do it manually
		// instead.  Also, we need to modify the actual range we're given as
		// well, for the sake of autoimplementation.html's range-filling-in.
		range.setStart(img.parentNode, 1 + getNodeIndex(img));
		range.setEnd(img.parentNode, 1 + getNodeIndex(img));
		getSelection().removeAllRanges();
		getSelection().addRange(range);

		// IE adds width and height attributes for some reason, so remove those
		// to actually do what the spec says.
		img.removeAttribute("width");
		img.removeAttribute("height");
	}
};
//@}

///// The insertLineBreak command /////
//@{
commands.insertlinebreak = {
	action: function(value) {
		// "Delete the contents of the active range."
		deleteContents(getActiveRange());

		// "If the active range's start node is an Element, and "br" is not an
		// allowed child of it, abort these steps."
		if (getActiveRange().startContainer.nodeType == Node.ELEMENT_NODE
		&& !isAllowedChild("br", getActiveRange().startContainer)) {
			return;
		}

		// "If the active range's start node is not an Element, and "br" is not
		// an allowed child of the active range's start node's parent, abort
		// these steps."
		if (getActiveRange().startContainer.nodeType != Node.ELEMENT_NODE
		&& !isAllowedChild("br", getActiveRange().startContainer.parentNode)) {
			return;
		}

		// "If the active range's start node is a Text node and its start
		// offset is zero, set the active range's start and end to (parent of
		// start node, index of start node)."
		if (getActiveRange().startContainer.nodeType == Node.TEXT_NODE
		&& getActiveRange().startOffset == 0) {
			getActiveRange().setStart(getActiveRange().startContainer.parentNode, getNodeIndex(getActiveRange().startContainer));
			getActiveRange().setEnd(getActiveRange().startContainer.parentNode, getNodeIndex(getActiveRange().startContainer));
		}

		// "If the active range's start node is a Text node and its start
		// offset is the length of its start node, set the active range's start
		// and end to (parent of start node, 1 + index of start node)."
		if (getActiveRange().startContainer.nodeType == Node.TEXT_NODE
		&& getActiveRange().startOffset == getNodeLength(getActiveRange().startContainer)) {
			getActiveRange().setStart(getActiveRange().startContainer.parentNode, 1 + getNodeIndex(getActiveRange().startContainer));
			getActiveRange().setEnd(getActiveRange().startContainer.parentNode, 1 + getNodeIndex(getActiveRange().startContainer));
		}

		// "Let br be the result of calling createElement("br") on the context
		// object."
		var br = document.createElement("br");

		// "Call insertNode(br) on the active range."
		getActiveRange().insertNode(br);

		// "Call collapse() on the context object's Selection, with br's parent
		// as the first argument and one plus br's index as the second
		// argument."
		getActiveRange().setStart(br.parentNode, 1 + getNodeIndex(br));
		getActiveRange().setEnd(br.parentNode, 1 + getNodeIndex(br));

		// "If br is a collapsed line break, call createElement("br") on the
		// context object and let extra br be the result, then call
		// insertNode(extra br) on the active range."
		if (isCollapsedLineBreak(br)) {
			getActiveRange().insertNode(document.createElement("br"));

			// Compensate for nonstandard implementations of insertNode
			getActiveRange().setStart(br.parentNode, 1 + getNodeIndex(br));
			getActiveRange().setEnd(br.parentNode, 1 + getNodeIndex(br));
		}
	}
};
//@}

///// The insertOrderedList command /////
//@{
commands.insertorderedlist = {
	// "Toggle lists with tag name "ol"."
	action: function() { toggleLists("ol") }
};
//@}

///// The insertParagraph command /////
//@{
commands.insertparagraph = {
	action: function() {
		// "Delete the contents of the active range."
		deleteContents(getActiveRange());

		// "Let range be the active range."
		var range = getActiveRange();

		// "Let node and offset be range's start node and offset."
		var node = range.startContainer;
		var offset = range.startOffset;

		// "If node is a Text node, and offset is neither 0 nor the length of
		// node, call splitText(offset) on node."
		if (node.nodeType == Node.TEXT_NODE
		&& offset != 0
		&& offset != getNodeLength(node)) {
			node.splitText(offset);
		}

		// "If node is a Text node and offset is its length, set offset to one
		// plus the index of node, then set node to its parent."
		if (node.nodeType == Node.TEXT_NODE
		&& offset == getNodeLength(node)) {
			offset = 1 + getNodeIndex(node);
			node = node.parentNode;
		}

		// "If node is a Text or Comment node, set offset to the index of node,
		// then set node to its parent."
		if (node.nodeType == Node.TEXT_NODE
		|| node.nodeType == Node.COMMENT_NODE) {
			offset = getNodeIndex(node);
			node = node.parentNode;
		}

		// "Set range's start and end to (node, offset)."
		range.setStart(node, offset);
		range.setEnd(node, offset);

		// "Let container equal node."
		var container = node;

		// "While container is not a single-line container, and container's
		// parent is editable and in the same editing host as node, set
		// container to its parent."
		while (!isSingleLineContainer(container)
		&& isEditable(container.parentNode)
		&& inSameEditingHost(node, container.parentNode)) {
			container = container.parentNode;
		}

		// "If container is not editable or not in the same editing host as
		// node or is not a single-line container:"
		if (!isEditable(container)
		|| !inSameEditingHost(container, node)
		|| !isSingleLineContainer(container)) {
			// "Let tag be the default single-line container name."
			var tag = defaultSingleLineContainerName;

			// "Block-extend range, and let new range be the result."
			var newRange = blockExtendRange(range);

			// "Let node list be a list of nodes, initially empty."
			//
			// "Append to node list the first node in tree order that is
			// contained in new range and is an allowed child of "p", if any."
			var nodeList = collectContainedNodes(newRange, function(node) { return isAllowedChild(node, "p") })
				.slice(0, 1);

			// "If node list is empty:"
			if (!nodeList.length) {
				// "If tag is not an allowed child of range's start node, abort
				// these steps."
				if (!isAllowedChild(tag, range.startContainer)) {
					return;
				}

				// "Set container to the result of calling createElement(tag)
				// on the context object."
				container = document.createElement(tag);

				// "Call insertNode(container) on range."
				range.insertNode(container);

				// "Call createElement("br") on the context object, and append
				// the result as the last child of container."
				container.appendChild(document.createElement("br"));

				// "Set range's start and end to (container, 0)."
				range.setStart(container, 0);
				range.setEnd(container, 0);

				// "Abort these steps."
				return;
			}

			// "While the nextSibling of the last member of node list is not
			// null and is an allowed child of "p", append it to node list."
			while (nodeList[nodeList.length - 1].nextSibling
			&& isAllowedChild(nodeList[nodeList.length - 1].nextSibling, "p")) {
				nodeList.push(nodeList[nodeList.length - 1].nextSibling);
			}

			// "Wrap node list, with sibling criteria matching nothing and new
			// parent instructions returning the result of calling
			// createElement(tag) on the context object.  Set container to the
			// result."
			container = wrap(nodeList,
				function() { return false },
				function() { return document.createElement(tag) }
			);
		}

		// "If container's local name is "address" or "pre":"
		if (container.tagName == "ADDRESS"
		|| container.tagName == "PRE") {
			// "Let br be the result of calling createElement("br") on the
			// context object."
			var br = document.createElement("br");

			// "Call insertNode(br) on range."
			//
			// Work around browser bugs: some browsers select the inserted
			// node, not per spec.
			range.insertNode(br);
			range.setEnd(range.startContainer, range.startOffset);

			// "Increment range's start and end offsets."
			//
			// Incrementing the start will increment the end as well, because
			// the range is collapsed.
			range.setStart(range.startContainer, range.startOffset + 1);

			// "If br is the last descendant of container, let br be the result
			// of calling createElement("br") on the context object, then call
			// insertNode(br) on range."
			//
			// Work around browser bugs again.
			if (!isDescendant(nextNode(br), container)) {
				range.insertNode(document.createElement("br"));
				range.setEnd(range.startContainer, range.startOffset);
			}

			// "Abort these steps."
			return;
		}

		// "If container's local name is "li", "dt", or "dd"; and either it has
		// no children or it has a single child and that child is a br:"
		if (["LI", "DT", "DD"].indexOf(container.tagName) != -1
		&& (!container.hasChildNodes()
		|| (container.childNodes.length == 1
		&& isHtmlElement(container.firstChild, "br")))) {
			// "Split the parent of the one-node list consisting of container."
			splitParent([container]);

			// "Fix disallowed ancestors of container."
			fixDisallowedAncestors(container);

			// "Abort these steps."
			return;
		}

		// "Let new line range be a new range whose start is the same as
		// range's, and whose end is (container, length of container)."
		var newLineRange = document.createRange();
		newLineRange.setStart(range.startContainer, range.startOffset);
		newLineRange.setEnd(container, getNodeLength(container));

		// "While new line range's start offset is zero and its start node is
		// not container, set its start to (parent of start node, index of
		// start node)."
		while (newLineRange.startOffset == 0
		&& newLineRange.startContainer != container) {
			newLineRange.setStart(newLineRange.startContainer.parentNode, getNodeIndex(newLineRange.startContainer));
		}

		// "While new line range's start offset is the length of its start node
		// and its start node is not container, set its start to (parent of
		// start node, 1 + index of start node)."
		while (newLineRange.startOffset == getNodeLength(newLineRange.startContainer)
		&& newLineRange.startContainer != container) {
			newLineRange.setStart(newLineRange.startContainer.parentNode, 1 + getNodeIndex(newLineRange.startContainer));
		}

		// "Let end of line be true if new line range contains either nothing
		// or a single br, and false otherwise."
		var containedInNewLineRange = collectContainedNodes(newLineRange);
		var endOfLine = !containedInNewLineRange.length
			|| (containedInNewLineRange.length == 1
			&& isHtmlElement(containedInNewLineRange[0], "br"));

		// "If the local name of container is "h1", "h2", "h3", "h4", "h5", or
		// "h6", and end of line is true, let new container name be the default
		// single-line container name."
		var newContainerName;
		if (/^H[1-6]$/.test(container.tagName)
		&& endOfLine) {
			newContainerName = defaultSingleLineContainerName;

		// "Otherwise, if the local name of container is "dt" and end of line
		// is true, let new container name be "dd"."
		} else if (container.tagName == "DT"
		&& endOfLine) {
			newContainerName = "dd";

		// "Otherwise, if the local name of container is "dd" and end of line
		// is true, let new container name be "dt"."
		} else if (container.tagName == "DD"
		&& endOfLine) {
			newContainerName = "dt";

		// "Otherwise, let new container name be the local name of container."
		} else {
			newContainerName = container.tagName.toLowerCase();
		}

		// "Let new container be the result of calling createElement(new
		// container name) on the context object."
		var newContainer = document.createElement(newContainerName);

		// "Copy all attributes of container to new container."
		for (var i = 0; i < container.attributes.length; i++) {
			newContainer.setAttributeNS(container.attributes[i].namespaceURI, container.attributes[i].name, container.attributes[i].value);
		}

		// "Insert new container into the parent of container immediately after
		// container."
		container.parentNode.insertBefore(newContainer, container.nextSibling);

		// "Let frag be the result of calling extractContents() on new line
		// range."
		var frag = newLineRange.extractContents();

		// "Call appendChild(frag) on new container."
		newContainer.appendChild(frag);

		// "If container has no children, call createElement("br") on the
		// context object, and append the result as the last child of
		// container."
		if (!container.hasChildNodes()) {
			container.appendChild(document.createElement("br"));
		}

		// "If new container has no children, call createElement("br") on the
		// context object, and append the result as the last child of new
		// container."
		if (!newContainer.hasChildNodes()) {
			newContainer.appendChild(document.createElement("br"));
		}

		// "Set the start of range to (new container, 0)."
		range.setStart(newContainer, 0);
	}
};
//@}

///// The insertText command /////
//@{
commands.inserttext = {
	action: function(value) {
		// "Delete the contents of the active range."
		deleteContents(getActiveRange());

		// "If value's length is greater than one:"
		if (value.length > 1) {
			// "For each element el in value, take the action for the
			// insertText command, with value equal to el."
			for (var i = 0; i < value.length; i++) {
				commands.inserttext.action(value[i]);
			}

			// "Abort these steps."
			return;
		}

		// "If value is the empty string, abort these steps."
		if (value == "") {
			return;
		}

		// "If value is a newline (U+00A0), take the action for the
		// insertParagraph command and abort these steps."
		if (value == "\n") {
			commands.insertparagraph.action();
			return;
		}

		// "Let node and offset be the active range's start node and offset."
		var node = getActiveRange().startContainer;
		var offset = getActiveRange().startOffset;

		// "If node has a child whose index is offset − 1, and that child is a
		// Text node, set node to that child, then set offset to node's
		// length."
		if (0 <= offset - 1
		&& offset - 1 < node.childNodes.length
		&& node.childNodes[offset - 1].nodeType == Node.TEXT_NODE) {
			node = node.childNodes[offset - 1];
			offset = getNodeLength(node);
		}

		// "If node has a child whose index is offset, and that child is a Text
		// node, set node to that child, then set offset to zero."
		if (0 <= offset
		&& offset < node.childNodes.length
		&& node.childNodes[offset].nodeType == Node.TEXT_NODE) {
			node = node.childNodes[offset];
			offset = 0;
		}

		// "If value is a space (U+0020), and either node is an Element whose
		// computed value for "white-space" is neither "pre" nor "pre-wrap" or
		// node is not an Element but its parent is an Element whose computed
		// value for "white-space" is neither "pre" nor "pre-wrap", set value
		// to a non-breaking space (U+00A0)."
		var refElement = node.nodeType == Node.ELEMENT_NODE ? node : node.parentNode;
		if (value == " "
		&& refElement.nodeType == Node.ELEMENT_NODE
		&& ["pre", "pre-wrap"].indexOf(getComputedStyle(refElement).whiteSpace) == -1) {
			value = "\xa0";
		}

		// "If node is a Text node:"
		if (node.nodeType == Node.TEXT_NODE) {
			// "Call insertData(offset, value) on node."
			node.insertData(offset, value);

			// "Add the length of value to offset."
			offset += value.length;

			// "Call collapse(node, offset) on the context object's Selection."
			getActiveRange().setStart(node, offset);
			getActiveRange().setEnd(node, offset);

			// "Canonicalize whitespace at (node, offset − 1)."
			canonicalizeWhitespace(node, offset - 1);

			// "Canonicalize whitespace at (node, offset)."
			canonicalizeWhitespace(node, offset);

			// "Abort these steps."
			return;
		}

		// "If node has only one child, which is a collapsed line break, remove
		// its child from it."
		//
		// FIXME: IE incorrectly returns false here instead of true sometimes?
		if (node.childNodes.length == 1
		&& isCollapsedLineBreak(node.firstChild)) {
			node.removeChild(node.firstChild);
		}

		// "Let text be the result of calling createTextNode(value) on the
		// context object."
		var text = document.createTextNode(value);

		// "Call insertNode(text) on the active range."
		getActiveRange().insertNode(text);

		// "Call collapse(text, length) on the context object's Selection,
		// where length is the length of text."
		getActiveRange().setStart(text, text.length);
		getActiveRange().setEnd(text, text.length);
	}
};
//@}

///// The insertUnorderedList command /////
//@{
commands.insertunorderedlist = {
	// "Toggle lists with tag name "ul"."
	action: function() { toggleLists("ul") }
};
//@}

///// The justifyCenter command /////
//@{
commands.justifycenter = {
	// "Justify the selection with alignment "center"."
	action: function() { justifySelection("center") }
};
//@}

///// The justifyFull command /////
//@{
commands.justifyfull = {
	// "Justify the selection with alignment "justify"."
	action: function() { justifySelection("justify") }
};
//@}

///// The justifyLeft command /////
//@{
commands.justifyleft = {
	// "Justify the selection with alignment "left"."
	action: function() { justifySelection("left") }
};
//@}

///// The justifyRight command /////
//@{
commands.justifyright = {
	// "Justify the selection with alignment "right"."
	action: function() { justifySelection("right") }
};
//@}

///// The outdent command /////
//@{
commands.outdent = {
	action: function() {
		// "Let items be a list of all lis that are ancestor containers of the
		// active range's start and/or end node."
		//
		// Has to be in tree order, remember!
		var items = [];
		for (var node = getActiveRange().endContainer; node != getActiveRange().commonAncestorContainer; node = node.parentNode) {
			if (isHtmlElement(node, "LI")) {
				items.unshift(node);
			}
		}
		for (var node = getActiveRange().startContainer; node != getActiveRange().commonAncestorContainer; node = node.parentNode) {
			if (isHtmlElement(node, "LI")) {
				items.unshift(node);
			}
		}
		for (var node = getActiveRange().commonAncestorContainer; node; node = node.parentNode) {
			if (isHtmlElement(node, "LI")) {
				items.unshift(node);
			}
		}

		// "For each item in items, normalize sublists of item."
		for (var i = 0; i < items.length; i++) {
			normalizeSublists(items[i]);
		}

		// "Block-extend the active range, and let new range be the result."
		var newRange = blockExtendRange(getActiveRange());

		// "Let node list be a list of nodes, initially empty."
		var nodeList = [];

		// "For each node node contained in new range:"
		for (
			var node = newRange.startContainer;
			node != nextNodeDescendants(newRange.endContainer);
			node = nextNode(node)
		) {
			if (!isContained(node, newRange)) {
				continue;
			}

			// "If the last member of node list (if any) is an ancestor of
			// node, or if node is not editable, continue with the next node."
			if ((nodeList.length && isAncestor(nodeList[nodeList.length - 1], node))
			|| !isEditable(node)) {
				continue;
			}

			// "If node has no editable descendants, or is an ol or ul, or is
			// an li whose parent is an ol or ul, append it to node list."
			if (!hasEditableDescendants(node)
			|| isHtmlElement(node, ["OL", "UL"])
			|| (isHtmlElement(node, "LI")
			&& isHtmlElement(node.parentNode, ["OL", "UL"]))) {
				nodeList.push(node);
			}
		}

		// "While node list is not empty:"
		while (nodeList.length) {
			// "While the first member of node list is an ol or ul or is not
			// the child of an ol or ul, outdent it and remove it from node
			// list."
			while (nodeList.length
			&& (isHtmlElement(nodeList[0], ["OL", "UL"])
			|| !isHtmlElement(nodeList[0].parentNode, ["OL", "UL"]))) {
				outdentNode(nodeList.shift());
			}

			// "If node list is empty, break from these substeps."
			if (!nodeList.length) {
				break;
			}

			// "Let sublist be a list of nodes, initially empty."
			var sublist = [];

			// "Remove the first member of node list and append it to sublist."
			sublist.push(nodeList.shift());

			// "While the first member of node list is the nextSibling of the
			// last member of sublist, and the first member of node list is not
			// an ol or ul, remove the first member of node list and append it
			// to sublist."
			while (nodeList.length
			&& nodeList[0] == sublist[sublist.length - 1].nextSibling
			&& !isHtmlElement(nodeList[0], ["OL", "UL"])) {
				sublist.push(nodeList.shift());
			}

			// "Split the parent of sublist, with new parent null."
			splitParent(sublist);

			// "Fix disallowed ancestors of each member of sublist."
			for (var i = 0; i < sublist.length; i++) {
				fixDisallowedAncestors(sublist[i]);
			}
		}
	}
};
//@}


//////////////////////////////////
///// Miscellaneous commands /////
//////////////////////////////////

///// The selectAll command /////
//@{
commands.selectall = {
	// Note, this ignores the whole globalRange/getActiveRange() thing and
	// works with actual selections.  Not suitable for autoimplementation.html.
	action: function() {
		// "Let target be the body element of the context object."
		var target = document.body;

		// "If target is null, let target be the context object's
		// documentElement."
		if (!target) {
			target = document.documentElement;
		}

		// "If target is null, let target be the context object."
		if (!target) {
			target = document;
		}

		// "Call getSelection() on the context object, and call
		// selectAllChildren(target) on the result."
		getSelection().selectAllChildren(target);
	}
};
//@}

///// The styleWithCSS command /////
//@{
commands.stylewithcss = {
	action: function(value) {
		// "If value is an ASCII case-insensitive match for the string
		// "false", set the CSS styling flag to false. Otherwise, set the
		// CSS styling flag to true."
		cssStylingFlag = String(value).toLowerCase() != "false";
	}, state: function() { return cssStylingFlag }
};
//@}

///// The useCSS command /////
//@{
commands.usecss = {
	action: function(value) {
		// "If value is an ASCII case-insensitive match for the string "false",
		// set the CSS styling flag to true. Otherwise, set the CSS styling
		// flag to false."
		cssStylingFlag = String(value).toLowerCase() == "false";
	}
};
//@}


// Done with command setup

// "Commands may have an associated action, state, value, and/or relevant CSS
// property. If not otherwise specified, the action for a command is to do
// nothing, the state is false, the value is the empty string, and the relevant
// CSS property is null."
//
// Don't dump the "command" variable into the global scope, it can cause bugs
// because we have lots of local "command"s.
(function() {
	for (var command in commands) {
		if (!("action" in commands[command])) {
			commands[command].action = function() {};
		}
		if (!("state" in commands[command])) {
			commands[command].state = function() { return false };
		}
		if (!("value" in commands[command])) {
			commands[command].value = function() { return "" };
		}
		if (!("relevantCssProperty" in commands[command])) {
			commands[command].relevantCssProperty = null;
		}
	}
})();

// vim: foldmarker=@{,@} foldmethod=marker

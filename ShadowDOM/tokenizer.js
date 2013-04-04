/**
 * Created with JetBrains PhpStorm.
 * User: mfursov
 * Date: 31.10.12
 * Time: 14:17
 * To change this template use File | Settings | File Templates.
 */

/**
 *
 * @param {String} name
 * @param {String} context
 * @param {Array} tokens
 * @constructor
 */
function TokensBlock(name, context, tokens) {
    this.name = name;
    this.context = context;
    this.tokens = tokens;
}

function MappingElement(node, startPos) {
    this.node = node;
    this.startPos = startPos;
    this.blocks = [];
    this.endPos = function () {
        return this.startPos + this.node.textContent.length;
    }
}

function MappingElementBlockInfo(name, token) {
    this.name = name;
    this.token = token;
}

function Token2NodeMapping() {
    this.firstNodeSplitPos = 0;
    this.lastNodeSplitPos = 0;
    this.mappingElements = [];
    this.globalNodeIdxs = [];
}

/**
 *
 * @param {HTMLElement} rootElement
 * @constructor
 */
function TextNodeTokenizer(rootElement) {
    this.root = rootElement;
    this.text = "";
    this.nodeMapping = [];
    this.mappingPerBlock = {};

    this.mapText(this.root);
    this.wrapTextNodes();
//    this.dump();
}

TextNodeTokenizer.prototype.dump = function () {
    var t = "";
    for (var i = 0; i < this.nodeMapping.length; i++) {
        var me = this.nodeMapping[i];
        t += "[" + me.node.textContent + "]";
    }
    console.log(t);
};

/**
 *
 * @param {HTMLElement} e
 */
TextNodeTokenizer.prototype.mapText = function (e) {
    var childNodes = e.childNodes;
    for (var i = 0; i < childNodes.length; i++) {
        /** @type {Node} */
        var node = childNodes[i];
        if (node.nodeType == Node.ELEMENT_NODE) {
            this.mapText(node);
        } else if (node.nodeType == Node.TEXT_NODE) {
            if (node.textContent.length > 0) {
                this.nodeMapping.push(new MappingElement(node, this.text.length));
                this.text += node.textContent;
            }
        }
    }
};

TextNodeTokenizer.prototype.wrapTextNodes = function (e) {
    for (var i = 0; i < this.nodeMapping.length; i++) {
        /*** @type {MappingElement} */
        var m = this.nodeMapping[i];
        var spanElement = m.node.ownerDocument.createElement("span");
        m.node.parentNode.insertBefore(spanElement, m.node);
        m.node.parentNode.removeChild(m.node);
        spanElement.appendChild(m.node);
    }
};

/**
 * @param {TokensBlock} block
 * @return {String} error message or null
 */
TextNodeTokenizer.prototype.addBlockToMapping = function (block) {
    var name = block.name;
    var context = block.context;
    var tokens = block.tokens;
    if (tokens.length == 0) {
        return "No tokens supplied!";
    }
    var startPos = this.text.indexOf(context);
    var endPos = startPos + context.length;
    var regexp = false;
    if (startPos == -1) {
        try {
            var re = new RegExp(context, "");
            var match = this.text.match(re);
            if (match && match[0]) {
                startPos = this.text.search(re);
                endPos = startPos + match[0].length;
                //console.log("FOUND:" + startPos + "-" + endPos + "\nre:'" + context + "'\ntext: '" + this.text.substr(startPos, endPos - startPos + 1) + "'");
                //
                regexp = true;
            }
        } catch (e) {
            return e.message;
        }
        if (startPos == -1) {
            return "Text not found: '" + context + "'";
        }
    }
    this.mappingPerBlock[name] = [];
    var res = null;
    if (tokens.length == 1 && context == tokens[0]) {
        res = this.registerToken(startPos, endPos, name);
    } else {
        var textPart = this.text.substr(startPos, endPos - startPos + 1);
        var partStartPos = 0;
        for (var i = 0; i < tokens.length && res == null; i++) {
            var token = tokens[i];
            if (regexp) {//this is workaround: clean token text to remove all possible regex escaping
                token = token.replace(/\\\(/g, "(").replace(/\\\)/g, ")");
            }
            var partTail = textPart.substr(partStartPos);
            var idx = partTail.indexOf(token);
            if (idx == -1) {
                res = "Token not found: '" + token + "' search context: '" + partTail + "'";
                break;
            } else {
                var tokenStartPos = startPos + partStartPos + idx;
                var tokenEndPos = tokenStartPos + token.length;
//                console.log("o:'" + token + "'");
//                console.log("a:'" + this.text.substr(tokenStartPos, tokenEndPos - tokenStartPos + 1) + "'");
                this.registerToken(tokenStartPos, tokenEndPos, name);
            }
        }
    }
    return res;
};

TextNodeTokenizer.prototype.registerToken = function (startPos, endPos, block) {
    var tnm = this.prepareToken2NodeMapping(startPos, endPos);
    var lastNodeSplitPos = tnm.mappingElements.length > 1 ? tnm.lastNodeSplitPos : tnm.lastNodeSplitPos - tnm.firstNodeSplitPos;
    if (tnm.firstNodeSplitPos > 0) {
        var newME = this.splitNode(tnm.globalNodeIdxs[0], tnm.firstNodeSplitPos);
        for (var i = 1; i < tnm.globalNodeIdxs.length; i++) {
            tnm.globalNodeIdxs[i]++;
        }
    }
    if (lastNodeSplitPos > 0) {
        var newME = this.splitNode(tnm.globalNodeIdxs[tnm.mappingElements.length - 1], lastNodeSplitPos);
        tnm.mappingElements.splice(tnm.mappingElements.length - 1, 1, newME);//replace last node in mapping with new element
    }
    var blockMappings = this.mappingPerBlock[block];
    for (var i = 0; i < tnm.mappingElements.length; i++) {
        /** @type {MappingElement}*/
        e = tnm.mappingElements[i];
        e.blocks.push(block);
        blockMappings.push(e);
    }
    return null;
};

/**
 *
 * @param nodeGlobalIdx
 * @param textSplitPos
 */
TextNodeTokenizer.prototype.splitNode = function (nodeGlobalIdx, textSplitPos) {
    /** @type {MappingElement}*/
    var oldME = this.nodeMapping[nodeGlobalIdx];
    var newNode = oldME.node.ownerDocument.createTextNode("");
    newNode.textContent = oldME.node.textContent.substr(0, textSplitPos);
    var newSpan = oldME.node.ownerDocument.createElement("span");
    newSpan.appendChild(newNode);
    oldME.node.parentNode.parentNode.insertBefore(newSpan, oldME.node.parentNode);
    oldME.node.textContent = oldME.node.textContent.substr(textSplitPos);
    var newME = new MappingElement(newNode, oldME.startPos);
    newME.blocks = newME.blocks.concat(oldME.blocks);
    for (var i = 0; i < newME.blocks.length; i++) {
        var block = newME.blocks[i];
        var mePerBlockList = this.mappingPerBlock[block];
        mePerBlockList.push(newME);
    }
    oldME.startPos += textSplitPos;
    this.nodeMapping.splice(nodeGlobalIdx, 0, newME);
    return newME;
};


/**
 * @param startPos
 * @param endPos
 * @param token
 * @return {Token2NodeMapping}
 */
TextNodeTokenizer.prototype.prepareToken2NodeMapping = function (startPos, endPos) {
    var res = new Token2NodeMapping();
    var resMeEx = this.findMappingElements(startPos, endPos);
    res.mappingElements = resMeEx[0];
    res.globalNodeIdxs = resMeEx[1];
    var first = res.mappingElements[0];
    var last = res.mappingElements[res.mappingElements.length - 1];
    res.firstNodeSplitPos = startPos - first.startPos;
    res.lastNodeSplitPos = endPos - last.startPos;
    return res;
};

TextNodeTokenizer.prototype.findMappingElements = function (textStartPos, textEndPos) {
    var resME = [];
    var resIdx = [];
    for (var i = 0; i < this.nodeMapping.length; i++) {
        var e = this.nodeMapping[i];
        if (e.endPos() > textStartPos)
            if (e.startPos < textEndPos) {
                resME.push(e);
                resIdx.push(i);
//                console.log("ME:['" + e.node.textContent + "']");
            } else {
                break;
            }
    }
    return [resME, resIdx];
};

/**
 * @param {String} block
 * @return {Array}
 */
TextNodeTokenizer.prototype.getNodesByBlock = function (block) {
    var elements = this.mappingPerBlock[block];
    var res = [];
    if (typeof(elements) == "undefined") {
        return res;
    }
    for (var i = 0; i < elements.length; i++) {
        var me = elements[i];
        res.push(me.node);
//        console.log("[" + me.node.textContent + "]");
    }
    return res;
};

TextNodeTokenizer.prototype.getBlocksByNode = function (node) {
    var res = [];
    if (typeof(node) == "undefined") {
        return res;
    }
    for (var block in this.mappingPerBlock) {
        if (this.mappingPerBlock.hasOwnProperty(block)) {
            var elements = this.mappingPerBlock[block];
            for (var j = 0; j < elements.length; j++) {
                var me = elements[j];
                if (me.node === node) {
                    res.push(block);
                    break;
                }
            }
        }
    }
    return res;
};

/**
 * @param name
 * @param text
 * @param startMarker
 * @param endMarker
 * @return {TokensBlock}
 */
function prepareTokensBlock(name, text, startMarker, endMarker) {
    if (startMarker.length == 0 || text.indexOf(startMarker) == -1) {
        return new TokensBlock(name, text, [text]);
    }
    var context = text, contextLen = 0;
    while (context.length != contextLen) {
        contextLen = context.length;
        context = context.replace(startMarker, "").replace(endMarker, "");
    }
    var tokens = [];
    var pos = 0;
    while (true) {
        var startPos = text.indexOf(startMarker, pos);
        if (startPos == -1) {
            break;
        }
        startPos += startMarker.length;
        var endPos = text.indexOf(endMarker, startPos);
        if (endPos == -1) {
            break;
        }
        var token = text.substr(startPos, endPos - startPos);
        tokens.push(token);
        pos = endPos + endMarker.length;
    }
    return new TokensBlock(name, context, tokens);
}
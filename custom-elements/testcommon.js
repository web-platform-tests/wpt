/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
 */

"use strict";

var HTML5_ELEMENTS = [ 'a', 'abbr', 'address', 'area', 'article', 'aside',
        'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br',
        'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
        'command', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div',
        'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure',
        'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header',
        'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd',
        'keygen', 'label', 'legend', 'li', 'link', 'map', 'mark', 'menu',
        'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup',
        'option', 'output', 'p', 'param', 'pre', 'progress', 'q', 'rp', 'rt',
        'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source',
        'span', 'strong', 'style', 'sub', 'table', 'tbody', 'td', 'textarea',
        'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul',
        'var', 'video', 'wbr' ];

// only void (without end tag) HTML5 elements
var HTML5_VOID_ELEMENTS = [ 'area', 'base', 'br', 'col', 'command', 'embed',
        'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source',
        'track', 'wbr' ];

// http://www.whatwg.org/specs/web-apps/current-work/multipage/forms.html#form-associated-element
var HTML5_FORM_ASSOCIATED_ELEMENTS = [ 'button', 'fieldset', 'input', 'keygen',
        'label', 'object', 'output', 'select', 'textarea' ];

var EXTENDER_CHARS = [ 0x00B7, 0x02D0, 0x02D1, 0x0387, 0x0640, 0x0E46, 0x0EC6,
        0x3005, 0x3031, 0x3032, 0x3033, 0x3034, 0x3035, 0x309D, 0x309E, 0x30FC,
        0x30FD, 0x30FE ];

var COMBINING_CHARS = [ 0x0300, 0x0301, 0x0302, 0x0303, 0x0304, 0x0305, 0x0306,
        0x0307, 0x0308, 0x0309, 0x030A, 0x030B, 0x030C, 0x030D, 0x030E, 0x030F,
        0x0310, 0x0311, 0x0312, 0x0313, 0x0314, 0x0315, 0x0316, 0x0317, 0x0318,
        0x0319, 0x031A, 0x031B, 0x031C, 0x031D, 0x031E, 0x031F, 0x0320, 0x0321,
        0x0322, 0x0323, 0x0324, 0x0325, 0x0326, 0x0327, 0x0328, 0x0329, 0x032A,
        0x032B, 0x032C, 0x032D, 0x032E, 0x032F, 0x0330, 0x0331, 0x0332, 0x0333,
        0x0334, 0x0335, 0x0336, 0x0337, 0x0338, 0x0339, 0x033A, 0x033B, 0x033C,
        0x033D, 0x033E, 0x033F, 0x0340, 0x0341, 0x0342, 0x0343, 0x0344, 0x0345,

        0x0360, 0x0361,

        0x0483, 0x0484, 0x0485, 0x0486,

        0x0591, 0x0592, 0x0593, 0x0594, 0x0595, 0x0596, 0x0597, 0x0598, 0x0599,
        0x05A0, 0x05A1,

        0x05A3, 0x05A4, 0x05A5, 0x05A6, 0x05A7, 0x05A8, 0x05A9, 0x05AA, 0x05AB,
        0x05AC, 0x05AD, 0x05AE, 0x05AF, 0x05B0, 0x05B1, 0x05B2, 0x05B3, 0x05B4,
        0x05B5, 0x05B6, 0x05B7, 0x05B8, 0x05B9,

        0x05BB, 0x05BC, 0x05BD,

        0x05BF,

        0x05C1, 0x05C2,

        0x05C4,

        0x064B, 0x064C, 0x064D, 0x064E, 0x064F, 0x0650, 0x0651, 0x0652,

        0x0670,

        0x06D6, 0x06D7, 0x06D8, 0x06D9, 0x06DA, 0x06DB, 0x06DC,

        0x06DD, 0x06DE, 0x06DF,

        0x06E0, 0x06E1, 0x06E2, 0x06E3, 0x06E4,

        0x06E7, 0x06E8,

        0x06EA, 0x06EB, 0x06EC, 0x06ED,

        0x0901, 0x0902, 0x0903,

        0x093C,

        0x093E, 0x093F, 0x0940, 0x0941, 0x0942, 0x0943, 0x0944, 0x0945, 0x0946,
        0x0947, 0x0948, 0x0949, 0x094A, 0x094B, 0x094C,

        0x094D,

        0x0951, 0x0952, 0x0953, 0x0954,

        0x0962, 0x0963,

        0x0981, 0x0982, 0x0983,

        0x09BC,

        0x09BE,

        0x09BF,

        0x09C0, 0x09C1, 0x09C2, 0x09C3, 0x09C4,

        0x09C7, 0x09C8,

        0x09CB, 0x09CC, 0x09CD,

        0x09D7,

        0x09E2, 0x09E3,

        0x0A02,

        0x0A3C,

        0x0A3E,

        0x0A3F,

        0x0A40, 0x0A41, 0x0A42,

        0x0A47, 0x0A48,

        0x0A4B, 0x0A4C, 0x0A4D,

        0x0A70, 0x0A71,

        0x0A81, 0x0A82, 0x0A83,

        0x0ABC,

        0x0ABE, 0x0ABF, 0x0AC0, 0x0AC1, 0x0AC2, 0x0AC3, 0x0AC4, 0x0AC5,

        0x0AC7, 0x0AC8, 0x0AC9,

        0x0ACB, 0x0ACC, 0x0ACD,

        0x0B01, 0x0B02, 0x0B03,

        0x0B3C,

        0x0B3E, 0x0B3F, 0x0B40, 0x0B41, 0x0B42, 0x0B43,

        0x0B47, 0x0B48,

        0x0B4B, 0x0B4C, 0x0B4D,

        0x0B56, 0x0B57,

        0x0B82, 0x0B83,

        0x0BBE, 0x0BBF, 0x0BC0, 0x0BC1, 0x0BC2,

        0x0BC6, 0x0BC7, 0x0BC8,

        0x0BCA, 0x0BCB, 0x0BCC, 0x0BCD,

        0x0BD7,

        0x0C01, 0x0C02, 0x0C03,

        0x0C3E, 0x0C3F, 0x0C40, 0x0C41, 0x0C42, 0x0C43, 0x0C44,

        0x0C46, 0x0C47, 0x0C48,

        0x0C4A, 0x0C4B, 0x0C4C, 0x0C4D,

        0x0C55, 0x0C56,

        0x0C82, 0x0C83,

        0x0CBE, 0x0CBF, 0x0CC0, 0x0CC1, 0x0CC2, 0x0CC3, 0x0CC4,

        0x0CC6, 0x0CC7, 0x0CC8,

        0x0CCA, 0x0CCB, 0x0CCC, 0x0CCD,

        0x0CD5, 0x0CD6,

        0x0D02, 0x0D03,

        0x0D3E, 0x0D3F, 0x0D40, 0x0D41, 0x0D42, 0x0D43,

        0x0D46, 0x0D47, 0x0D48,

        0x0D4A, 0x0D4B, 0x0D4C, 0x0D4D,

        0x0D57,

        0x0E31,

        0x0E34, 0x0E35, 0x0E36, 0x0E37, 0x0E38, 0x0E39, 0x0E3A,

        0x0E47, 0x0E48, 0x0E49, 0x0E4A, 0x0E4B, 0x0E4C, 0x0E4D, 0x0E4E,

        0x0EB1,

        0x0EB4, 0x0EB5, 0x0EB6, 0x0EB7, 0x0EB8, 0x0EB9,

        0x0EBB, 0x0EBC,

        0x0EC8, 0x0EC9, 0x0ECA, 0x0ECB, 0x0ECC, 0x0ECD,

        0x0F18, 0x0F19,

        0x0F35,

        0x0F37,

        0x0F39,

        0x0F3E,

        0x0F3F,

        0x0F71, 0x0F72, 0x0F73, 0x0F74, 0x0F75, 0x0F76, 0x0F77, 0x0F78, 0x0F79,
        0x0F7A, 0x0F7B, 0x0F7C, 0x0F7D, 0x0F7E, 0x0F7F, 0x0F80, 0x0F81, 0x0F82,
        0x0F83, 0x0F84,

        0x0F86, 0x0F87, 0x0F88, 0x0F89, 0x0F8A, 0x0F8B,

        0x0F90, 0x0F91, 0x0F92, 0x0F93, 0x0F94, 0x0F95,

        0x0F97,

        0x0F99, 0x0F9A, 0x0F9B, 0x0F9C, 0x0F9D, 0x0F9E, 0x0F9F, 0x0FA0, 0x0FA1,
        0x0FA2, 0x0FA3, 0x0FA4, 0x0FA5, 0x0FA6, 0x0FA7, 0x0FA8, 0x0FA9, 0x0FAA,
        0x0FAB, 0x0FAC, 0x0FAD,

        0x0FB1, 0x0FB2, 0x0FB3, 0x0FB4, 0x0FB5, 0x0FB6, 0x0FB7,

        0x0FB9,

        0x20D0, 0x20D1, 0x20D2, 0x20D3, 0x20D4, 0x20D5, 0x20D6, 0x20D7, 0x20D8,
        0x20D9, 0x20DA, 0x20DB, 0x20DC,

        0x20E1,

        0x302A, 0x302B, 0x302C, 0x302D, 0x302E, 0x302F,

        0x3099,

        0x309A

];

function newDocument() {
    var d = document.implementation.createDocument();
    return d;
}

function newHTMLDocument() {
    var d = document.implementation.createHTMLDocument('Test Document');
    return d;
}

function newXHTMLDocument() {
    var doctype = document.implementation.createDocumentType('html',
            '-//W3C//DTD XHTML 1.0 Transitional//EN',
            'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd');

    var d = document.implementation.createDocument(
            'http://www.w3.org/1999/xhtml', 'html', doctype);
    return d;
}

function newIFrame(context, src) {
    if (typeof (context) === 'undefined'
            || typeof (context.iframes) !== 'object') {
        assert_unreached('Illegal context object in newIFrame');
    }

    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';

    if (typeof (src) != 'undefined') {
        iframe.src = src;
    }
    document.body.appendChild(iframe);
    context.iframes.push(iframe);

    assert_true(typeof (iframe.contentWindow) != 'undefined'
            && typeof (iframe.contentWindow.document) != 'undefined'
            && iframe.contentWindow.document != document,
            'Failed to create new rendered document');
    return iframe;
}

function newRenderedHTMLDocument(context) {
    var frame = newIFrame(context);
    var d = frame.contentWindow.document;
    return d;
}

function newContext() {
    return {
        iframes : []
    };
}

function cleanContext(context) {
    context.iframes.forEach(function(e) {
        e.parentNode.removeChild(e);
    });
}

// run given test function in context
// the context is cleaned up after test completes.
function inContext(f) {
    return function() {
        var context = newContext();
        try {
            f(context);
        } finally {
            cleanContext(context);
        }
    };
}

// new context and iframe are created and url (if supplied) is asigned to
// iframe.src
// function f is bound to the iframe onload event or executed directly after
// iframe creation
// the context is passed to function as argument
function testInIFrame(url, f, testName, testProps) {
    if (url) {
        var t = async_test(testName, testProps);
        t.step(function() {
            var context = newContext();
            var iframe = newIFrame(context, url);
            iframe.onload = t.step_func(function() {
                try {
                    f(context);
                    t.done();
                } finally {
                    cleanContext(context);
                }
            });
        });
    } else {
        test(inContext(function(context) {
            newRenderedHTMLDocument(context);
            f(context);
        }), testName, testProps);
    }
}

function assert_nodelist_contents_equal_noorder(actual, expected, message) {
    assert_equals(actual.length, expected.length, message);
    var used = [];
    for ( var i = 0; i < expected.length; i++) {
        used.push(false);
    }
    for (i = 0; i < expected.length; i++) {
        var found = false;
        for ( var j = 0; j < actual.length; j++) {
            if (used[j] == false && expected[i] == actual[j]) {
                used[j] = true;
                found = true;
                break;
            }
        }
        if (!found) {
            assert_unreached(message + ". Fail reason:  element not found: "
                    + expected[i]);
        }
    }
}

function isVisible(el) {
    return el.offsetTop != 0;
}

function isVoidElement(elementName) {
    return HTML5_VOID_ELEMENTS.indexOf(elementName) >= 0;
}

function checkTemplateContent(d, obj, html, id, nodeName) {

    obj.innerHTML = '<template id="tmpl">' + html + '</template>';

    var t = d.querySelector('#tmpl');

    if (id != null) {
        assert_equals(t.content.childNodes.length, 1, 'Element ' + nodeName
                + ' should present among template nodes');
        assert_equals(t.content.firstChild.id, id, 'Wrong element ID');
    }
    if (nodeName != null) {
        assert_equals(t.content.firstChild.nodeName, nodeName.toUpperCase(),
                'Wrong node name');
    }
}

function checkBodyTemplateContent(d, html, id, nodeName) {
    checkTemplateContent(d, d.body, html, id, nodeName);
}

function checkHeadTemplateContent(d, html, id, nodeName) {
    checkTemplateContent(d, d.head, html, id, nodeName);
}

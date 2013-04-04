/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_04_00_02 = {
    name:'A_04_00_02',
    assert:'Nodes, that are not elements, are not allowed to become shadow hosts',
    link:'http://www.w3.org/TR/shadow-dom/#shadow-dom-subtrees',
    highlight:'Only elements must be allowed to become shadow hosts.'
};

//check that 'text' node can't be used as a shadow host
test(function () {
    var d = newHTMLDocument();
    var n = d.createTextNode('some text');
    d.body.appendChild(n);
    assert_equals(n.createShadowRoot, undefined, 'Text node can\'t be used as shadow root');
}, 'A_04_00_02_T01', PROPS(A_04_00_02, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>'
}));

//check that 'comment' node can't be used as a shadow host
test(function () {
    var d = newHTMLDocument();
    var n = d.createComment('comment');
    d.body.appendChild(n);
    assert_equals(n.createShadowRoot, undefined, 'Comment node can\'t be used as shadow root');
}, 'A_04_00_02_T02', PROPS(A_04_00_02, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>'
}));

//check that 'CDATA' node can't be used as a shadow host
test(function () {
    var d = newDocument();
    var n = d.createCDATASection('some data');
    d.documentElement.appendChild(n);
    assert_equals(n.createShadowRoot, undefined, 'CDATA section can\'t be used as shadow root');
}, 'A_04_00_02_T03', PROPS(A_04_00_02, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>'
}));

//check that 'attribute' node can't be used as a shadow host
test(function () {
    var d = newDocument();
    var n = d.createAttribute('attribute');
    d.documentElement.setAttributeNode(n);
    assert_equals(n.createShadowRoot, undefined, 'Check that Attribute node can\'t be used as shadow root');
}, 'A_04_00_02_T04', PROPS(A_04_00_02, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>'
}));

//check that 'document fragment' node can't be used as a shadow host
test(function () {
    var d = newDocument();
    var n = d.createDocumentFragment();
    d.documentElement.appendChild(n);
    assert_equals(n.createShadowRoot, undefined, 'DocumentFragment node can\'t be used as shadow root');
}, 'A_04_00_02_T05', PROPS(A_04_00_02, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>'
}));

//check that 'entity reference' node can't be used as a shadow host
test(function () {
    var d = newDocument();
    var n = d.createEntityReference('reference');
    d.documentElement.appendChild(n);
    assert_equals(n.createShadowRoot, undefined, 'Entity Reference node can\'t be used as shadow root');
}, 'A_04_00_02_T06', PROPS(A_04_00_02, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>'
}));

//check that 'processing instruction' node can't be used as a shadow host
test(function () {
    var d = newDocument();
    var n = d.createProcessingInstruction('xml', ' version = "1.0"');
    d.documentElement.appendChild(n);
    assert_equals(n.createShadowRoot, undefined, 'Processing instruction node can\'t be used as shadow root');
}, 'A_04_00_02_T07', PROPS(A_04_00_02, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>'
}));

//check that document can't be used as a shadow host
test(function () {
    var d = newDocument();
    assert_equals(d.createShadowRoot, undefined, 'Document can\'t be used as shadow root');
}, 'A_04_00_02_T08', PROPS(A_04_00_02, {
    author:'Aleksei Yu. Semenov',
}));

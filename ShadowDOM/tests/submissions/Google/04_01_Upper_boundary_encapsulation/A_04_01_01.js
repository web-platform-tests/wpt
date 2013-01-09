/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_04_01_01 = {
    name:'A_04_01_01',
    assert:'Upper-boundary encapsulation:' +
        'The ownerDocument property of all nodes in shadow tree refers to the document of the shadow host',
    link:'http://www.w3.org/TR/shadow-dom/#upper-boundary-encapsulation',
    highlight:'The ownerDocument property refers to the document of the shadow host'
};


A_04_01_01.checkOwnerDocument = function (node, expectedOwnerDocument){
	assert_equals(node.ownerDocument, expectedOwnerDocument, 'node '+node.nodeName+' ownerDocument is not correct');

	var i;
	for (i=0; i<node.childNodes.length; i++){
		A_04_01_01.checkOwnerDocument(node.childNodes.item(i),expectedOwnerDocument);
	}
};

// shadow host: top-level elements (documentElement, head, body)
test(function () {
    var d = newHTMLDocument();

    var s1 = createSR(d.body);
    assert_equals(s1.ownerDocument, d, 'Check for d.body node');

    var s2 = createSR(d.documentElement);
    assert_equals(s2.ownerDocument, d, 'Check for d.documentElement node');

    var s3 = createSR(d.head);
    assert_equals(s3.ownerDocument, d, 'Check for d.head node');

}, 'A_04_01_01_T01', PROPS(A_04_01_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// shadow host: elements with different depth in the original document
test(function () {
    var d = newHTMLDocument();

    var e1 = d.createElement('div');
    d.body.appendChild(e1);
    var s1 = createSR(e1);
    assert_equals(s1.ownerDocument, d, 'Check for a simple element at depth 1 [div]');


    var e2 = d.createElement('h1');
    e1.appendChild(e2);
    var s2 = createSR(e2);
    assert_equals(s2.ownerDocument, d, 'Check for a simple element at depth 2: [div.h1]');

    var e3 = d.createElement('script');
    e2.appendChild(e3);
    var s3 = createSR(e3);
    assert_equals(s3.ownerDocument, d, 'Check for a simple element at depth 3: [div.h1.script]');

}, 'A_04_01_01_T02', PROPS(A_04_01_01, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>'
}));


// check that element added to shadow tree automatically gets
// valid owner document
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    var e = d.createElement('div');
    e = s.appendChild(e);
    assert_equals(e.ownerDocument, d, 'the ownerDocument of a node in a shadow tree must refer ' +
        'to the document of the shadow host');

}, 'A_04_01_01_T03', PROPS(A_04_01_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// shadow tree node: created by different document
test(function () {
    var d1 = newHTMLDocument();
    var d2 = newHTMLDocument();

    var s = createSR(d1.body);
    var e = d2.createElement('div');
    e = s.appendChild(e);

    assert_equals(e.ownerDocument, d1, 'the ownerDocument of an adopted node in a shadow tree ' +
        'must refer to the document of the shadow host');

}, 'A_04_01_01_T04', PROPS(A_04_01_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// check that all children nodes of shadow root
// get valid owner document when added to shadow tree
test(function () {
    var d1 = newHTMLDocument();
    var d2 = newHTMLDocument();
    var s = createSR(d1.body);

    var e1 = d2.createElement('div');
    var e2 = d2.createElement('div');

    e1.appendChild(e2);
    s.appendChild(e1);

    assert_equals(e2.ownerDocument, d1, 'the ownerDocument of an adopted node child nodes ' +
    	'in a shadow tree must refer to the document of the shadow host');

    A_04_01_01.checkOwnerDocument(e1, d1);

}, 'A_04_01_01_T05', PROPS(A_04_01_01, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov'
}));

// check that parent element of shadow node still refer to the
// original owner document
test(function () {
    var d1 = newHTMLDocument();
    var d2 = newHTMLDocument();
    var s = createSR(d1.body);

    var e1 = d2.createElement('div');
    var e2 = d2.createElement('div');

    e1.appendChild(e2);
    s.appendChild(e2);

    assert_equals(e1.ownerDocument, d2, 'the ownerDocument of an adopted node parent node in a shadow tree ' +
        'must refer to the original document');

}, 'A_04_01_01_T06', PROPS(A_04_01_01, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>'
}));

// shadow tree: any HTML5 element
test(function(){
	var i;
	for (i=0; i<HTML5_TAG.length; i++){
		var d1 = newHTMLDocument();
		var d2 = newHTMLDocument();

		var hostElement = d1.createElement(HTML5_TAG[i]);
		try {
			var shadowRoot = createSR(hostElement);
		} catch (e) {
			// if shadow tree can not be added, can not check the test case.
			continue;			
		}
		var k;
		for (k=0; k<HTML5_TAG.length; k++){
			var shadowElement = d2.createElement(HTML5_TAG[k]);
			shadowRoot.appendChild(shadowElement);
			A_04_01_01.checkOwnerDocument(shadowElement, d1);
		}
	}

}, 'A_04_01_01_T07', PROPS(A_04_01_01, {
    author:'Aleksei Yu. Semenov'
}));

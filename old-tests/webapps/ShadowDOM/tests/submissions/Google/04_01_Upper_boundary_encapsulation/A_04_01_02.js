/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_04_01_02 = {
    name:'A_04_01_02',
    assert:'Upper-boundary encapsulation: ' +
        'The shadow nodes and named shadow elements are not accessible using shadow host\'s ' +
        'document DOM tree accessors',
    link:'http://www.w3.org/TR/shadow-dom/#upper-boundary-encapsulation',
    highlight:'The nodes and named elements are not accessible using shadow host\'s document DOM tree accessors'
};

// check that 'body' accessor is not exposed
// when added to shadow tree
test(function () {
    var d1 = newHTMLDocument();
    var d2 = newHTMLDocument();

    var s = createSR(d1.documentElement);

    assert_not_equals(d2.body, null, 'initial DOM model state check failed!');
    var d2_body = d2.body; // remember the reference to d2.body
    // now add body to shadow tree
    s.appendChild(d2.body);

    assert_not_equals(d1.body, d2_body, '"body" in shadow DOM must not be exposed ' +
        'via the "document.body" DOM accessor');

}, 'A_04_01_02_T01', PROPS(A_04_01_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// check that 'head' accessor is not exposed
// when added to shadow tree
test(function () {
    var d1 = newHTMLDocument();
    var d2 = newHTMLDocument();
    var s = createSR(d1.documentElement);

    assert_not_equals(d2.head, null, 'initial DOM model state check failed!');
    var d2_head = d2.head;

    // now add head (with title)
    s.appendChild(d2.head);

    assert_not_equals(d1.head, d2_head, '"head" in shadow DOM must not be exposed ' +
        'via the "document.head" DOM accessor');

    assert_equals(d2.title, '', '"title" text in shadow DOM must not be ' +
        'exposed via "document.title" DOM accessor');

}, 'A_04_01_02_T02', PROPS(A_04_01_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// check that element is not exposed via 'all' accessor
// when added to shadow tree
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.documentElement);

    allLengthBefore = d.all.length;
    e = d.createElement('br');
    d.body.appendChild(e);
    assert_true(d.all.length>allLengthBefore, 'The element should be accessible before test');

    s.appendChild(e);

    assert_equals(d.all.length, allLengthBefore, 'elements in shadow DOM must not ' +
        'be exposed via the "document.all" DOM accessor');

}, 'A_04_01_02_T03', PROPS(A_04_01_02, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>'
}));

// check that element is not exposed via 'anchors' accessor
// when added to shadow tree
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.documentElement);

    e = d.createElement('a');
    e.setAttribute('name', 'x');
    d.body.appendChild(e);
    assert_true(d.anchors.length>0, 'The element should be accessible before test');

    s.appendChild(e);

    assert_equals(d.anchors.length, 0,
        '"a" elements with "name" attributes in shadow DOM must not ' +
            'be exposed via the "document.anchors" DOM accessor');

}, 'A_04_01_02_T04', PROPS(A_04_01_02, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>'
}));

// check that element is not exposed via 'applets' accessor
// when added to shadow tree
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.documentElement);

    e = d.createElement('applet');
    d.body.appendChild(e);
    assert_true(d.applets.length>0, 'The element should be accessible before test');

    s.appendChild(e);
    assert_equals(d.applets.length, 0,
        '"applets" elements in shadow DOM must not ' +
            'be exposed via the "document.applets" DOM accessor');


}, 'A_04_01_02_T05', PROPS(A_04_01_02, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>'
}));

// check that element is not exposed via 'embeds' accessor
// when added to shadow tree
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.documentElement);

    e = d.createElement('embed');
    d.body.appendChild(e);
    assert_true(d.embeds.length>0, 'The element should be accessible before test');

    s.appendChild(e);
    assert_equals(d.embeds.length, 0, '"embeds" in shadow DOM must not be exposed via the ' +
        '"document.embeds" DOM accessor');

}, 'A_04_01_02_T06', PROPS(A_04_01_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// check that element is not exposed via 'forms' accessor
// when added to shadow tree
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.documentElement);

    e = d.createElement('form');
    d.body.appendChild(e);
    assert_true(d.forms.length>0, 'The element should be accessible before test');

    s.appendChild(e);
    assert_equals(d.forms.length, 0, '"form" elements in shadow DOM must not be exposed via the ' +
        'document.forms DOM accessor');

}, 'A_04_01_02_T07', PROPS(A_04_01_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// check that element is not exposed via 'images' accessor
// when added to shadow tree
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.documentElement);

    var e = d.createElement('img');
    d.body.appendChild(e);
    assert_true(d.images.length>0, 'The element should be accessible before test');

    s.appendChild(e);
    assert_equals(d.images.length, 0, '"images" in shadow DOM must not be exposed via the ' +
        '"document.images" DOM accessor');

}, 'A_04_01_02_T08', PROPS(A_04_01_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));


// check that 'a' element is not exposed via 'links' accessor
// when added to shadow tree
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.documentElement);

    e = d.createElement('a');
    e.setAttribute('href', 'http://www.w3.org/');
    d.body.appendChild(e);
    assert_true(d.links.length>0, 'The element should be accessible before test');

    s.appendChild(e);
    assert_equals(d.links.length, 0, '"a" elements with "href" attributes in shadow DOM must not ' +
        'be exposed via the "document.links" DOM accessor');


}, 'A_04_01_02_T09', PROPS(A_04_01_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// check that 'area' element is not exposed via 'links' accessor
// when added to shadow tree
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.documentElement);

    e = d.createElement('area');
    e.setAttribute('href', 'http://www.w3.org/');
    d.body.appendChild(e);
    assert_true(d.links.length>0, 'The element should be accessible before test');

    s.appendChild(e);
    assert_equals(d.links.length, 0, '"area" elements with href attributes in shadow DOM must ' +
        'not be exposed via the "document.links" DOM accessor');

}, 'A_04_01_02_T10', PROPS(A_04_01_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));


// check that element is not exposed via 'scripts' accessor
// when added to shadow tree
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.documentElement);

    e = d.createElement('script');
    d.head.appendChild(e);
    assert_true(d.scripts.length>0, 'The element should be accessible before test');

    s.appendChild(e);

    assert_equals(d.scripts.length, 0, '"script" elements in shadow DOM must not be exposed via ' +
        'the "document.scripts" DOM accessor');

}, 'A_04_01_02_T11', PROPS(A_04_01_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));


// check that element is not exposed via 'getElementByName' accessor
// when added to shadow tree
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.documentElement);

    e = d.createElement('div');
    e.setAttribute('name', 'bob');
    s.appendChild(e);
    assert_equals(d.getElementsByName('bob').length, 0, 'elements (like "div") in shadow DOM ' +
        'must not be exposed via the getElementsByName DOM accessor');

}, 'A_04_01_02_T12_01', PROPS(A_04_01_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));


// check that element is not exposed via 'getElementByTagName' accessor
// when added to shadow tree
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.documentElement);

    e = d.createElement('div');
    e.setAttribute('name', 'bob');
    d.body.appendChild(e);
    assert_true(d.getElementsByTagName('div').length > 0, 'The element should be accessible before test');

    s.appendChild(e);

    assert_equals(d.getElementsByTagName('div').length, 0, 'elements (like "div") in shadow DOM ' +
        'must not be exposed via the getElementsByTagName DOM accessor');

}, 'A_04_01_02_T12_02', PROPS(A_04_01_02, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>'
}));


// check that element is not exposed via 'getElementByClassName' accessor
// when added to shadow tree
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.documentElement);

    e = d.createElement('div');
    e.setAttribute('name', 'bob');
    e.setAttribute('class', 'clazz');
    d.body.appendChild(e);
    assert_true(d.getElementsByClassName('clazz').length > 0, 'The element should be accessible before test');

    s.appendChild(e);
    assert_equals(d.getElementsByClassName('clazz').length, 0, 'elements (like "div") in shadow DOM ' +
        'must not be exposed via the getElementsByClassName DOM accessor');

}, 'A_04_01_02_T12_03', PROPS(A_04_01_02, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>'
}));

//check that element is not exposed via 'getElementByTagNameNS' accessor
//when added to shadow tree
test(function () {
	var d = newHTMLDocument();
	var s = createSR(d.documentElement);

	e = d.createElementNS('http://www.w3c.org/namespace','div');
	d.body.appendChild(e);
	assert_true(d.getElementsByTagNameNS('http://www.w3c.org/namespace','div').length > 0, 'The element should be accessible before test');

	s.appendChild(e);

	assert_equals(d.getElementsByTagNameNS('http://www.w3c.org/namespace','div').length, 0, 'elements (like "div") in shadow DOM ' +
	   'must not be exposed via the getElementsByTagNameNS DOM accessor');

}, 'A_04_01_02_T12_04', PROPS(A_04_01_02, {
	author:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));
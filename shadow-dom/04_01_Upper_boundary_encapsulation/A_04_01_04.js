/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_04_01_04 = {
    name:'A_04_01_04',
    assert:'Upper-boundary encapsulation: ' +
        'The shadow tree nodes are not present the document\'s NodeList, HTMLCollection or DOMElementMap collection instances',
    link:'http://www.w3.org/TR/shadow-dom/#upper-boundary-encapsulation',
    highlight:'The nodes are not present in any of the document\'s NodeList, HTMLCollection, ' +
        'or DOMElementMap instances'
};

// check node list returned by getElementsByTagName method
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    var span = d.createElement('span');
    d.body.appendChild(span);
    s.appendChild(span);

    var nodeList = d.getElementsByTagName('span');
    assert_equals(nodeList.length, 0, 'elements in shadow DOM must not be exposed via ' +
        'document.getElementsByTagName');

}, 'A_04_01_04_T01', PROPS(A_04_01_04, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// check node list returned by getElementsByTagNameNS method
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    var span = d.createElement('span');
    d.body.appendChild(span);
    s.appendChild(span);

    // getElementsByTagNameNS
    var nodeList = d.getElementsByTagNameNS('*', 'span');
    assert_equals(nodeList.length, 0, 'elements in shadow DOM must not be exposed via ' +
        'document.getElementsByTagNameNS');

}, 'A_04_01_04_T02', PROPS(A_04_01_04, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// check node list returned by getElementsByClassName method
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    var span = d.createElement('span');
    span.setAttribute('class', 'shadowy');
    d.body.appendChild(span);

    s.appendChild(span);

    var nodeList = d.getElementsByClassName('shadowy');
    assert_equals(nodeList.length, 0, 'elements in shadow DOM must not be exposed via ' +
        'document.getElementsByClassName');

}, 'A_04_01_04_T03', PROPS(A_04_01_04, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// check node list returned by querySelectorAll method
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    var span = d.createElement('span');

    // querySelectorAll
    span.setAttribute('id', 'span_id');
    span.setAttribute('class', 'span_class');
    d.body.appendChild(span);

    s.appendChild(span);

    var nodeList1 = d.querySelectorAll('#span_id');
    assert_equals(nodeList1.length, 0, 'elements in shadow DOM must not be exposed via ' +
        'document.querySelectorAll by their id');

    var nodeList2 = d.querySelectorAll('.span_class');
    assert_equals(nodeList2.length, 0, 'elements in shadow DOM must not be exposed via ' +
        'document.querySelectorAll by their class name');

    var nodeList3 = d.querySelectorAll('span');
    assert_equals(nodeList3.length, 0, 'elements in shadow DOM must not be exposed via ' +
        'document.querySelectorAll by their tag name');

}, 'A_04_01_04_T04', PROPS(A_04_01_04, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// check for HTMLCollection content
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    var htmlCollections =         ['anchors', 'links', 'embeds', 'forms', 'images', 'links', 'plugins','scripts'];
    var htmlCollectionsElements = ['a',       'a',     'embed',  'form',  'img',    'area',  'embed',   'script'];
    var cnt = 0;
    htmlCollectionsElements.forEach(function (tagName) {
        var e = d.createElement(tagName);
        if (tagName=='a' || tagName=='area'){
        	e.setAttribute('href', 'http://www.w3.org/');
        }
        d.body.appendChild(e);

        s.appendChild(e);
        var collection = null;
        collection = d[htmlCollections[cnt]];
        if (collection) {
            assert_equals(collection.length, 0, 'Elements in shadow DOM must not be exposed via ' +
                'document.' + htmlCollections[cnt] + ' collection cnt:'+cnt);
        }
        cnt++;
    });
}, 'A_04_01_04_T05', PROPS(A_04_01_04, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));
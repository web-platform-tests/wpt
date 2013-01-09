/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_04_01_06 = {
    name:'A_04_01_06',
    assert:'Upper-boundary encapsulation: ' +
        'The nodes are accessible using shadow root\'s DOM tree accessor methods',
    link:'http://www.w3.org/TR/shadow-dom/#upper-boundary-encapsulation',
    highlight:'[[The nodes are accessible using shadow root\'s DOM tree accessor methods]]' +
        '[\\s\\S]*[[For convenience, the shadow root provides its own set of DOM tree accessor methods.]]'
};

// getElementsByTagName accessor
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);
    var e = d.createElement('img');
    s.appendChild(e);

    assert_equals(s.getElementsByTagName('img').length, 1, 'elementsin shadow DOM must be accessible via the ' +
        'shadow root .getElementsByTagName DOM accessor');

}, 'A_04_01_06_T01', PROPS(A_04_01_06, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// getElementsByTagNameNS accessor
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);
    var e = d.createElement('img');
    s.appendChild(e);

    assert_equals(s.getElementsByTagNameNS('*', 'img').length, 1,
        'elements in shadow DOM must be accessible via the ' +
            'shadow root .getElementsByTagNameNS DOM accessor');

}, 'A_04_01_06_T02', PROPS(A_04_01_06, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// getElementsByClassName accessor
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);
    e = d.createElement('div');
    e.setAttribute('class', 'div_class');
    s.appendChild(e);
    assert_equals(s.getElementsByClassName('div_class').length, 1, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .getElementsByClassName DOM accessor');

}, 'A_04_01_06_T03', PROPS(A_04_01_06, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// getElementById accessor
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    e = d.createElement('span');
    e.setAttribute('id', 'span_id');
    s.appendChild(e);
    assert_equals(s.getElementById('span_id'), e, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .getElementById DOM accessor');

}, 'A_04_01_06_T04', PROPS(A_04_01_06, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));


// querySelector accessor
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    var e1 = d.createElement('span');
    e1.setAttribute('id', 'span_id');
    s.appendChild(e1);

    var e2 = d.createElement('div');
    e2.setAttribute('class', 'div_class');
    e1.appendChild(e2);

    var id_res = s.querySelector("#span_id");
    assert_equals(id_res, e1, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .querySelector DOM accessor (by id)');

    var elem_res = s.querySelector("span");
    assert_equals(elem_res, e1, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .querySelector DOM accessor (by element)');

    var class_res = s.querySelector(".div_class");
    assert_equals(class_res, e2, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .querySelector DOM accessor (by class name)');

}, 'A_04_01_06_T05', PROPS(A_04_01_06, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

// querySelectorAll accessor by element type
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    var e1 = d.createElement('span');
    s.appendChild(e1);

    var e2 = d.createElement('span');
    e1.appendChild(e2);

    var res = s.querySelectorAll("span");
    assert_equals(res.length, 2, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .querySelectorAll DOM accessor (by element type)');

    assert_true(res.item(0) == e1 || res.item(1) == e1, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .querySelectorAll DOM accessor (e1 by element type)');

    assert_true(res.item(0) == e2 || res.item(1) == e2, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .querySelectorAll DOM accessor (e2 by element type)');


}, 'A_04_01_06_T06', PROPS(A_04_01_06, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));


// querySelectorAll accessor with attribute value
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    var e1 = d.createElement('span');
    e1.setAttribute('test', 'span_id');
    s.appendChild(e1);

    var e2 = d.createElement('span');
    e2.setAttribute('test', 'span_id');
    e1.appendChild(e2);

    var res = s.querySelectorAll("[test=span_id]");
    assert_equals(res.length, 2, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .querySelectorAll DOM accessor (by attribute value)');

    assert_true(res.item(0) == e1 || res.item(1) == e1, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .querySelectorAll DOM accessor (e1 by attribute value)');

    assert_true(res.item(0) == e2 || res.item(1) == e2, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .querySelectorAll DOM accessor (e2 by attribute value)');


}, 'A_04_01_06_T07', PROPS(A_04_01_06, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

// querySelectorAll accessor for class
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    var e1 = d.createElement('div');
    e1.setAttribute('class', 'div_class');
    s.appendChild(e1);

    var e2 = d.createElement('div');
    e2.setAttribute('class', 'div_class');
    e1.appendChild(e2);

    var res = s.querySelectorAll(".div_class");
    assert_equals(res.length, 2, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .querySelectorAll DOM accessor (by class name)');

    assert_true(res.item(0) == e1 || res.item(1) == e1, e1, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .querySelectorAll DOM accessor (e1 by class name)');

    assert_true(res.item(0) == e2 || res.item(1) == e2, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .querySelectorAll DOM accessor (e2 by class name)');

}, 'A_04_01_06_T08', PROPS(A_04_01_06, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

//querySelector accessor by ID
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    var e1 = d.createElement('span');
    e1.setAttribute('id', 'span_id');
    s.appendChild(e1);

    var e2 = d.createElement('div');
    e2.setAttribute('class', 'div_class');
    e1.appendChild(e2);

    var res = s.querySelectorAll("#span_id");
    assert_equals(res.length, 1, 'elements in shadow DOM must be accessible via the ' +
            'shadow root .querySelectorAll DOM accessor (by id)');

    assert_equals(res.item(0), e1, 'elements in shadow DOM must be accessible via the ' +
        'shadow root .querySelectorAll DOM accessor (by id)');

}, 'A_04_01_06_T09', PROPS(A_04_01_06, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));
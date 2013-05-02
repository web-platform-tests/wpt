/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_04_01_10 = {
    name:'A_04_01_10',
    assert:'Upper-boundary encapsulation: The parentNode and parentElement attributes of the shadow root object ' +
    		'must always return null.',
    link:'http://www.w3.org/TR/shadow-dom/#upper-boundary-encapsulation',
    highlight:'The parentNode and parentElement attributes of the shadow root object ' +
        'must always return null.'
};

//check parentNode of usual shadow
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    assert_equals(s.parentNode, null, 'the parentNode attribute of the shadow ' +
        'root object must always return null');

}, 'A_04_01_10_T01', PROPS(A_04_01_10, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

//check parentElement of usual shadow
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    assert_equals(s.parentElement, null, 'the parentElement attribute of the shadow root object ' +
        'must always return null');

}, 'A_04_01_10_T02', PROPS(A_04_01_10, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

//check parentNode for nested shadow
test(function () {
    var d = newHTMLDocument();
    var s1 = createSR(d.body);
    var e1 = d.createElement('div');
    s1.appendChild(e1);
    var s2 = createSR(e1);

    assert_equals(s2.parentNode, null, 'the parentNode attribute of the shadow ' +
        'root object must always return null');

}, 'A_04_01_10_T03', PROPS(A_04_01_10, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

//check parentElement for nested shadow
test(function () {
    var d = newHTMLDocument();
    var s1 = createSR(d.body);
    var e1 = d.createElement('div');
    s1.appendChild(e1);
    var s2 = createSR(e1);

    assert_equals(s2.parentElement, null, 'the parentElement attribute of the shadow root object ' +
        'must always return null');

}, 'A_04_01_10_T04', PROPS(A_04_01_10, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

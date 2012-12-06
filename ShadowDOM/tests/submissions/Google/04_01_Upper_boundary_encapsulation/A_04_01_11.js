/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_04_01_11 = {
    name:'A_04_01_11',
    assert:'Upper-boundary encapsulation:The style sheets, represented by the nodes ' +
        'are not accessible using shadow host document\'s CSSOM extensions',
    link:'http://www.w3.org/TR/shadow-dom/#upper-boundary-encapsulation',
    highlight:'The style sheets, represented by the nodes are not accessible using ' +
        'shadow host document\'s CSSOM extensions'
};

// check that <style> element added to head is not exposed
var A_04_01_11_T1 = async_test('A_04_01_11_T01', PROPS(A_04_01_11, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

A_04_01_11_T1.step(function () {
    var ctx = newContext();
    var iframe = newIFrame(ctx, 'resources/blank.html');
    iframe.onload = A_04_01_11_T1.step_func(step_unit(function () {
        var d = iframe.contentDocument;
        var s = new SR(d.head);
        var style = d.createElement('style');
        s.appendChild(style);
        assert_equals(d.styleSheets.length, 0, 'style elements in shadow DOM must not be exposed via ' +
            'the document.styleSheets collection');

    }, ctx, A_04_01_11_T1));
});


// check that <link> element added to head is not exposed
var A_04_01_11_T2 = async_test('A_04_01_11_T02', PROPS(A_04_01_11, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

A_04_01_11_T2.step(function () {
    var ctx = newContext();
    var iframe = newIFrame(ctx, 'resources/blank.html');
    iframe.onload = A_04_01_11_T2.step_func(step_unit(function () {
        var d = iframe.contentDocument;
        var s = new SR(d.head);

        var link = d.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', 'testharness.css');
        s.appendChild(link);
        assert_equals(d.styleSheets.length, 0, 'stylesheet link elements in shadow DOM must not be ' +
            'exposed via the document.styleSheets collection');

    }, ctx, A_04_01_11_T2));
});


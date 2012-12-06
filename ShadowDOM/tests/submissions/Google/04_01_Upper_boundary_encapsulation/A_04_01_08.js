/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_04_01_08 = {
    name:'A_04_01_08',
    assert:'Upper-boundary encapsulation:' +
        'The selectors must not cross the shadow boundary from the document' +
        'tree into the shadow DOM subtree',
    link:'http://www.w3.org/TR/shadow-dom/#upper-boundary-encapsulation',
    highlight:'The selectors must not cross the shadow boundary from the document ' +
        'tree into the shadow tree'
};

//check querySelector method
test(function () {
    var d = newHTMLDocument();
    var s = new SR(d.body);

    var e = d.createElement('span');
    e.setAttribute('id', 'span_id');
    e.setAttribute('class', 'span_class');
    s.appendChild(e);

    assert_equals(d.querySelector('span'), null, 'elements in shadow DOM must not be accessible via the ' +
        'document host\'s tag name selectors');

    assert_equals(d.querySelector('.span_class'), null, 'elements in shadow DOM must not be accessible via the ' +
        'document host\'s .className selectors');

    assert_equals(d.querySelector('#span_id'), null, 'elements in shadow DOM must not be accessible via the ' +
        'document host\'s #id selectors');

}, 'A_04_01_08_T01', PROPS(A_04_01_08, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));


//check querySelectorAll method
test(function () {
    var d = newHTMLDocument();
    var s = new SR(d.body);

    var e1 = d.createElement('span');
    e1.setAttribute('id', 'span_id');
    e1.setAttribute('class', 'span_class');
    s.appendChild(e1);

    var e2 = d.createElement('span');
    e2.setAttribute('id', 'span_id');
    e2.setAttribute('class', 'span_class');
    e1.appendChild(e2);

    assert_equals(d.querySelectorAll('span').length, 0, 'elements in shadow DOM must not be accessible via the ' +
        'document host\'s tag name selectors');

    assert_equals(d.querySelectorAll('.span_class').length, 0, 'elements in shadow DOM must not be accessible via the ' +
        'document host\'s .className selectors');

    assert_equals(d.querySelectorAll('#span_id').length, 0, 'elements in shadow DOM must not be accessible via the ' +
        'document host\'s #id selectors');

}, 'A_04_01_08_T02', PROPS(A_04_01_08, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:''
}));

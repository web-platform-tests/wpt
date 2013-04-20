/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_06_00_04 = {
    name:'A_06_00_04',
    assert:'Styles:' +
        'When the apply-author-styles is set, the selectors still must not cross the shadow ' +
        'boundary per scoping constraints',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#styles',
    highlight:'Even when the apply-author-styles is set, the selectors still must not cross ' +
    	'the shadow boundary per scoping constraints. In other words, with apply-author-styles ' +
    	'set, the document CSS rules only match wholly inside or outside of the shadow tree.'
};

//check querySelector method
test(unit(function (ctx) {
	var d = newRenderedHTMLDocument(ctx);
    var s = createSR(d.body);
    s.applyAuthorStyles = true;

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

}), 'A_06_00_04_T01', PROPS(A_06_00_04, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));


//check querySelectorAll method
test(unit(function (ctx) {
	var d = newRenderedHTMLDocument(ctx);
    var s = createSR(d.body);
    s.applyAuthorStyles = true;

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

}), 'A_06_00_04_T02', PROPS(A_06_00_04, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_04_02_01 = {
    name:'A_04_02_01',
    assert:'Lower-boundary encapsulation: ' +
        'The distribution does not affect the state of the document tree or shadow trees',
    link:'http://www.w3.org/TR/shadow-dom/#lower-boundary-encapsulation',
    highlight:'The distribution does not affect the state of the document tree or shadow trees'
};

var A_04_02_01_T1 = async_test('A_04_02_01_T01', PROPS(A_04_02_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

A_04_02_01_T1.step(function () {
    var ctx = newContext();
    var iframe = newIFrame(ctx, 'resources/bobs_page.html');
    iframe.onload = A_04_02_01_T1.step_func(step_unit(function () {
        var d = iframe.contentDocument;
        var ul = d.querySelector('ul.stories');
        var s = createSR(ul);

        //make shadow subtree
        var subdiv1 = document.createElement('div');
        subdiv1.setAttribute('class', 'breaking');
        subdiv1.innerHTML = '<ul><content select=".shadow"></content></ul>';
        s.appendChild(subdiv1);

        var subdiv2 = document.createElement('div');
        subdiv2.setAttribute('class', 'other');
        subdiv2.innerHTML = '<ul><content select=""></content></ul>';
        s.appendChild(subdiv2);

        var div = d.querySelector('#divid');

        //check DOM tree state
        assert_equals(div.className, 'breaking', 'Distribution should\'t change document ' +
            'DOM elements class name');
        assert_equals(div.children.length, 2, 'Distribution shouldn\'t change document ' +
            'DOM elements children');
        assert_equals(div.children[0].tagName, 'SPAN', 'Distribution shouldn\'t change document ' +
            'DOM elements children tag names');
        assert_equals(div.children[1].tagName, 'UL', 'Distribution shouldn\'t change document ' +
            'DOM elements children tag names');

        //check shadow subtree
        assert_equals(s.querySelector('div.breaking').children.length, 1,
            'Point 1: Distribution shouldn\'t change shadow DOM subtree elements children');
        assert_equals(s.querySelector('div.other').children.length, 1,
            'Point 2:Distribution shouldn\'t change shadow DOM subtree elements children');

        A_04_02_01_T1.done();

    }, ctx, A_04_02_01_T1));
});
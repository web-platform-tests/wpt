/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_04_03_01 = {
    name:'A_04_03_01',
    assert:'Matching Insertion Points: ' +
        'A valid selector fragment may contain a type selector',
    link:'http://www.w3.org/TR/shadow-dom/#matching-insertion-points',
    highlight: '[[A valid selector fragment may contain:]][\\s\\S]*[[A type selector]]'
};

var A_04_03_01_T1 = async_test('A_04_03_01_T01', PROPS(A_04_03_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));


A_04_03_01_T1.step(function () {
    var iframe = document.createElement('iframe');
    iframe.src = 'resources/bobs_page.html';
    document.body.appendChild(iframe);

    iframe.onload = A_04_03_01_T1.step_func(function () {
        try {
            var d = iframe.contentDocument;
            var div = d.querySelector('#divid');
            var s = createSR(div);

            //make shadow subtree
            var subdiv1 = document.createElement('div');
            subdiv1.innerHTML = '<content select="span"></content>';
            s.appendChild(subdiv1);

            //The order of DOM elements should be the following:
            // <ul class='stories'>, <span>. Invisible: <ul id="ul2">

            assert_true(d.querySelector('ul.stories').offsetTop < d.querySelector('#spandex').offsetTop,
                'A valid selector fragment may contain \'span\' type selector');

            assert_equals(d.querySelector('#ul2').offsetTop, 0,
                '<ul> element shouldn\'t match "span" type selector');
        } finally {
            iframe.parentNode.removeChild(iframe);
        }
        A_04_03_01_T1.done();
    });
});

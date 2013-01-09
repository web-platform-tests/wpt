/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_04_01_09 = {
    name:'A_04_01_09',
    assert:'Upper-boundary encapsulation: no nodes other than shadow root ' +
        'descendants are accessible with shadow root DOM tree accessor methods',
    link:'http://www.w3.org/TR/shadow-dom/#upper-boundary-encapsulation',
    highlight:'For convenience, the shadow root provides its own set of DOM tree accessor methods. ' +
        '[[No nodes other than shadow root descendants are accessible with these methods.]]'
};

A_04_01_09.setupBlock = function (ctx, prefix, root) {
    // create <div id='prefix+_id1' class='cls'><p class='cls'><div id='prefix+_id2' class='cls'></div></p></div> like structure
    // where <p> will be used as shadow host element

    ctx[prefix + '_div1'] = ctx.d.createElement('div');
    ctx[prefix + '_div1'].setAttribute('id', prefix + '_id1');
    ctx[prefix + '_div1'].setAttribute('class', 'cls');

    ctx[prefix + '_p1'] = ctx.d.createElement('p');
    ctx[prefix + '_p1'].setAttribute('class', 'cls');
    ctx[prefix + '_p1'].setAttribute('test', 'A_04_01_09');

    ctx[prefix + '_div2'] = ctx.d.createElement('div');
    ctx[prefix + '_div2'].setAttribute('id', prefix + '_id2');
    ctx[prefix + '_div2'].setAttribute('class', 'cls');
    ctx[prefix + '_div2'].setAttribute('test', 'A_04_01_09');

    root.appendChild(ctx[prefix + '_div1']);
    ctx[prefix + '_div1'].appendChild(ctx[prefix + '_p1']);
    ctx[prefix + '_p1'].appendChild(ctx[prefix + '_div2']);
};

A_04_01_09.setup = function () {
    var ctx = {};

    ctx.d = newHTMLDocument();
    A_04_01_09.setupBlock(ctx, 'd', ctx.d.body);

    ctx.s1 = createSR(ctx.d_p1);
    A_04_01_09.setupBlock(ctx, 's1', ctx.s1);

    ctx.s2 = createSR(ctx.s1_p1);
    A_04_01_09.setupBlock(ctx, 's2', ctx.s2);

    assert_true(ctx.d_div1 != null, 'setup:d_div1');
    assert_true(ctx.d_div2 != null, 'setup:d_div2');
    assert_true(ctx.s1_div1 != null, 'setup: s1_div1');
    assert_true(ctx.s1_div2 != null, 'setup: s1_div2');
    assert_true(ctx.s2_div1 != null, 'setup: s2_div1');
    assert_true(ctx.s2_div2 != null, 'setup: s2_div2');

    return ctx;
};

//check getElementsByTagName
test(function () {
    var ctx = A_04_01_09.setup();

    assert_nodelist_contents_equal_noorder(
        ctx.s1.getElementsByTagName('div'), [ctx.s1_div1, ctx.s1_div2],
        'nodes, other than shadow root descendants, should not be accessible with ' +
            'ShadowRoot.getElementsByTagName (s1)');

    assert_nodelist_contents_equal_noorder(
        ctx.s2.getElementsByTagName('div'), [ctx.s2_div1, ctx.s2_div2],
        'nodes, other than shadow root descendants, should not be accessible with ' +
            'ShadowRoot.getElementsByTagName (s2)');

}, 'A_04_01_09_T01', PROPS(A_04_01_09, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// getElementsByTagNameNS
test(function () {
    var ctx = A_04_01_09.setup();

    assert_nodelist_contents_equal_noorder(
        ctx.s1.getElementsByTagNameNS('*', 'div'), [ctx.s1_div1, ctx.s1_div2],
        'nodes, other than shadow root descendants, should not be accessible with ' +
            'ShadowRoot.getElementsByTagNameNS (s1)');

    assert_nodelist_contents_equal_noorder(
        ctx.s2.getElementsByTagNameNS('*', 'div'), [ctx.s2_div1, ctx.s2_div2],
        'nodes, other than shadow root descendants, should not be accessible with ' +
            'ShadowRoot.getElementsByTagNameNS (s2)');

}, 'A_04_01_09_T02', PROPS(A_04_01_09, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

//check getElementsByClassName
test(function () {
    var ctx = A_04_01_09.setup();

    assert_nodelist_contents_equal_noorder(
        ctx.s1.getElementsByClassName('cls'), [ctx.s1_div1, ctx.s1_p1, ctx.s1_div2],
        'nodes, other than shadow root descendants, should not be accessible with ' +
            'ShadowRoot.getElementsByClassName (s1)');

    assert_nodelist_contents_equal_noorder(
        ctx.s2.getElementsByClassName('cls'), [ctx.s2_div1, ctx.s2_p1, ctx.s2_div2],
        'nodes, other than shadow root descendants, should not be accessible with ' +
            'ShadowRoot.getElementsByClassName (s2)');

}, 'A_04_01_09_T03', PROPS(A_04_01_09, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// check getElementById
test(function () {
    var ctx = A_04_01_09.setup();

    assert_equals(ctx.s1.getElementById('d_id1'), null, 'Expected no access to d_div1 from s1.getElementById()');
    assert_equals(ctx.s1.getElementById('d_id2'), null, 'Expected no access to d_div2 from s1.getElementById()');
    assert_equals(ctx.s2.getElementById('d_id1'), null, 'Expected no access to d_div1 from s2.getElementById()');
    assert_equals(ctx.s2.getElementById('d_id2'), null, 'Expected no access to d_div1 from s2.getElementById()');


    assert_equals(ctx.s1.getElementById('s1_id1'), ctx.s1_div1, 'Expected access to s1_div1 form s1.getElementById()');
    assert_equals(ctx.s1.getElementById('s1_id2'), ctx.s1_div2, 'Expected access to s1_div2 form s1.getElementById()');
    assert_equals(ctx.s2.getElementById('s2_id1'), ctx.s2_div1, 'Expected access to s2_div1 form s2.getElementById()');
    assert_equals(ctx.s2.getElementById('s2_id2'), ctx.s2_div2, 'Expected access to s2_div2 form s2.getElementById()');


    assert_equals(ctx.s1.getElementById('s2_id1'), null, 'Expected no access to s2_div1 form s1.getElementById()');
    assert_equals(ctx.s1.getElementById('s2_id2'), null, 'Expected no access to s2_div2 form s1.getElementById()');
    assert_equals(ctx.s2.getElementById('s1_id1'), null, 'Expected no access to s1_div1 form s2.getElementById()');
    assert_equals(ctx.s2.getElementById('s1_id2'), null, 'Expected no access to s1_div2 form s2.getElementById()');

}, 'A_04_01_09_T04', PROPS(A_04_01_09, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));


// check querySelector for id
test(function () {
    var ctx = A_04_01_09.setup();

    assert_equals(ctx.d.querySelector('#s1_id1'), null, 'Expected no access to s1_div1 from d.querySelector()');
    assert_equals(ctx.d.querySelector('#s1_id2'), null, 'Expected no access to s1_div2 from d.querySelector()');
    assert_equals(ctx.d.querySelector('#s2_id1'), null, 'Expected no access to s2_div1 from d.querySelector()');
    assert_equals(ctx.d.querySelector('#s2_id2'), null, 'Expected no access to s2_div1 from d.querySelector()');

    assert_equals(ctx.s1.querySelector('#d_id1'), null, 'Expected no access to d_div1 from s1.querySelector()');
    assert_equals(ctx.s1.querySelector('#d_id2'), null, 'Expected no access to d_div2 from s1.querySelector()');
    assert_equals(ctx.s2.querySelector('#d_id1'), null, 'Expected no access to d_div1 from s2.querySelector()');
    assert_equals(ctx.s2.querySelector('#d_id2'), null, 'Expected no access to d_div1 from s2.querySelector()');

    assert_equals(ctx.d.querySelector('#d_id1'), ctx.d_div1, 'Expected access to d_div1 form d.querySelector()');
    assert_equals(ctx.d.querySelector('#d_id2'), ctx.d_div2, 'Expected access to d_div2 form d.querySelector()');
    assert_equals(ctx.s1.querySelector('#s1_id1'), ctx.s1_div1, 'Expected access to s1_div1 form s1.querySelector()');
    assert_equals(ctx.s1.querySelector('#s1_id2'), ctx.s1_div2, 'Expected access to s1_div2 form s1.querySelector()');
    assert_equals(ctx.s2.querySelector('#s2_id1'), ctx.s2_div1, 'Expected access to s2_div1 form s2.querySelector()');
    assert_equals(ctx.s2.querySelector('#s2_id2'), ctx.s2_div2, 'Expected access to s2_div2 form s2.querySelector()');

    assert_equals(ctx.s1.querySelector('#s2_id1'), null, 'Expected no access to s2_div1 form s1.querySelector()');
    assert_equals(ctx.s1.querySelector('#s2_id2'), null, 'Expected no access to s2_div2 form s1.querySelector()');
    assert_equals(ctx.s2.querySelector('#s1_id1'), null, 'Expected no access to s1_div1 form s2.querySelector()');
    assert_equals(ctx.s2.querySelector('#s1_id2'), null, 'Expected no access to s1_div2 form s2.querySelector()');

}, 'A_04_01_09_T05', PROPS(A_04_01_09, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));


//check querySelector for element
test(function () {
    var ctx = A_04_01_09.setup();

    assert_equals(ctx.d.querySelector('p'), ctx.d_p1, 'Expected access to d_p1 from d.querySelector()');
    assert_equals(ctx.s1.querySelector('p'), ctx.s1_p1, 'Expected access to s1_p1 from s1.querySelector()');
    assert_equals(ctx.s2.querySelector('p'), ctx.s2_p1, 'Expected access to s2_p1 from s2.querySelector()');

}, 'A_04_01_09_T06', PROPS(A_04_01_09, {
    author:'Aleksei Yu. Semenov <a.semenov@unipro.ru>',
    reviewer:''
}));

// check querySelectorAll for element
test(function () {
    var ctx = A_04_01_09.setup();

    assert_nodelist_contents_equal_noorder(ctx.d.querySelectorAll('p'), [ctx.d_p1], 'Expected access to d_p1 from d.querySelectorAll()');
    assert_nodelist_contents_equal_noorder(ctx.s1.querySelectorAll('p'), [ctx.s1_p1], 'Expected access to s1_p1 s1.querySelectorAll');
    assert_nodelist_contents_equal_noorder(ctx.s2.querySelectorAll('p'), [ctx.s2_p1], 'Expected access to s2_p1 from s2.querySelectorAll');

}, 'A_04_01_09_T07', PROPS(A_04_01_09, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

// check querySelectorAll for class
test(function () {
    var ctx = A_04_01_09.setup();

    assert_nodelist_contents_equal_noorder(ctx.d.querySelectorAll('.cls'), [ctx.d_div1, ctx.d_p1, ctx.d_div2], 'd.querySelectorAll() return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s1.querySelectorAll('.cls'), [ctx.s1_div1, ctx.s1_p1, ctx.s1_div2], 's1.querySelectorAll() return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s2.querySelectorAll('.cls'), [ctx.s2_div1, ctx.s2_p1, ctx.s2_div2], 's2.querySelectorAll() return wrong result');

}, 'A_04_01_09_T08', PROPS(A_04_01_09, {
    author:'Mikhail Fursov <mfursov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

//check querySelectorAll with whildcat
test(function () {
    var ctx = A_04_01_09.setup();

    //assert_nodelist_contents_equal_noorder(ctx.d.querySelectorAll('*'), [ctx.d_div1, ctx.d_p1, ctx.d_div2], 'd.querySelectorAll');
    assert_nodelist_contents_equal_noorder(ctx.s1.querySelectorAll('*'), [ctx.s1_div1, ctx.s1_p1, ctx.s1_div2], 's1.querySelectorAll(\'*\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s2.querySelectorAll('*'), [ctx.s2_div1, ctx.s2_p1, ctx.s2_div2], 's2.querySelectorAll(\'*\') return wrong result');

}, 'A_04_01_09_T09', PROPS(A_04_01_09, {
    author:'Aleksei Yu. Semenov <a.semenov@unipro.ru>',
    reviewer:''
}));

//check querySelectorAll with attribute value
test(function () {
    var ctx = A_04_01_09.setup();

    assert_nodelist_contents_equal_noorder(ctx.d.querySelectorAll('[test=A_04_01_09]'), [ctx.d_p1, ctx.d_div2], 'd.querySelectorAll(\'[test=A_04_01_09]\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s1.querySelectorAll('[test=A_04_01_09]'), [ctx.s1_p1, ctx.s1_div2], 's1.querySelectorAll(\'[test=A_04_01_09]\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s2.querySelectorAll('[test=A_04_01_09]'), [ctx.s2_p1, ctx.s2_div2], 's2.querySelectorAll(\'[test=A_04_01_09]\') return wrong result');

}, 'A_04_01_09_T10', PROPS(A_04_01_09, {
    author:'Aleksei Yu. Semenov <a.semenov@unipro.ru>',
    reviewer:''
}));

//check querySelectorAll with parent-child selection
test(function () {
    var ctx = A_04_01_09.setup();

    assert_nodelist_contents_equal_noorder(ctx.d.querySelectorAll('div:first-child'), [ctx.d_div1, ctx.d_div2], 'd.querySelectorAll(\'div:first-child\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s1.querySelectorAll('div:first-child'), [ctx.s1_div2], 's1.querySelectorAll(\'div:first-child\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s2.querySelectorAll('div:first-child'), [ctx.s2_div2], 's2.querySelectorAll(\'div:first-child\') return wrong result');

}, 'A_04_01_09_T11', PROPS(A_04_01_09, {
    author:'Aleksei Yu. Semenov <a.semenov@unipro.ru>',
    reviewer:''
}));

//check querySelectorAll with parent-child selection
test(function () {
    var ctx = A_04_01_09.setup();

    assert_nodelist_contents_equal_noorder(ctx.d.querySelectorAll('div:last-child'), [ctx.d_div2], 'd.querySelectorAll(\'div:last-child\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s1.querySelectorAll('div:last-child'), [ctx.s1_div2], 's1.querySelectorAll(\'div:last-child\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s2.querySelectorAll('div:last-child'), [ctx.s2_div2], 's2.querySelectorAll(\'div:last-child\') return wrong result');

}, 'A_04_01_09_T12', PROPS(A_04_01_09, {
    author:'Aleksei Yu. Semenov <a.semenov@unipro.ru>',
    reviewer:''
}));

//check querySelectorAll with parent-child selection
test(function () {
    var ctx = A_04_01_09.setup();

    assert_nodelist_contents_equal_noorder(ctx.d.querySelectorAll('p:only-child'), [ctx.d_p1], 'd.querySelectorAll(\'p:only-child\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s1.querySelectorAll('p:only-child'), [ctx.s1_p1], 's1.querySelectorAll(\'p:only-child\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s2.querySelectorAll('p:only-child'), [ctx.s2_p1], 's2.querySelectorAll(\'p:only-child\') return wrong result');

}, 'A_04_01_09_T13', PROPS(A_04_01_09, {
    author:'Aleksei Yu. Semenov <a.semenov@unipro.ru>',
    reviewer:''
}));

//check querySelectorAll with parent-child selection
test(function () {
    var ctx = A_04_01_09.setup();

    assert_nodelist_contents_equal_noorder(ctx.d.querySelectorAll('div:empty'), [ctx.d_div2], 'd.querySelectorAll(\'div:empty\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s1.querySelectorAll('div:empty'), [ctx.s1_div2], 's1.querySelectorAll(\'div:empty\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s2.querySelectorAll('div:empty'), [ctx.s2_div2], 's2.querySelectorAll(\'div:empty\') return wrong result');

}, 'A_04_01_09_T14', PROPS(A_04_01_09, {
    author:'Aleksei Yu. Semenov <a.semenov@unipro.ru>',
    reviewer:''
}));

//check querySelectorAll with parent-child selection
test(function () {
    var ctx = A_04_01_09.setup();

    assert_nodelist_contents_equal_noorder(ctx.d.querySelectorAll('p div'), [ctx.d_div2], 'd.querySelectorAll(\'p div\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s1.querySelectorAll('p div'), [ctx.s1_div2], 's1.querySelectorAll(\'p div\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s2.querySelectorAll('p div'), [ctx.s2_div2], 's2.querySelectorAll(\'p div\') return wrong result');

}, 'A_04_01_09_T15', PROPS(A_04_01_09, {
    author:'Aleksei Yu. Semenov <a.semenov@unipro.ru>',
    reviewer:''
}));

//check querySelectorAll with parent-child selection
test(function () {
    var ctx = A_04_01_09.setup();

    assert_nodelist_contents_equal_noorder(ctx.d.querySelectorAll('p > div'), [ctx.d_div2], 'd.querySelectorAll(\'p > div\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s1.querySelectorAll('p > div'), [ctx.s1_div2], 's1.querySelectorAll(\'p > div\') return wrong result');
    assert_nodelist_contents_equal_noorder(ctx.s2.querySelectorAll('p > div'), [ctx.s2_div2], 's2.querySelectorAll(\'p > div\') return wrong result');

}, 'A_04_01_09_T16', PROPS(A_04_01_09, {
    author:'Aleksei Yu. Semenov <a.semenov@unipro.ru>',
    reviewer:''
}));

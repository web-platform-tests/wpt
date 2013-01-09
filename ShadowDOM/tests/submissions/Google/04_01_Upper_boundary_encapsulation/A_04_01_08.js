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
        'Methods Document.querySelector and Document.querySelectorAll return only not shadowed elements',
    link:'http://www.w3.org/TR/shadow-dom/#upper-boundary-encapsulation',
    highlight:'The selectors must not cross the shadow boundary from the document ' +
        'tree into the shadow tree'
};

//check querySelector method
test(function () {
    var d = newHTMLDocument();
    var s = createSR(d.body);

    var e = d.createElement('span');
    e.setAttribute('id', 'span_id');
    e.setAttribute('class', 'span_class');
    d.body.appendChild(e);
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
    var s = createSR(d.body);

    var e1 = d.createElement('span');
    e1.setAttribute('id', 'span_id');
    e1.setAttribute('class', 'span_class');
    d.body.appendChild(e1);
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
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

//check querySelector method various selector patterns
test(function () {
    var d = newHTMLDocument();
    var divElement = d.createElement('div');
    d.body.appendChild(divElement);

    var s = createSR(divElement);

    var e1 = d.createElement('span');
    e1.setAttribute('id', 'span1_id');
    e1.setAttribute('class', 'span_class');
    e1.setAttribute('test', 'test');
    d.body.appendChild(e1);

    var e2 = d.createElement('span');
    e2.setAttribute('id', 'span2_id');
    e2.setAttribute('class', 'span_class');
    e1.setAttribute('test', 'test');
    d.body.appendChild(e2);

    s.appendChild(e2);

    assert_not_equals(d.querySelector('*'), e2, 'elements in shadow DOM must not be accessible via the ' +
    	'document host\'s \'*\' selector pattern');

    var data = ['span', e1,
                'span[test]', e1,
                'span[test=test]', e1,
                '[test]', e1,
                '[test=test]', e1,
                '[test~=test]', e1,
                '[test^=test]', e1,
                '[test$=test]', e1,
                '[test*=test]', e1,
//                'span:first-child', e1,
                'span:empty', e1,
				'.span_class', e1,
				'#span2_id', null,
				'div span', null,
				'div > span', null,
				'span + span', null
                ];
    var i;
    for (i=0; i<data.length; i+=2){
    	assert_equals(d.querySelector(data[i]), data[i+1],'elements in shadow DOM must not be accessible via the selector "'+data[i]+'"');
    }

}, 'A_04_01_08_T03', PROPS(A_04_01_08, {
    author:'Aleksei Yu. Semenov <a.semenov@unipro.ru>',
    reviewer:''
}));

//check querySelectorAll method various selector patterns
test(function () {
    var d = newHTMLDocument();
    var divElement = d.createElement('div');
    d.body.appendChild(divElement);

    var s = createSR(divElement);

    var e1 = d.createElement('span');
    e1.setAttribute('id', 'span1_id');
    e1.setAttribute('class', 'span_class');
    e1.setAttribute('test', 'test');
    d.body.appendChild(e1);

    var e2 = d.createElement('span');
    e2.setAttribute('id', 'span2_id');
    e2.setAttribute('class', 'span_class');
    e1.setAttribute('test', 'test');
    d.body.appendChild(e2);

    s.appendChild(e2);

    var data = ['*',
                'span',
                'span[test]',
                'span[test=test]',
                '[test]',
                '[test=test]',
                '[test~=test]',
                '[test^=test]',
                '[test$=test]',
                '[test*=test]',
                'span:first-child',
                'span:empty',
				'.span_class',
				'#span2_id',
				'div span',
				'div > span',
				'span + span'
                ];

    var selected;
    var i;
    var k;
    for (i=0; i<data.length; i++){
    	selected = d.querySelectorAll(data[i]);
    	for(k=0; k<selected.length; k++){
    		assert_not_equals(selected[k], e2,'elements in shadow DOM must not be accessible via the selector "'+data[i]+'"');
    	}
    }

}, 'A_04_01_08_T04', PROPS(A_04_01_08, {
    author:'Aleksei Yu. Semenov <a.semenov@unipro.ru>',
    reviewer:''
}));

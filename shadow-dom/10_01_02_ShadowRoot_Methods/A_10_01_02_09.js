/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_02_09 = {
    name:'A_10_01_02_09',
    assert:'ShadowRoot Object: ' +
    	'Invoking the cloneNode() method on a ShadowRoot instance must always ' +
    	'throw a DATA_CLONE_ERR exception.',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-methods',
    highlight: 'Invoking the cloneNode() method on a ShadowRoot instance must always ' +
    	'throw a DATA_CLONE_ERR exception.'
};

test(unit(function (ctx) {
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	d.body.appendChild(host);
	var s = createSR(host);
	
	try {
		s.cloneNode();
		assert_true(false, 'Invoking the cloneNode() method on a ShadowRoot instance must always ' +
    	'throw a DATA_CLONE_ERR exception.');
	} catch (e) {
		assert_equals(e.code, 25, 'Wrong exceprion type');
	}    
}), 'A_10_01_02_09_T01', PROPS(A_10_01_02_09, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_01_03_02 = {
    name:'A_10_01_01_03_02',
    assert:'ShadowRoot Object: ' +
    	'readonly attribute Element? activeElement; null value',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-attributes',
    highlight: '[[activeElement of type Element, readonly]][\\s\\S]*' + 
    	'[[Represents the currently focused element in the shadow tree.]][\\s\\S]*' +
    	'[[or null, if there is none.]]'
};


test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	host.setAttribute('id', 'shRoot');
	d.body.appendChild(host);
	var s = createSR(host);
    	
    assert_equals(s.activeElement, null, 'activeElement attribute of the ShadowRoot ' +
    		'must return null if there\'s no focused element');

}), 'A_10_01_01_03_02_T01', PROPS(A_10_01_01_03_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));


test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	host.setAttribute('id', 'shRoot');
	d.body.appendChild(host);
	var s = createSR(host);

	var inp = d.createElement('input');
	inp.setAttribute('type', 'text');
	inp.setAttribute('id', 'inpId');
	inp.setAttribute('value', 'Some text');
	d.body.appendChild(inp);
	
	inp.focus();
	
    assert_equals(s.activeElement, null, 'activeElement attribute of the ShadowRoot ' +
    		'must return null if there\'s no focused element in the shadow tree');

}), 'A_10_01_01_03_02_T02', PROPS(A_10_01_01_03_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));


test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	host.setAttribute('id', 'shRoot');
	d.body.appendChild(host);
	var s = createSR(host);

	var inp = d.createElement('input');
	inp.setAttribute('type', 'text');
	inp.setAttribute('id', 'inpId');
	inp.setAttribute('value', 'Some text');
	d.body.appendChild(inp);
	
	var inp2 = d.createElement('input');
	inp2.setAttribute('type', 'text');
	inp2.setAttribute('value', 'Some text 2');
	s.appendChild(inp2);
	
	inp.focus();
	
    assert_equals(s.activeElement, null, 'activeElement attribute of the ShadowRoot ' +
    		'must return null if there\'s no focused element in the shadow tree');

}), 'A_10_01_01_03_02_T02', PROPS(A_10_01_01_03_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

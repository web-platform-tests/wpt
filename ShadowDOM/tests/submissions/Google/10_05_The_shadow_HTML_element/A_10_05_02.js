/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_05_02 = {
    name:'A_10_05_02',
    assert:'The shadow HTML element: ' +
    	'shadow insertion point',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-element',
    highlight: '[[The shadow HTML element represents an shadow insertion point in a shadow tree.]]'
};

test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
		
	var host = d.createElement('div');
	d.body.appendChild(host);
	
	//old tree
	var s1 = createSR(host);
	s1.innerHTML = '<span id="sp1">This is an old tree</span>';
	//young tree
	var s2 = createSR(host);
	
	var div = d.createElement('div');	
	div.innerHTML = '' +
		'<span id="spandex">This is a shadow root content</span>' +
		'<shadow><span id="shadowId">This is a shadow fallback content</span></shadow>';
	s2.appendChild(div);
	
	assert_equals(s2.querySelector('#shadowId').offsetTop, 0, 'Fallback content should not be rendered');
	assert_true(s1.querySelector('#sp1').offsetTop > 0, 'Old tree should be rendered');
	assert_true(s2.querySelector('#spandex').offsetTop > 0, 'Element should be rendered');
    
}), 'A_10_05_02_T01', PROPS(A_10_05_02, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));

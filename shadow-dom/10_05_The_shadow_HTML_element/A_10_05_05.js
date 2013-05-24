/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_05_05 = {
    name:'A_10_05_05',
    assert:'The shadow HTML element: ' +
    	'olderShadowRoot attribute',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-element',
    highlight: '[[olderShadowRoot of type ShadowRoot]]' +
    	'[\\s\\S]*[[If TREE does not exist, return null]]',
    bug: ['https://bugs.webkit.org/show_bug.cgi?id=105269']
};


test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	d.body.appendChild(host);
	
	//Shadow root to play with
	var s = createSR(host);
	
	var div = d.createElement('div');	
	div.innerHTML = '' +
		'<span id="spandex">This is a shadow root content</span>' +
		'<shadow><span id="shadowId">This is a shadow fallback content</span></shadow>';
	s.appendChild(div);
	
	assert_equals(s.querySelector('#shadowId').olderShadowRoot, null, 'If shadow tree does not exist, ' +
			'return null');
    
}), 'A_10_05_05_T01', PROPS(A_10_05_05, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


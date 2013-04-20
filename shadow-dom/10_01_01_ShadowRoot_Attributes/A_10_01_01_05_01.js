/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_01_05_01 = {
    name:'A_10_01_01_05_01',
    assert:'ShadowRoot Object: ' +
    	'styleSheets of type StyleSheetList, readonly',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-attributes',
    highlight: '[[styleSheets of type StyleSheetList, readonly]][\\s\\S]*' + 
    	'[[Represents the shadow root style sheets.]][\\s\\S]*' +
    	'[[On getting, the attribute must return a StyleSheetList sequence containing ' +
    	'the shadow root style sheets.]]',
    bug: ['https://bugs.webkit.org/show_bug.cgi?id=103393']
};


test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	d.body.appendChild(host);
	var s = createSR(host);
	
	assert_true(s.styleSheets != null, 'ShadowRoot styleSheets attribute shouldn\'t be null');
    assert_equals(s.styleSheets.length, '0', 'attribute must return the shadow root style sheets only');

}), 'A_10_01_01_05_01_T01', PROPS(A_10_01_01_05_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));


test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	d.body.appendChild(host);
	var s = createSR(host);
	
	var style = d.createElement('style');
	s.appendChild(style);

	assert_true(s.styleSheets != null, 'ShadowRoot styleSheets attribute shouldn\'t be null');
    assert_equals(s.styleSheets.length, '1', 'attribute must return the shadow root style sheets');

}), 'A_10_01_01_05_01_T02', PROPS(A_10_01_01_05_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

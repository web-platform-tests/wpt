/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_01_04_01 = {
    name:'A_10_01_01_04_01',
    assert:'ShadowRoot Object: ' +
    	'innerHTML of type DOMString; Test getter',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-attributes',
    highlight: '[[innerHTML of type DOMString]][\\s\\S]*' + 
    	'[[represents the markup of ShadowRoot\'s contents.]][\\s\\S]*' +
    	'[[On getting, the attribute must return the result of running the HTML fragment serialization ' +
    	'algorithm with the context object as shadow host.]]'
};


test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	d.body.appendChild(host);
	var s = createSR(host);
	
	var span = d.createElement('span');
	span.innerHTML = 'Some text';
	s.appendChild(span);
    	
    assert_equals(s.innerHTML.toLowerCase(), '<span>some text</span>', 
    		'Wrong value of ShadowRoot innerHTML attribute');

}), 'A_10_01_01_04_01_T01', PROPS(A_10_01_01_04_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

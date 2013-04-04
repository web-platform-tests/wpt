/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_01_06 = {
    name:'A_10_01_01_06',
    assert:'ShadowRoot Object: ' +
    	'The nodeType attribute of a ShadowRoot instance must return DOCUMENT_FRAGMENT_NODE',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-attributes',
    highlight: 'The nodeType attribute of a ShadowRoot instance must return DOCUMENT_FRAGMENT_NODE'
};


test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	d.body.appendChild(host);
	var s = createSR(host);
	
    assert_equals(s.nodeType, 11, 'The nodeType attribute of a ShadowRoot ' +
    		'instance must return DOCUMENT_FRAGMENT_NODE');

}), 'A_10_01_01_06_T01', PROPS(A_10_01_01_06, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));


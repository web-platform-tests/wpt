/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_01_07 = {
    name:'A_10_01_01_07',
    assert:'ShadowRoot Object: ' +
    	'The nodeName attribute of a ShadowRoot instance must return "#document-fragment".',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-attributes',
    highlight: 'Accordingly, the nodeName attribute of a ShadowRoot instance must return "#document-fragment".',
    bug: ['https://bugs.webkit.org/show_bug.cgi?id=104995']
};


test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	d.body.appendChild(host);
	var s = createSR(host);
	
    assert_equals(s.nodeName, '#document-fragment', 'The nodeName attribute of a ShadowRoot instance ' +
    		'must return "#document-fragment".');

}), 'A_10_01_01_07_T01', PROPS(A_10_01_01_07, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));


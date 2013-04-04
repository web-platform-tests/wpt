/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_03_01_02 = {
    name:'A_10_03_01_02',
    assert:'CSSHostRule Interface: ' +
    	'cssRules of type CSSRuleList',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#css-host-rule-attributes',
    highlight: '[[The HOST_RULE type is added to CSSRule interface.]]' +
    	'[\\s\\S]*[[const unsigned short HOST_RULE = 1001;]]',
    bug: ['https://bugs.webkit.org/show_bug.cgi?id=103393', ]
};


test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
    var host = d.createElement('div');
    d.body.appendChild(host);
    
	var s = createSR(host);
	
	var style = d.createElement('style');
    style.innerHTML = '' + 
			'span { color: blue; }' +
			'@host {' +
			'div { color: red; }' +
			'}';
	d.head.appendChild(style);
	
	assert_equals(d.styleSheets[0].cssRules[1].type, 1001,	'Wrong cssRule type');	
    
}), 'A_10_03_01_02_T01', PROPS(A_10_03_01_02, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));
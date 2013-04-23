/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_02_01_06 = {
    name:'A_10_02_01_06',
    assert:'Extensions to Element Interface: ' +
    	'shadowRoot of type ShadowRoot',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-aware-attributes',
    highlight: '[[shadowRoot of type ShadowRoot]]' +
    	'[\\s\\S]*[[null if no such shadow tree is accesible.]]'
};

test(function () {
	
	var d = newHTMLDocument();
	    
    var host = d.createElement('div');
    d.body.appendChild(host);
    
    assert_equals(host.shadowRoot, null, 'attribute shadowRoot must return null if no shadow tree is accesible');
    
    
}, 'A_10_02_01_06_T01', PROPS(A_10_02_01_06, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));

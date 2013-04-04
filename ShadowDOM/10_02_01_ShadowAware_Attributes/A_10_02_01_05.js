/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_02_01_05 = {
    name:'A_10_02_01_05',
    assert:'Extensions to Element Interface: ' +
    	'shadowRoot of type ShadowRoot',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-aware-attributes',
    highlight: '[[shadowRoot of type ShadowRoot]]' +
    	'[\\s\\S]*[[Represents the top shadow tree in the "as rendered" structure.]]' +
    	'[\\s\\S]*[[On getting, the attribute must return the youngest tree that has ' +
    	'the context object as its shadow host]]'
};

test(function () {
	
	var d = newHTMLDocument();
	    
    var host = d.createElement('div');
    d.body.appendChild(host);
    
    //old tree
    var s1 = createSR(host);
    //young tree
    var s2 = createSR(host)
    
    assert_equals(host.shadowRoot, s2, 'attribute shadowRoot must return the youngest tree that has ' +
        	'the context object as its shadow host');
    
    
}, 'A_10_02_01_05_T01', PROPS(A_10_02_01_05, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));

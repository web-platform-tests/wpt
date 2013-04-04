/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_02_02_01 = {
    name:'A_10_02_02_01',
    assert:'Extensions to Element Interface: ' +
    	'createShadowRoot method creates new instance of Shadow root object',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-aware-methods',
    highlight: '[[createShadowRoot]]' +
    	'[\\s\\S]*[[Create a new instance of the ShadowRoot object]]',
    bug:['https://bugs.webkit.org/show_bug.cgi?id=105385']
};

test(function () {
	
	var d = newHTMLDocument();
	    
    var host = d.createElement('div');
    d.body.appendChild(host);
    
    var s = host.createShadowRoot();
    
    assert_true(s instanceof ShadowRoot, 'createShadowRoot() method should create new instance ' +
    		'of ShadowRoot object');
    
}, 'A_10_02_02_01_T01', PROPS(A_10_02_02_01, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


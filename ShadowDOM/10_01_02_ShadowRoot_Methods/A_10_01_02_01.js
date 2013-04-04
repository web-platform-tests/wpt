/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_02_01 = {
    name:'A_10_01_02_01',
    assert:'ShadowRoot Object: ' +
    	'HTMLElement getElementById(DOMString elementId) method',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-methods',
    highlight: '[[getElementById]]' +
    	'[\\s\\S]*[[Must behave exactly like document.getElementById, except scoped to the shadow tree.]]'
};

test(function () {
	
	var d = newHTMLDocument();
	
    var el = d.createElement('div');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    var child = d.createElement('span');
    child.setAttribute('id', 'span_id');
    s.appendChild(child);

    assert_true(s.getElementById('span_id') != null, 'Point 1: ShadowRoot getElementById() ' +
    		'method should return child element');
    assert_equals(s.getElementById('span_id').getAttribute('id'), 'span_id', 'Point 2: ' +
    		'ShadowRoot getElementById() method should return child element');
        
}, 'A_10_01_02_01_T01', PROPS(A_10_01_02_01, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));



test(function () {
	
	var d = newHTMLDocument();
	
    var el = d.createElement('div');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    assert_true(s.getElementById('span_id') == null, ' ShadowRoot getElementById() ' +
    		'method should return null if matching element not found');
        
}, 'A_10_01_02_01_T02', PROPS(A_10_01_02_01, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));

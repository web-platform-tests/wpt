/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_02_06_02 = {
    name:'A_10_01_02_06_02',
    assert:'ShadowRoot Object: ' +
    	'Element? elementFromPoint(float x, float y) method',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-methods',
    highlight: '[[elementFromPoint]]' +
    	'[\\s\\S]*[[If either argument is negative]][\\s\\S]*[[return null.]]',
    bug: ['https://bugs.webkit.org/show_bug.cgi?id=104579']
};

test(function () {
	
	var d = newHTMLDocument();
	
    var el = d.createElement('div');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    var span = d.createElement('span');
    span.innerHTML = 'Some text';
    s.appendChild(span);
    
    assert_equals(s.elementFromPoint(-1, 1), null, 'If x argument of elementFromPoint(x, y) is less ' +
    		'than zero then method shold return null');
    
}, 'A_10_01_02_06_02_T01', PROPS(A_10_01_02_06_02, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


test(function () {
	
	var d = newHTMLDocument();
	
    var el = d.createElement('div');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    var span = d.createElement('span');
    span.innerHTML = 'Some text';
    s.appendChild(span);
    
    assert_equals(s.elementFromPoint(1, -1), null, 'If y argument of elementFromPoint(x, y) is less ' +
    		'than zero then method shold return null');
    
}, 'A_10_01_02_06_02_T02', PROPS(A_10_01_02_06_02, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));
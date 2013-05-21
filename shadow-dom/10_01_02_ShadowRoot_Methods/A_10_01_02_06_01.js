/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_02_06_01 = {
    name:'A_10_01_02_06_01',
    assert:'ShadowRoot Object: ' +
    	'Element? elementFromPoint(float x, float y) method',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-methods',
    highlight: '[[elementFromPoint]]' +
    	'[\\s\\S]*[[If context object is not a ShadowRoot instance, throw a TypeMismatchError.]]'
};

test(function () {
	
	var d = newHTMLDocument();
	
    var el = d.createElement('div');
    d.body.appendChild(el);
    
    try {
    	el.elementFromPoint(1, 1);
    	assert_true(false, 'TypeMismatchError should be thrown');
    } catch(e) {
    	assert_true(e instanceof TypeError, 'Wrong error type');
    }
        
}, 'A_10_01_02_06_01_T01', PROPS(A_10_01_02_06_01, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_02_08_01 = {
    name:'A_10_01_02_08_01',
    assert:'ShadowRoot Object: ' +
    	'CSSStyleSheet removeStyleSheet(CSSStyleSheet styleSheet) method',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-methods',
    highlight: '[[removeStyleSheet]]' +
    	'[\\s\\S]*[[Removes a style sheet, added with addStyleSheet.]][\\s\\S]*[[Otherwise, ' +
    	'throw a NoModificationAllowedError exception.]]',
    bug: ['https://bugs.webkit.org/show_bug.cgi?id=93923']
};

test(function () {
	
	var d = newHTMLDocument();
	
    var el = d.createElement('div');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    var link = d.createElement('link');
    
    try {
    	s.removeStyleSheet(link);
    	assert_true(false, 'NoModificationAllowedError should be thrown');
    } catch(e) {
    	//FIXME Check the expected error type
    	assert_true(e instanceof SyntaxError, 'Wrong error type');
    }

}, 'A_10_01_02_08_01_T01', PROPS(A_10_01_02_08_01, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


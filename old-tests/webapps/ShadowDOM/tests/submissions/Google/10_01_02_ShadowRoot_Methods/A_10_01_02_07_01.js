/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_02_07_01 = {
    name:'A_10_01_02_07_01',
    assert:'ShadowRoot Object: ' +
    	'CSSStyleSheet addStyleSheet(HTMLElement element) method',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-methods',
    highlight: '[[addStyleSheet]]' +
    	'[\\s\\S]*[[If the parameter is an HTMLLinkElement:]][\\s\\S]*[[Follow requirements for implementing ' +
    	'the HTTP link header with the exception that the newly created style sheet must be appended ' +
    	'to the shadow root style sheets, not document style sheets]][\\s\\S]*[[Return the newly created ' +
    	'style sheet object.]]',
    bug: ['https://bugs.webkit.org/show_bug.cgi?id=93923']
};

test(function () {
	
	var d = newHTMLDocument();
	
    var el = d.createElement('div');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    var link = d.createElement('link');
    var retVal = s.addStyleSheet(link);
    
    assert_true(retVal != null, 'addStyleSheet() method must return newly created style sheet object');
        
}, 'A_10_01_02_07_01_T01', PROPS(A_10_01_02_07_01, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


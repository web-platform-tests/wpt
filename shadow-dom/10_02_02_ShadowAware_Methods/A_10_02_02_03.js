/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_02_02_03 = {
    name:'A_10_02_02_03',
    assert:'Extensions to Element Interface: ' +
    	'createShadowRoot method',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-aware-methods',
    highlight: '[[createShadowRoot]]' +
    	'[\\s\\S]*[[Add the ShadowRoot object at the top of the tree stack of its host]]'
};

test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	    
    var host = d.createElement('div');
    d.body.appendChild(host);
    
    var span = d.createElement('span');
    span.setAttribute('id', 'sp0');
    span.innerHTML = 'Some text';
    host.appendChild(span);
    
    //old tree
    var s1 = host.createShadowRoot();
    s1.innerHTML = '<span id="sp1">Span 1</span>';
    //young tree
    var s2 = host.createShadowRoot();
    s2.innerHTML = '<span id="sp2">Span 2</span>';
    
    // span should become invisible as shadow root content
    assert_equals(span.offsetTop, 0, 'Point 1:createShadowRoot() method should add ' +
    		'the ShadowRoot object at the top of the tree stack of its host');
    assert_equals(s1.querySelector('#sp1').offsetTop, 0, 'Point 2:createShadowRoot() method should add ' +
		'the ShadowRoot object at the top of the tree stack of its host');
    assert_true(s2.querySelector('#sp2').offsetTop > 0, 'Point 3:createShadowRoot() method should add ' +
		'the ShadowRoot object at the top of the tree stack of its host');
    
    
}), 'A_10_02_02_03_T01', PROPS(A_10_02_02_03, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


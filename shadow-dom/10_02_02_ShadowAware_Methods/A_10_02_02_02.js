/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_02_02_02 = {
    name:'A_10_02_02_02',
    assert:'Extensions to Element Interface: ' +
    	'createShadowRoot method',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-aware-methods',
    highlight: '[[createShadowRoot]]' +
    	'[\\s\\S]*[[Establish the context object as the shadow host of the ShadowRoot object]]'
};

test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	    
    var host = d.createElement('div');
    d.body.appendChild(host);
    
    var span = d.createElement('span');
    span.innerHTML = 'Some text';
    host.appendChild(span);
    
    var s = host.createShadowRoot();
    
    // span should become invisible as shadow root content
    assert_equals(span.offsetTop, 0, 'createShadowRoot() method should establish ' +
    		'the context object as the shadow host of the ShadowRoot object');
    
}), 'A_10_02_02_02_T01', PROPS(A_10_02_02_02, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_01_02_03 = {
    name:'A_10_01_01_02_03',
    assert:'ShadowRoot Object: ' +
    	'attribute bool resetStyleInheritance attribute. Test setter and getter',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-attributes',
    highlight: '[[resetStyleInheritance of type bool]]' +
    	'[\\s\\S]*[[On getting, the attribute must return the current value of the reset-style-inheritance ' +
    	'flag for the shadow host\'s tree]][\\s\\S]*[[On setting, the attribute must set the value of ' +
    	'the reset-style-inheritance flag for the shadow host\'s tree to specified value]]'
};


test(unit(function (ctx) {
	
    var d = newRenderedHTMLDocument(ctx);
    
    var host = d.createElement('div');
    d.body.appendChild(host);

	var s = createSR(host);
	s.resetStyleInheritance = true;
	
	assert_equals(s.resetStyleInheritance, true, 'attribute must return the current value of the ' +
			'reset-style-inheritance flag');

}), 'A_10_01_01_02_03_T01', PROPS(A_10_01_01_02_03, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));


test(unit(function (ctx) {
	
    var d = newRenderedHTMLDocument(ctx);
    
    var host = d.createElement('div');
    d.body.appendChild(host);

	var s = createSR(host);
	s.resetStyleInheritance = false;
	
	assert_equals(s.resetStyleInheritance, false, 'attribute must return the current value of the ' +
			'reset-style-inheritance flag');

}), 'A_10_01_01_02_03_T02', PROPS(A_10_01_01_02_03, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

test(unit(function (ctx) {
	
    var d = newRenderedHTMLDocument(ctx);
    
    var host = d.createElement('div');
    d.body.appendChild(host);

	var s = createSR(host);
	s.resetStyleInheritance = true;
	
	assert_equals(s.resetStyleInheritance, true, 'attribute must return the current value of the ' +
			'reset-style-inheritance flag');

	s.resetStyleInheritance = false;
	
	assert_equals(s.resetStyleInheritance, false, 'attribute must change the value of the ' +
			'reset-style-inheritance flag');
	
}), 'A_10_01_01_02_03_T03', PROPS(A_10_01_01_02_03, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));


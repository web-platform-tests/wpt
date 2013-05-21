/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_01_04_02 = {
    name:'A_10_01_01_04_02',
    assert:'ShadowRoot Object: ' +
    	'innerHTML of type DOMString; Test setter',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-attributes',
    highlight: '[[innerHTML of type DOMString]][\\s\\S]*' + 
    	'[[represents the markup of ShadowRoot\'s contents.]][\\s\\S]*' +
    	'[[On setting, these steps must be run]][\\s\\S]*' +
    	'[[Replace all with FRAGMENT within the shadow root.]]'
};


test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	d.body.appendChild(host);
	var s = createSR(host);
	
	var span = d.createElement('span');
	span.innerHTML = 'Some text';
	s.appendChild(span);
	
	s.innerHTML = '<input type="text"><div>new text</div>';
    	
    assert_equals(s.innerHTML.toLowerCase(), '<input type="text"><div>new text</div>', 
    		'Wrong value of ShadowRoot innerHTML attribute');

}), 'A_10_01_01_04_02_T01', PROPS(A_10_01_01_04_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));


test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	d.body.appendChild(host);
	var s = createSR(host);
	
	var span = d.createElement('span');
	span.setAttribute('id', 'spanId');
	span.innerHTML = 'Some text';
	s.appendChild(span);
	
	s.innerHTML = '<input type="text" id="inputId"><div id="divId">new text</div>';
    	
    assert_equals(s.querySelector('#spanId'), null, 'Point 1:innerHTML attribute must replace all content of ' +
    		'the ShadowRoot object');
    
    assert_true(s.querySelector('#inputId') != null, 'Point 2:innerHTML attribute must replace all content of ' +
    	'the ShadowRoot object');
    assert_equals(s.querySelector('#inputId').getAttribute('id'), 'inputId', 
    		'Point 3:innerHTML attribute must replace all content of the ShadowRoot object');

    assert_true(s.querySelector('#divId') != null, 'Point 3:innerHTML attribute must replace all content of ' +
		'the ShadowRoot object');
	assert_equals(s.querySelector('#divId').getAttribute('id'), 'divId', 
		'Point 4:innerHTML attribute must replace all content of the ShadowRoot object');
}), 'A_10_01_01_04_02_T01', PROPS(A_10_01_01_04_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

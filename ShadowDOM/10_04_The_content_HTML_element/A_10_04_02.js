/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_04_02 = {
    name:'A_10_04_02',
    assert:'The content HTML element: ' +
    	'select attribute',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#content-element',
    highlight: '[[select, a set of comma-separated tokens]]' +
    	'[\\s\\S]*[[defines the matching criteria for distributing child nodes of the shadow host. ' +
    	'Each token must be a valid selector fragment.]]'
};

test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	d.body.innerHTML = 
		'<ul class="cls">' +
			'<li id="li1" class="shadow">1</li>' +
			'<li id="li2" class="shadow2">2</li>' +
			'<li id="li3" class="shadow">3</li>' +
			'<li id="li4">4</li>' +
			'<li id="li5" class="shadow">5</li>' +
			'<li id="li6" class="shadow2">6</li>' +
		'</ul>';
	
	var host = d.querySelector('.cls');
	//Shadow root to play with
	var s = createSR(host);
	
	var div = d.createElement('div');	
	div.innerHTML = '' +
		'<ul><content select=".shadow"><span id="spandex">This is fallback content</span></content></ul>'; 
	s.appendChild(div);
	
	assert_equals(s.querySelector('#spandex').offsetTop, 0, 'Fallback content should not be rendered');
	
	assert_equals(d.querySelector('#li2').offsetTop, 0, 'Point 1: Element should not be rendered');
	assert_equals(d.querySelector('#li4').offsetTop, 0, 'Point 2: Element should not be rendered');
	assert_equals(d.querySelector('#li6').offsetTop, 0, 'Point 3: Element should not be rendered');
    
	assert_true(d.querySelector('#li1').offsetTop > 0, 'Point 11: Element should be rendered');
	assert_true(d.querySelector('#li3').offsetTop > 0, 'Point 12: Element should be rendered');
	assert_true(d.querySelector('#li5').offsetTop > 0, 'Point 13: Element should be rendered');
	
}), 'A_10_04_02_T01', PROPS(A_10_04_02, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));



test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	d.body.innerHTML = 
		'<ul class="cls">' +
			'<li id="li1" class="shadow">1</li>' +
			'<li id="li2" class="shadow2">2</li>' +
			'<li id="li3" class="shadow">3</li>' +
			'<li id="li4">4</li>' +
			'<li id="li5" class="shadow">5</li>' +
			'<li id="li6" class="shadow2">6</li>' +
		'</ul>';
	
	var host = d.querySelector('.cls');
	//Shadow root to play with
	var s = createSR(host);
	
	var div = d.createElement('div');	
	div.innerHTML = '' +
		'<ul><content select=".shadow, #li4"><span id="spandex">This is fallback content</span></content></ul>'; 
	s.appendChild(div);
	
	assert_equals(s.querySelector('#spandex').offsetTop, 0, 'Fallback content should not be rendered');
	
	assert_equals(d.querySelector('#li2').offsetTop, 0, 'Point 1: Element should not be rendered');	
	assert_equals(d.querySelector('#li6').offsetTop, 0, 'Point 2: Element should not be rendered');
    
	assert_true(d.querySelector('#li1').offsetTop > 0, 'Point 11: Element should be rendered');
	assert_true(d.querySelector('#li3').offsetTop > 0, 'Point 12: Element should be rendered');
	assert_true(d.querySelector('#li5').offsetTop > 0, 'Point 13: Element should be rendered');
	assert_true(d.querySelector('#li4').offsetTop > 0, 'Point 14: Element should be rendered');
	
}), 'A_10_04_02_T01', PROPS(A_10_04_02, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));

/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/


// The some of the tests below fails. 
// See https://bugs.webkit.org/show_bug.cgi?id=103608

var A_06_03_01 = {
    name:'A_06_03_01',
    assert:'@host @-rule: ' +
        'The declarations of the rules in a @host @-rule must only be matched against ' +
        'the shadow host of the shadow tree in which the style is specified',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#host-at-rule',
    highlight:'The declarations of the rules in a @host @-rule must only be matched against ' +
    	'the shadow host of the shadow tree in which the style is specified'
};

//TODO (sgrekhov) Check the expected result at https://www.w3.org/Bugs/Public/show_bug.cgi?id=20150
test(unit(function (ctx) {
	var d = newRenderedHTMLDocument(ctx);
    
    d.head.innerHTML = '' + 
			'@host {' +
				'div {display:none;}' +
			'}';

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
		'<div id="shDiv"><span>Div in the Shadow tree</span></div>' +
		'<ul><content select=".shadow"></content></ul>'; 
	s.appendChild(div);
	
	assert_true(s.querySelector('#shDiv').offsetTop > 0,
		'Point 1: element should be rendered');	
	assert_true(d.querySelector('#li1').offsetTop > 0,
		'Point 2: element should be rendered');
	assert_true(d.querySelector('#li3').offsetTop > 0,
		'Point 3: element should be rendered');
	assert_true(d.querySelector('#li5').offsetTop > 0,
		'Point 4: element should be rendered');

	
}), 'A_06_03_01_T01', PROPS(A_06_03_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));


//Test fails. See https://bugs.webkit.org/show_bug.cgi?id=103608
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
		'<div id="shDiv"><span>Div in the Shadow tree</span></div>' +
		'<ul><content select=".shadow"></content></ul>'; 
	s.appendChild(div);
	
	var style = d.createElement('style');
    style.innerHTML = '' + 
			'@host {' +
				'div{display:none;}' +
			'}';
	s.appendChild(style);
	
	assert_equals(s.querySelector('#shDiv').offsetTop, 0,
		'Point 1: element should not be rendered');	
	assert_equals(d.querySelector('#li1').offsetTop, 0,
		'Point 2: element should not be rendered');
	assert_equals(d.querySelector('#li3').offsetTop, 0,
		'Point 3: element should not be rendered');
	assert_equals(d.querySelector('#li5').offsetTop, 0,
		'Point 4: element should not be rendered');


}), 'A_06_03_01_T02', PROPS(A_06_03_01, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


//Test fails. See https://bugs.webkit.org/show_bug.cgi?id=103608
test(unit(function (ctx) {
	var d = newRenderedHTMLDocument(ctx);

    var host = d.createElement('div');
    d.body.appendChild(host);

	//Older tree
	var s1 = createSR(host);
	var div1 = d.createElement('div');
	div1.innerHTML = '<span id="shd1">This is an old shadow tree</span>'; 
	s1.appendChild(div1);
	
	//Younger tree
	var s2 = createSR(host);
	var div1 = d.createElement('div');
	div1.innerHTML = '<div><span id="shd2">This is a young shadow tree</span></div>' + 
		'<shadow><span id="shd3">This is the shadow tree fallback content</span></shadow>'; 
	s2.appendChild(div1);
	
	var style = d.createElement('style');
    style.innerHTML = '' + 
			'@host {' +
				'div{display:none;}' +
			'}';
	s2.appendChild(style);
	
	assert_equals(s2.querySelector('#shd2').offsetTop, 0,
		'Element should not be rendered');
	assert_true(s1.querySelector('#shd1').offsetTop > 0,
		'Element should not be rendered');
	
}), 'A_06_03_01_T03', PROPS(A_06_03_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));
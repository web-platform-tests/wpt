/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_06_00_07 = {
    name:'A_06_00_07',
    assert:'Styles:' +
        'Rules that contain select reference combinators match elements in the enclosing trees',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#styles',
    highlight:'Rules that contain select reference combinators match elements in the enclosing trees'
};

//Reference combinators are not implemented yet, so the test shouldn't work for now
//See the progress at  http://wkb.ug/82169
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
    	'</ul>' +
    	'<div id="sr">' +
    	'</div>';

	var host = d.querySelector('#sr');
	
	//Shadow root to play with
	var s = createSR(host);
	
	var style = d.createElement('style');
	style.innerHTML ='ul.cls/select/li.shadow {display:none}'; 
	s.appendChild(style);
	
	var span = d.createElement('span');
	span.setAttribute('id', 'theShadowSpan');
	span.setAttribute('class', 'invis');
	s.appendChild(span);
	
	//li1, li3 and li5 should be invisible
	assert_equals(d.querySelector('#li1').offsetTop, 0,
		'Point 1: Rules that contain select reference combinators should match elements ' +
		'in the enclosing trees');
	assert_equals(d.querySelector('#li3').offsetTop, 0,
		'Point 2: Rules that contain select reference combinators should match elements ' +
		'in the enclosing trees');
	assert_equals(d.querySelector('#li5').offsetTop, 0,
		'Point 3: Rules that contain select reference combinators should match elements ' +
		'in the enclosing trees');
	
}), 'A_06_00_07_T01', PROPS(A_06_00_07, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));
/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_07_03_01 = {
    name:'A_07_03_01',
    assert:'User Interaction: ' +
        'each shadow root must also have an activeElement property to store the value of the focused ' +
        'element in the shadow tree.',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#active-element',
    highlight: 'To prevent loss of information when adjusting this value, each shadow root must also ' +
    	'have an activeElement property to store the value of the focused element in the shadow tree.'
};


test(unit(function (ctx) {
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	d.body.appendChild(host);
	var s = createSR(host);
    
	var inp = d.createElement('input');
	inp.setAttribute('type', 'text');
	inp.setAttribute('id', 'inpId');
	inp.setAttribute('value', 'Some text');
	s.appendChild(inp);
	
	inp.focus();
	
    assert_equals(s.activeElement.tagName, 'INPUT', 'Point 1:activeElement property of shadow root ' +
    		'must return the value of the focused element in the shadow tree');
    assert_equals(s.activeElement.getAttribute('id'), 'inpId', 'Point 2:activeElement property of shadow root ' +
    	'must return the value of the focused element in the shadow tree');
	
}), 'A_07_03_01_T01', PROPS(A_07_03_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

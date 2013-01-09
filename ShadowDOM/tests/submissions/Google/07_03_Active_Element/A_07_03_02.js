/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_07_03_02 = {
    name:'A_07_03_02',
    assert:'User Interaction: ' +
        'Document\'s activeElement property must be adjusted',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#active-element',
    highlight: 'To maintain upper-boundary encapsulation, the value of the Document object\'s focus ' +
    	'API property activeElement must be adjusted.'
};


test(unit(function (ctx) {
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	host.setAttribute('id', 'shRoot');
	d.body.appendChild(host);
	var s = createSR(host);
    
	var inp = d.createElement('input');
	inp.setAttribute('type', 'text');
	inp.setAttribute('id', 'inpId');
	inp.setAttribute('value', 'Some text');
	s.appendChild(inp);
	
	inp.focus();
	
    assert_equals(d.activeElement.tagName, 'DIV', 'Point 1: document\'s activeElement property  ' +
    		'must return adjusted the value of the focused element in the shadow tree');
    assert_equals(d.activeElement.getAttribute('id'), 'shRoot', 'Point 2: document\'s activeElement property  ' +
    		'must return adjusted the value of the focused element in the shadow tree');
	
}), 'A_07_03_02_T01', PROPS(A_07_03_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

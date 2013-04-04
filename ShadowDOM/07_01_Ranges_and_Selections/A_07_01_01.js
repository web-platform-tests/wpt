/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_07_01_01 = {
    name:'A_07_01_01',
    assert:'User Interaction: ' +
        'Selection, returned by the window.getSelection() method must never return a selection ' +
        'within a shadow tree',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#ranges-and-selection',
    highlight: 'To maintain upper boundary encapsulation, the selection, returned by the ' +
    	'window.getSelection() method must never return a selection within a shadow tree.'
};


test(unit(function (ctx) {
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	d.body.appendChild(host);
	var s = createSR(host);
    
	var span = d.createElement('span');
	span.innerHTML = 'Some text';
	s.appendChild(span);
	
	var range = d.createRange();
	range.setStart(span.firstChild, 0);
	range.setEnd(span.firstChild, 3);
	
	var selection = window.getSelection();                 
    selection.removeAllRanges();                       
    selection.addRange(range); 	
    
    var sl = window.getSelection();
    assert_equals(sl.toString(), '', 'window.getSelection() method must never return a selection ' +
    		'within a shadow tree');
	
}), 'A_07_07_01_T01', PROPS(A_07_01_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));


// test distributed nodes
test(unit(function (ctx) {
	var d = newRenderedHTMLDocument(ctx);
	
	var host = d.createElement('div');
	d.body.appendChild(host);
    
	var span = d.createElement('span');
	span.innerHTML = 'Some text';
	host.appendChild(span);
	
	var s = createSR(host);
	s.innerHTML = '<content select="span"></content>';
	
	var range = d.createRange();
	range.setStart(span.firstChild, 0);
	range.setEnd(span.firstChild, 3);
	
	var selection = window.getSelection();                 
    selection.removeAllRanges();                       
    selection.addRange(range); 	
    
    var sl = window.getSelection();
    assert_equals(sl.toString(), '', 'window.getSelection() method must never return a selection ' +
    	'within a shadow tree');
	
}), 'A_07_07_01_T02', PROPS(A_07_01_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

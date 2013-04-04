/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_02_04 = {
    name:'A_10_01_02_04',
    assert:'ShadowRoot Object: ' +
    	'Selection? getSelection() method',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-methods',
    highlight: '[[getSelection]]' +
    	'[\\s\\S]*[[When invoked, it must return the selection in the shadow host\'s tree.]]'
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
    
    var sl = s.getSelection();
    assert_equals(sl.toString(), 'Som', 'The getSelection() method of the shadow root object must return ' +
    		'the current selection in this shadow tree');
	
}), 'A_10_01_02_04_T01', PROPS(A_10_01_02_04, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

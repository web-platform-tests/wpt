/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_09_00_02 = {
    name:'A_09_00_02',
    assert:'HTML Elements and Their Shadow Trees: ' +
    	'Elements that have no fallback content should allow the shadow tree to contain ' +
    	'no insertion points or an insertion point that matches nothing',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#html-elements-and-their-shadow-trees',
    highlight: 'Otherwise, contains no insertion points or an insertion point that matches nothing.',
    bug: ['https://bugs.webkit.org/show_bug.cgi?id=102864']
};

//test img
test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);		
	
	// create element
    var el = d.createElement('img');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    s.innerHTML = '<content id="cont" select="#shadow"></content>';

    assert_true(s.querySelector('#cont') != null, 'img should allow one insertion point ' +
    		'that matches nothing');
        
}), 'A_09_00_02_T01', PROPS(A_09_00_02, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


//test embed
test(unit(function (ctx) {
		
	var d = newRenderedHTMLDocument(ctx);		
	
	// create element
    var el = d.createElement('embed');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    s.innerHTML = '<content id="cont" select="#shadow"></content>';

    assert_true(s.querySelector('#cont') != null, 'embed should allow one insertion point ' +
    		'that matches nothing');
        
}), 'A_09_00_02_T02', PROPS(A_09_00_02, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


//test embed
test(unit(function (ctx) {
		
	var d = newRenderedHTMLDocument(ctx);		
	
	// create element
    var el = d.createElement('input');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    s.innerHTML = '<content id="cont" select="#shadow"></content>';

    assert_true(s.querySelector('#cont') != null, 'input should allow one insertion point ' +
    		'that matches nothing');
        
}), 'A_09_00_02_T03', PROPS(A_09_00_02, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));

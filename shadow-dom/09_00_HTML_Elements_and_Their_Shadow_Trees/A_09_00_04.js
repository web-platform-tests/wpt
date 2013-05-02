/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_09_00_04 = {
    name:'A_09_00_04',
    assert:'HTML Elements and Their Shadow Trees: ' +
    	'Check that details can contain at least two insertion points with matching criteria ' +
    	'\'summary:first-of-type\' and \'universal selector\'',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#html-elements-and-their-shadow-trees',
    highlight: '[[Contains two insertion points with the following matching criteria:]]' +
    	'[\\s\\S]*[[summary:first-of-type]]' +
    	'[\\s\\S]*[[universal selector]]'
};

//test universal selector
test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	// create element
    var el = d.createElement('details');
    el.setAttribute('open', 'open');
    d.body.appendChild(el);
    
    el.innerHTML = '' + 
    	'<span id="shadow">This is a node that should be distributed</span>' +
    	'<span id="flbk">This is a fallback content</span>';
    
    var s = createSR(el);
    s.innerHTML = '<content select="#shadow"></content>';

    assert_true(d.querySelector('#shadow').offsetTop > 0, '\'details\' should allow at least one insertion point');
    assert_equals(d.querySelector('#flbk').offsetTop, 0, 'Fallback content shouldn\'t be rendered');
        
}), 'A_09_00_04_T01', PROPS(A_09_00_04, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));



//test summary:first-of-type
test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	
	// create element
    var el = d.createElement('details');
    el.setAttribute('open', 'open');
    d.body.appendChild(el);
        
    el.innerHTML = '' +
    	'<summary>' +
    	'<span id="shadow">This is a node that should be distributed</span>' +
    	'</summary>' +
    	'<span id="flbk">Unlucky content</span>';
    
    var s = createSR(el);
    s.innerHTML = '<content select="summary:first-of-type"></content>';

    assert_true(d.querySelector('#shadow').offsetTop > 0, 'details should allow insertion point' +
    		'with summary:first-of-type matching criteria');
    assert_equals(d.querySelector('#flbk').offsetTop, 0, 'Fallback content shouldn\'t be rendered');
        
}), 'A_09_00_04_T02', PROPS(A_09_00_04, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));

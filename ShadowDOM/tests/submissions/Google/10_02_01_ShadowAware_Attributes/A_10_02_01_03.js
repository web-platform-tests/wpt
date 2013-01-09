/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_02_01_03 = {
    name:'A_10_02_01_03',
    assert:'Extensions to Element Interface: ' +
    	'pseudo of type DOMString attribute; Test setter',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-aware-attributes',
    highlight: '[[pseudo of type DOMString]]' +
    	'[\\s\\S]*[[If the custom pseudo-element, associated with this element already exists, discard it]]'
};

test(unit(function (ctx) {
	
	var d = newRenderedHTMLDocument(ctx);
	    
    var style = d.createElement('style');
    style.innerHTML = 'span {' +
    	'font-size: 10px;' +
    	'}';
    d.head.appendChild(style);
    
    var widget = d.createElement('div');
    d.body.appendChild(widget);
    
    var s = createSR(widget);
    
    var thumb = d.createElement('span');
    thumb.innerHTML = 'This is a pseudo-element';
   
    thumb.pseudo = 'x-thumb';
    s.appendChild(thumb);
    
    var height = thumb.offsetHeight;
    
    assert_true(height > 0, 'Element should be rendered');
    
    style = d.createElement('style');
    style.innerHTML = 'div::x-thumb {' +
    	'font-size: 30px;' +
    	'}';
    d.body.appendChild(style);
    
    assert_true(thumb.offsetHeight > height, 'Pseudo-element style should be applied');
    thumb.pseudo = 'x-thumb2';
    
    assert_equals(thumb.offsetHeight, height, 'Pseudo-element style should be discarded by new setter');
    
}), 'A_10_02_01_03_T01', PROPS(A_10_02_01_03, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


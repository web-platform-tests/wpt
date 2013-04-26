/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_04_10_01 = {
    name:'A_04_10_01',
    assert:'Custom Pseudo-Elements: test valid pseudo-element',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#custom-pseudo-elements',
    highlight:'The custom pseudo-element value must be considered valid if it starts with ' +
    	'a U+0078 LATIN SMALL LETTER X, followed by  U+002D HYPHEN-MINUS.',
    bug: ['https://bugs.webkit.org/show_bug.cgi?id=103973']
};


// Test fails. See https://bugs.webkit.org/show_bug.cgi?id=103973
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
    //FIXME test works if prefixed version of API used. 
    //In other words works if webkitPseudo property is used
    //thumb.webkitPseudo = 'x-thumb';
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
	
}), 'A_04_10_01_T01', PROPS(A_04_10_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

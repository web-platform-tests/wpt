/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_02_03 = {
    name:'A_10_01_02_03',
    assert:'ShadowRoot Object: ' +
    	'NodeList getElementsByTagNameNS(DOMString? namespace, DOMString localName) method',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-methods',
    highlight: '[[getElementsByTagNameNS]]' +
    	'[\\s\\S]*[[Must behave exactly like document.getElementsByTagNameNS, except scoped to the shadow tree.]]'
};

test(function () {
	
	var d = newHTMLDocument();
	
    var el = d.createElement('div');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    assert_equals(s.getElementsByTagNameNS('*', 'div').length, 0, 'ShadowRoot getElementsByTagNameNS() ' +
    		'method should return empty list if there\'s no matching child elements');
        
}, 'A_10_01_02_03_T01', PROPS(A_10_01_02_03, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));



test(function () {
	
	var d = newHTMLDocument();
	
    var el = d.createElement('div');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    var child = d.createElement('span');
    s.appendChild(child);

    assert_equals(s.getElementsByTagNameNS('*','span').length, 1, 'ShadowRoot getElementsByTagNameNS() ' +
    		'method should return matching child element');
        
}, 'A_10_01_02_03_T02', PROPS(A_10_01_02_03, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


test(function () {
	
	var d = newHTMLDocument();
	
    var el = d.createElement('div');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    var child = d.createElement('span');
    s.appendChild(child);

    var child2 = d.createElement('span');
    s.appendChild(child2);
    
    assert_equals(s.getElementsByTagNameNS('*', 'span').length, 2, 'ShadowRoot getElementsByTagNameNS() ' +
    		'method should return matching child elements');
        
}, 'A_10_01_02_03_T03', PROPS(A_10_01_02_03, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


test(function () {
	
	var d = newHTMLDocument();
	
    var el = d.createElement('div');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    assert_equals(s.getElementsByTagNameNS('http://www.w3c.org/namespace', 'div').length, 0, 
    		'ShadowRoot getElementsByTagNameNS() method should return empty list if there\'s no ' +
    		'matching child elements');
        
}, 'A_10_01_02_03_T04', PROPS(A_10_01_02_03, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));



test(function () {
	
	var d = newHTMLDocument();
	
    var el = d.createElement('div');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    var child = d.createElementNS('http://www.w3c.org/namespace','span');
    s.appendChild(child);

    assert_equals(s.getElementsByTagNameNS('http://www.w3c.org/namespace','span').length, 1, 
    		'ShadowRoot getElementsByTagNameNS() method should return matching child element');
        
}, 'A_10_01_02_03_T05', PROPS(A_10_01_02_03, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


test(function () {
	
	var d = newHTMLDocument();
	
    var el = d.createElement('div');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    var child = d.createElementNS('http://www.w3c.org/namespace','span');
    s.appendChild(child);

    var child2 = d.createElementNS('http://www.w3c.org/namespace','span');
    s.appendChild(child2);
    
    assert_equals(s.getElementsByTagNameNS('http://www.w3c.org/namespace', 'span').length, 2, 
    		'ShadowRoot getElementsByTagNameNS() method should return matching child elements');
        
}, 'A_10_01_02_03_T06', PROPS(A_10_01_02_03, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


test(function () {
	
	var d = newHTMLDocument();
	
    var el = d.createElement('div');
    d.body.appendChild(el);
    
    var s = createSR(el);
    
    var child = d.createElement('span');
    s.appendChild(child);

    assert_equals(s.getElementsByTagNameNS('http://www.w3c.org/namespace','span').length, 0, 
    		'ShadowRoot getElementsByTagNameNS() method should return element from wrong namespace');
        
}, 'A_10_01_02_03_T07', PROPS(A_10_01_02_03, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));

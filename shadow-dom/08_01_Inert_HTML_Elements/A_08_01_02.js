/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_08_01_02 = {
    name:'A_08_01_02',
    assert:'HTML Elements in shadow trees: ' +
    	'link element must behave as inert not as part of the document tree',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#inert-html-elements',
    highlight: '[[A subset of HTML elements must behave as inert, or not part of the document tree.]]' +
    	'[\\s\\S]*[[link]]'
};


test(unit(function (ctx) {

	var d = newRenderedHTMLDocument(ctx);
	
	var link = d.createElement('link');
	link.setAttribute('href', 'testharness.css');
	link.setAttribute('rel', 'stylesheet');
	
	//create Shadow root
	var root = d.createElement('div');
	d.body.appendChild(root);    
	var s = createSR(root);
	
	s.appendChild(link);
	
	assert_equals(d.styleSheets.length, 0, 'link element must behave as inert not as part of the document tree');       


}), 'A_08_01_02_T01', PROPS(A_08_01_02, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));
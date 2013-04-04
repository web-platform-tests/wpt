/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_08_01_01 = {
    name:'A_08_01_01',
    assert:'HTML Elements in shadow trees: ' +
    	'base element must behave as inert, or not part of the document tree',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#inert-html-elements',
    highlight: '[[A subset of HTML elements must behave as inert, or not part of the document tree.]]' +
    	'[\\s\\S]*[[base]]'
};


var A_08_01_01_T01 = async_test('A_08_01_01_T01', PROPS(A_08_01_01, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));

A_08_01_01_T01.checkIframeContent = A_08_01_01_T01.step_func(function () {
	//remember value to check before cleaning the context (it'll destroy the iframe)
	var valueToCheck = A_08_01_01_T01.iframe.contentWindow;		
	cleanContext(A_08_01_01_T01.ctx);
		
	assert_equals(valueToCheck, null, 
		'base html element ih a shadow tree must beahve like inert one');
		
	A_08_01_01_T01.done();
});


A_08_01_01_T01.step(function () {
	
	A_08_01_01_T01.ctx = newContext(); 
    var d = newRenderedHTMLDocument(A_08_01_01_T01.ctx);
                
    //create iframe
    var iframe = document.createElement('iframe');
    
    iframe.src = 'resources/blank.html';
    iframe.setAttribute('name', 'targetIframe');
    d.body.appendChild(iframe);
    
    A_08_01_01_T01.iframe = iframe;
            
    // create a link
    var link = d.createElement('a');
    link.setAttribute('href', 'resources/bobs_page.html');
    link.innerHTML = 'the link';
    d.body.appendChild(link);
    
    //create Shadow root
    var root = d.createElement('div');
    d.body.appendChild(root);    
    var s = createSR(root);

    // create base element, set iframe as a target
    var base = d.createElement('base');
    base.setAttribute('target', 'targetIframe');
    s.appendChild(base);
    
    //click the link
    link.click();
            
    //Expected: base should be inert therefore document d 
    // should be reloaded, so iframe context shouldn't be affected
	
    // set timeout to give the iframe time to load content
    setTimeout('A_08_01_01_T01.checkIframeContent()', 2000);
});

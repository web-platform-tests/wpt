/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_08_02_03 = {
    name:'A_08_02_03',
    assert:'HTML Elements in shadow trees: ' +
    	'form should submit elements in shadow tree',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#inert-html-elements',
    highlight: 'the form submission must continue to work as specified.',
    bug: ['https://www.w3.org/Bugs/Public/show_bug.cgi?id=20320']
};


var A_08_02_03_T01 = async_test('A_08_02_03_T01', PROPS(A_08_02_03, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));

A_08_02_03_T01.checkIframeContent = A_08_02_03_T01.step_func(function () {
	//remember value to check before cleaning the context (it'll destroy the iframe)
	var valueToCheck = A_08_02_03_T01.iframe.contentWindow.document.URL;		
	cleanContext(A_08_02_03_T01.ctx);
	
	assert_true(valueToCheck.indexOf('inp1=value1') > 0, 
		'html form should submit all of its fields');
	
	// Expected behavior is not quite clear. See https://www.w3.org/Bugs/Public/show_bug.cgi?id=20320
	assert_true(valueToCheck.indexOf('inp2=value2') > 0, 
		'html form should submit all of its fields including the shadow ones');
	
	A_08_02_03_T01.done();
});


A_08_02_03_T01.step(function () {
	
	A_08_02_03_T01.ctx = newContext(); 
    var d = newRenderedHTMLDocument(A_08_02_03_T01.ctx);
                
    //create iframe
    var iframe = document.createElement('iframe');
    
    iframe.src = 'resources/blank.html';
    iframe.setAttribute('name', 'targetIframe');
    d.body.appendChild(iframe);
    
    A_08_02_03_T01.iframe = iframe;
            
    // create form
    var form = d.createElement('form');
    form.setAttribute('target', 'targetIframe');
    form.setAttribute('method', 'GET');
    form.setAttribute('action', 'resources/blank.html');
    d.body.appendChild(form);
    
    //create Shadow root
    var root = d.createElement('div');
    form.appendChild(root);    
    var s = createSR(root);
        

    var input1 = d.createElement('input');
    input1.setAttribute('type', 'text');
    input1.setAttribute('name', 'inp1');
    input1.setAttribute('value', 'value1');
    form.appendChild(input1);
    
    var input2 = d.createElement('input');
    input2.setAttribute('type', 'text');
    input2.setAttribute('name', 'inp2');
    input2.setAttribute('value', 'value2');
    s.appendChild(input2);
    
    //submit the form
    form.submit();
            	
    // set timeout to give the iframe time to load content
    setTimeout('A_08_02_03_T01.checkIframeContent()', 2000);
});

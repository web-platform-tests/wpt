/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/


var A_06_00_11 = {
    name:'A_06_00_11',
    assert:'Styles:' +
        'the styles of the shadow insertion point node are inherited by the child nodes of ' +
        'the shadow root of the shadow tree, distributed to this shadow insertion point',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#styles',
    highlight:'the styles of the shadow insertion point node are inherited by the child nodes of ' +
    	'the shadow root of the shadow tree, distributed to this shadow insertion point'
};


// Test fails. See https://bugs.webkit.org/show_bug.cgi?id=103625
test(unit(function (ctx) {
	var d = newRenderedHTMLDocument(ctx);
    
    var host = d.createElement('div');
    d.body.appendChild(host);

	//Old tree
	var s1 = createSR(host);
	
	var div1 = d.createElement('div');
	div1.setAttribute('style', 'font-size: 10px');
	div1.innerHTML = '<span id="shd1">This is an old shadow tree</span>'; 
	s1.appendChild(div1);
	
	var height1 = s1.querySelector('#shd1').offsetHeight;
	
	assert_true(height1 > 0, 'Element height should be greater than zero');
	
	//younger tree
	var s2 = createSR(host);	
	var div2 = d.createElement('div');
	div2.innerHTML =  '<shadow style="font-size:20px"></shadow>'; 
	s2.appendChild(div2);
	
	assert_true(s1.querySelector('#shd1').offsetHeight > height1,
		'Shadow insertion point style must be aplied to the child nodes of ' +
    	'the shadow host that are assigned to this insertion point');	
}), 'A_06_00_11_T01', PROPS(A_06_00_11, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));




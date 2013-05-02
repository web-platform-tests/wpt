/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/


var A_06_00_10 = {
    name:'A_06_00_10',
    assert:'Styles:' +
        'the styles of the insertion point nodes are inherited by those child nodes of ' +
        'the shadow host that are assigned to this insertion point',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#styles',
    highlight:'the styles of the insertion point nodes are inherited by those child nodes of ' +
    	'the shadow host that are assigned to this insertion point'
};


test(unit(function (ctx) {
	var d = newRenderedHTMLDocument(ctx);
    
    d.body.innerHTML = 
    	'<ul class="cls" style="font-size: 10px">' +
    		'<li id="li1" class="shadow">1</li>' +
    		'<li id="li2" class="shadow2">2</li>' +
    		'<li id="li3" class="shadow">3</li>' +
    		'<li id="li4">4</li>' +
    		'<li id="li5" class="shadow">5</li>' +
    		'<li id="li6" class="shadow2">6</li>' +
    	'</ul>';

    
	var height1 = d.querySelector('#li1').offsetHeight;
	var height2 = d.querySelector('#li2').offsetHeight;
	var height3 = d.querySelector('#li3').offsetHeight;
	var height4 = d.querySelector('#li4').offsetHeight;
	var height5 = d.querySelector('#li5').offsetHeight;
	var height6 = d.querySelector('#li6').offsetHeight;
	
	assert_true(height1 > 0, 'Point 1: Element height should be greater than zero');
	assert_true(height2 > 0, 'Point 2: Element height should be greater than zero');
	assert_true(height3 > 0, 'Point 3: Element height should be greater than zero');
	assert_true(height4 > 0, 'Point 4: Element height should be greater than zero');
	assert_true(height5 > 0, 'Point 5: Element height should be greater than zero');
	assert_true(height6 > 0, 'Point 6: Element height should be greater than zero');
    
    var host = d.querySelector('.cls');
	//Shadow root to play with
    var s = createSR(host);

	var div = d.createElement('div');	
	div.innerHTML ='<ul><content select=".shadow" style="font-size:20px"></content></ul>'; 
	s.appendChild(div);
	
	
	host.setAttribute('style', 'font-size: 20px');
	
	assert_true(d.querySelector('#li1').offsetHeight > height1,
		'Point 11: Insertion point style must be aplied to the node distributed into this point');
	assert_true(d.querySelector('#li3').offsetHeight > height3,
		'Point 12: Insertion point style must be aplied to the node distributed into this point');
	assert_true(d.querySelector('#li5').offsetHeight > height5,
		'Point 13: Insertion point style must be aplied to the node distributed into this point');
	
}), 'A_06_00_10_T01', PROPS(A_06_00_10, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));




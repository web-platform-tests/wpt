/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_05_01_03 = {
    name:'A_05_01_03',
    assert:'Event Retargeting:' +
		'Event retargeting for fallback content',
    link:'http://www.w3.org/TR/shadow-dom/#event-retargeting',
    highlight:'A relative target is a node that most accurately represents the target of ' +
    	'a dispatched event at a given ancestor while maintaining the upper boundary encapsulation'
};


var A_05_01_03_T01 = async_test('A_05_01_03_T01', PROPS(A_05_01_03, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

A_05_01_03_T01.step(unit(function (ctx) {
	var d = newRenderedHTMLDocument(ctx);
	
    d.body.innerHTML = '' +
	'<div id="main">' +
		'<div id="shadow-root">' +
			'<span>1</span>' +
			'<span>2</span>' +
			'<span>3</span>' +
	    '</div>' +
	'</div>';	
	
    var ul = d.querySelector('#shadow-root');
    var s = createSR(ul);
  
    //make shadow subtree
    var div = document.createElement('div');
    div.innerHTML = '<content select=".shadow"><span id="flbk">Fallback item</span></content>';
    s.appendChild(div);
	  
	d.body.addEventListener('click', A_05_01_03_T01.step_func(function (event) {
        assert_equals(event.target.getAttribute('id'), 'shadow-root', 'Information about ' +
        		'event target crossing the shadow boundaries should be adjusted for the fallback ' +
        		'content');
    }), false);
	
    var event = d.createEvent('HTMLEvents');
    event.initEvent ("click", true, false);
    s.querySelector('#flbk').dispatchEvent(event);
    
	A_05_01_03_T01.done();
}));

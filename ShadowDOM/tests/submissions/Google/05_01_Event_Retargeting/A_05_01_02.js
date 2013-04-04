/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_05_01_02 = {
    name:'A_05_01_02',
    assert:'Event Retargeting:' +
		'Event retargeting for document nodes distributed among insertion points',
    link:'http://www.w3.org/TR/shadow-dom/#event-retargeting',
    highlight:'A relative target is a node that most accurately represents the target of ' +
    	'a dispatched event at a given ancestor while maintaining the upper boundary encapsulation'
};


var A_05_01_02_T1 = async_test('A_05_01_02_T1', PROPS(A_05_01_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

A_05_01_02_T1.step(function () {
    var iframe = document.createElement('iframe');
    iframe.src = 'resources/bobs_page.html';
    document.body.appendChild(iframe);
    
    iframe.onload = A_05_01_02_T1.step_func(function () {
    
    try {    	
    	var d = iframe.contentDocument;
    	
        var ul = d.querySelector('ul.stories');
        var s = createSR(ul);
	  
        //make shadow subtree
        var div = document.createElement('div');
        div.innerHTML = '<ul id="ip_wrapper"><content select=".shadow"></content></ul>';
        s.appendChild(div);
    	  
    	d.body.addEventListener('click', A_05_01_02_T1.step_func(function (event) {
            assert_equals(event.target.tagName, 'UL', 'Information about event target crossing ' +
            		'the shadow boundaries should be adjusted for document nodes distributed' +
            		'among insertion points');
        }), false);
    	
        var event = d.createEvent('HTMLEvents');
        event.initEvent ("click", true, false);
        d.querySelector('#li3').dispatchEvent(event);		  
    } finally {
        iframe.parentNode.removeChild(iframe);
    }
    A_05_01_02_T1.done();
    });
});

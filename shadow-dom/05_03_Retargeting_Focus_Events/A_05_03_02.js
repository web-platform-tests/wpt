/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_05_03_02 = {
    name:'A_05_03_02',
    assert:'Retargeting focus events:' +
		'The blur event must be treated in the same way ' +
		'as events with a relatedTarget, where the node that is gaining focus causing ' +
		'the blurring of target acts as the related target',
    highlight:'The focus, DOMFocusIn, [[blur]], and DOMFocusOut [[events must be treated in the same ' +
    	'way as events with a relatedTarget, where the corresponding node that is losing focus as ' +
    	'a result of target gaining focus or the node that is gaining focus, and thus causing ' +
    	'the blurring of target acts as the related target]]'
};


//test blur event
var A_05_03_02_T01 = async_test('A_05_03_02_T01', PROPS(A_05_03_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));


A_05_03_02_T01.step(unit(function (ctx) {	
	
    var d = newRenderedHTMLDocument(ctx);
    
    var invoked = false;
    
    var roots = createTestMediaPlayer(d);
    
    roots.playerShadowRoot.querySelector('.volume-slider').focus();
    
    //expected result of what relative target should be see
    //see at http://www.w3.org/TR/shadow-dom/#event-retargeting-example
    
    //For #volume-slider relative target is #volume-slider
    roots.playerShadowRoot.querySelector('.volume-slider').addEventListener('blur', 
    		A_05_03_02_T01.step_func(function(event) {
    			invoked = true;
		    	assert_equals(event.target.getAttribute('id'), 'volume-slider', 
		    			'Wrong target');
	    }), false);
        
    // move focus out of shadow tree. blur should be fired
    d.querySelector('#outside-control').focus();
    
    assert_true(invoked, 'Event listener was not invoked');
    
    A_05_03_02_T01.done();
}));


//TODO (sgrekhov) add test for the case when related target differs from the 
//node on which event listener is invoked
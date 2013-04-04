/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_05_01_01 = {
    name:'A_05_01_01',
    assert:'Event Retargeting:' +
		'test that event.target is retargeted when event crosses shadow boundary and vice versa',
    link:'http://www.w3.org/TR/shadow-dom/#event-retargeting',
    highlight:'In the cases where events cross the shadow boundaries, the event\'s information about the target ' +
    	'of the event is adjusted in order to maintain upper boundary encapsulation'
};



var A_05_01_01_T1 = async_test('A_05_01_01_T1', PROPS(A_05_01_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

A_05_01_01_T1.step(function () {
    var iframe = document.createElement('iframe');
    iframe.src = 'resources/blank.html';
    document.body.appendChild(iframe);
    
    iframe.onload = A_05_01_01_T1.step_func(function () {
    
    try {
    	var d = iframe.contentDocument;
    	var div = d.createElement('div');
    	d.body.appendChild(div);
    	
    	var s = createSR(div);
	  
    	var div2 = d.createElement('div');
    	s.appendChild(div2);
    	
    	var inp = d.createElement('input');
    	inp.setAttribute('type', 'text');
    	inp.setAttribute('id', 'inpid');	  
    	div2.appendChild(inp);	  	  
	  
    	div2.addEventListener('click', A_05_01_01_T1.step_func(function (event) {
            assert_equals(event.target.tagName, 'INPUT', 'Information about target of the event that ' +
            		'doesn\'t cross the shadow boundaries should not be adjusted');      		
        }), false);
    	
        var event = d.createEvent('HTMLEvents');
        event.initEvent ("click", true, false);
        inp.dispatchEvent(event);		  
    } finally {
        iframe.parentNode.removeChild(iframe);
    }
    A_05_01_01_T1.done();
    });
});



var A_05_01_01_T2 = async_test('A_05_01_01_T2', PROPS(A_05_01_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:''
}));

A_05_01_01_T2.step(function () {
    var iframe = document.createElement('iframe');
    iframe.src = 'resources/blank.html';
    document.body.appendChild(iframe);
    
    iframe.onload = A_05_01_01_T2.step_func(function () {
    
    try {
    	var d = iframe.contentDocument;
    	
    	var div = d.createElement('div');
    	d.body.appendChild(div);
    	
    	var s = createSR(div);
	  
    	var div2 = d.createElement('div');
    	s.appendChild(div2);
    	
    	var inp = d.createElement('input');
    	inp.setAttribute('type', 'text');
    	inp.setAttribute('id', 'inpid');	  
    	div2.appendChild(inp);	  	  
	  
    	div.addEventListener('click', A_05_01_01_T2.step_func(function (event) {
            assert_equals(event.target.tagName, 'DIV', 'Information about event target crossing ' +
            		'the shadow boundaries should be adjusted');      		
        }), false);
    	
        var event = d.createEvent('HTMLEvents');
        event.initEvent ("click", true, false);
        inp.dispatchEvent(event);		  
    } finally {
        iframe.parentNode.removeChild(iframe);
    }
    A_05_01_01_T2.done();
    });
});




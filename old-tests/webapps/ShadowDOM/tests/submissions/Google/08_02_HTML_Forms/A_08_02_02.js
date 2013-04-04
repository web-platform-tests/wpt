/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_08_02_02 = {
    name:'A_08_02_02',
    assert:'HTML Elements in shadow trees: ' +
    	'Form elements and form-associated elements in shadow tree must be accessible using shadow ' +
    	'tree accessors',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#html-forms',
    highlight: 'Instead, each shadow tree must scope its form elements and form-associated elements.'
};

//test form-associated elements
test(function () {
	var d = newHTMLDocument();

    var form = d.createElement('form');
    form.setAttribute('id', 'form_id');
    d.body.appendChild(form);

    var div = d.createElement('div');
    d.body.appendChild(div);
    var s = createSR(div);


    HTML5_FORM_ASSOCIATED_ELEMENTS.forEach(function (tagName) {

        var el = d.createElement(tagName);
        el.setAttribute('form', 'form_id');
        el.setAttribute('id', tagName + '_id');
        s.appendChild(el);

        assert_true(s.querySelector('#' + tagName + '_id') != null, 'Form-associated element ' + tagName + 
        		' in shadow tree must be accessible shadow tree accessors');
        assert_equals(s.querySelector('#' + tagName + '_id').getAttribute('id'), tagName + '_id',
        	'Form-associated element ' + tagName + ' in shadow tree must be accessible shadow tree accessors');
    });
}, 'A_08_02_02_T01', PROPS(A_08_02_02, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


//test form elements
test(function () {
	var d = newHTMLDocument();

    var form = d.createElement('form');
    d.body.appendChild(form);

    var div = d.createElement('div');
    form.appendChild(div);
    var s = createSR(div);

    HTML5_FORM_ASSOCIATED_ELEMENTS.forEach(function (tagName) {

        var el = d.createElement(tagName);
        el.setAttribute('id', tagName + '_id');
        s.appendChild(el);
        
        assert_true(s.querySelector('#' + tagName + '_id') != null, 'Form-associated element ' + tagName + 
		' in shadow tree must be accessible shadow tree accessors');
        assert_equals(s.querySelector('#' + tagName + '_id').getAttribute('id'), tagName + '_id',
        	'Form element ' + tagName +	' in shadow tree must be accessible shadow tree accessors');
    });
}, 'A_08_02_02_T02', PROPS(A_08_02_02, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));


//test distributed form elements
test(function () {
	var d = newHTMLDocument();

    HTML5_FORM_ASSOCIATED_ELEMENTS.forEach(function (tagName) {
    	
        var form = d.createElement('form');
        d.body.appendChild(form);

        var div = d.createElement('div');
        form.appendChild(div);
        
        var el = d.createElement(tagName);
        el.setAttribute('id', tagName + '_id');
        div.appendChild(el);
        
        var s = createSR(div);
    	s.innerHTML = '<content select="' + tagName + '"></content>';
    	
        assert_true(s.querySelector('#' + tagName + '_id') == null, 'Distributed form-associated element ' + tagName + 
		' in shadow tree must not be accessible shadow tree accessors');
    });
}, 'A_08_02_02_T03', PROPS(A_08_02_02, {
	author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
	reviewer:''
}));
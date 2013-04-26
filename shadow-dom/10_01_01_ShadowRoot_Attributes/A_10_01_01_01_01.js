/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_01_01_01 = {
    name:'A_10_01_01_01_01',
    assert:'ShadowRoot Object: ' +
    	'attribute bool applyAuthorStyles attribute. If false, the author styles are not applied ' +
    	'to the shadow tree',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-attributes',
    highlight: '[[If false (default value), the author styles are not applied to the shadow tree]]'
};

//test default value
test(unit(function (ctx) {

    var d = newRenderedHTMLDocument(ctx);

    d.head.innerHTML = '<style>' +
		'.invis {' +
		'display:none;' +
		'}' +
		'</style>';

    var host = d.createElement('div');
    d.body.appendChild(host);

	//Shadow root to play with
	var s = createSR(host);

	assert_false(s.applyAuthorStyles, 'Default value for ShadowRoot Object attribute applyAuthorStyles is expected to be false');


	var div1 = d.createElement('div');
	div1.innerHTML ='<span id="shd" class="invis">This is the shadow tree</span>';
	s.appendChild(div1);

	//apply-author-styles flag is false by default. Invisible style shouldn't be applied
	assert_true(s.querySelector('#shd').offsetTop > 0,
    	'CSS styles declared in enclosing tree must not be applied in a shadow tree ' +
    	'if the apply-author-styles flag is set to false');

}), 'A_10_01_01_01_01_T01', PROPS(A_10_01_01_01_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));


//test implicit value
test(unit(function (ctx) {

    var d = newRenderedHTMLDocument(ctx);

    d.head.innerHTML = '<style>' +
		'.invis {' +
		'display:none;' +
		'}' +
		'</style>';

    var host = d.createElement('div');
    d.body.appendChild(host);

	//Shadow root to play with
	var s = createSR(host);
	s.applyAuthorStyles = false;

	var div1 = d.createElement('div');
	div1.innerHTML ='<span id="shd" class="invis">This is the shadow tree</span>';
	s.appendChild(div1);

	//apply-author-styles flag is set to false. Invisible style shouldn't be applied
	assert_true(s.querySelector('#shd').offsetTop > 0,
    	'CSS styles declared in enclosing tree must not be applied in a shadow tree ' +
    	'if the apply-author-styles flag is set to false');

}), 'A_10_01_01_01_01_T02', PROPS(A_10_01_01_01_01, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_10_01_01_01_02 = {
    name:'A_10_01_01_01_02',
    assert:'ShadowRoot Object: ' +
    	'attribute bool applyAuthorStyles attribute. If true, the author styles are applied',
    link:'https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#shadow-root-attributes',
    highlight: '[[applyAuthorStyles of type bool]]' +
    	'[\\s\\S]*[[If true, the author styles are applied.]]'
};


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
	s.applyAuthorStyles = true;

	var div1 = d.createElement('div');
	div1.innerHTML ='<span id="shd" class="invis">This is the shadow tree</span>';
	s.appendChild(div1);

	//apply-author-styles flag is set to true. Invisible style should be applied
	assert_equals(s.querySelector('#shd').offsetTop, 0,
    	'CSS styles declared in enclosing tree must  be applied in a shadow tree ' +
    	'if the apply-author-styles flag is set to true');

}), 'A_10_01_01_01_02_T01', PROPS(A_10_01_01_01_02, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

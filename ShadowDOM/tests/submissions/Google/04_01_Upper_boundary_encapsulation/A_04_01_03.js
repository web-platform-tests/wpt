/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_04_01_03 = {
    name:'A_04_01_03',
    assert:'Upper-boundary encapsulation: ' +
        'The nodes and named elements are not accessible with Window object named properties',
    link:'http://www.w3.org/TR/shadow-dom/#upper-boundary-encapsulation',
    highlight:'[[The nodes and named elements are not accessible]] using shadow host\'s ' +
    	'document DOM tree accessors or [[with Window object named properties]]',
    bug: ['https://bugs.webkit.org/show_bug.cgi?id=105617']

};

// check that 'a', 'applet', 'area', 'embed', 'form', 'frame',
// 'frameset', 'iframe', 'img' and 'object' named elements do not
// appear in window object named properties
test(unit(function (ctx) {
    var f = newIFrame(ctx);
    var d = f.contentWindow.document;

    var div = d.createElement('div');
    d.body.appendChild(div);
    var s = createSR(div);

    //Window named properties
    var namedElements = ['a', 'applet', 'area', 'embed', 'form', 'frame',
        'frameset', 'iframe','img', 'object'];

    namedElements.forEach(function (tagName) {
        var element = d.createElement(tagName);
        element.name = 'named_' + tagName;
        d.body.appendChild(element);

        s.appendChild(element);

        assert_false(element.name in f.contentWindow,
            'Point 1: named "' + tagName + '" must not appear in window object named properties');

        assert_false(element.name in d,
            'Point 2: named "' + tagName + '" must not appear in document object named properties');
    });
}), 'A_04_01_03_T01', PROPS(A_04_01_03, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

// check that element with ID does not appear in window object named properties
test(unit(function (ctx) {
    var f = newIFrame(ctx);
    var d = f.contentWindow.document;

    var div1 = d.createElement('div');
    d.body.appendChild(div1);
    var s = createSR(div1);

    var div2 = d.createElement('div');
    div2.id = 'divWithId';
    d.body.appendChild(div2);

    s.appendChild(div2);

    assert_false('divWithId' in f.contentWindow,
        'DIV element with ID must not appear in window object named properties');

}), 'A_04_01_03_T2', PROPS(A_04_01_03, {
    author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
    reviewer:'Mikhail Fursov <mfursov@unipro.ru>'
}));

//check that any HTML5 element with ID does not appear in window object named properties
test(unit(function (ctx) {
    var f = newIFrame(ctx);
    var d = f.contentWindow.document;
    var s = createSR(d.documentElement);

    var i;
    for (i=0; i<HTML5_TAG.length; i++){
    	var shadowElement = d.createElement(HTML5_TAG[i]);
    	var id = 'id of '+ HTML5_TAG[i];
    	shadowElement.id = id;
    	d.body.appendChild(shadowElement);

    	s.appendChild(shadowElement);

    	assert_false(id in f.contentWindow, 'element '+HTML5_TAG[i]+' with id must not appear in window object named properties');
    }


}), 'A_04_01_03_T3', PROPS(A_04_01_03, {
    author:'Aleksei Yu. Semenov<a.semenov@unipro.ru>'
}));




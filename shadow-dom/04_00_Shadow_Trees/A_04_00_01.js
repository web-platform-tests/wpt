/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

var A_04_00_01 = {
    name:'A_04_00_01',
    assert:'All HTML4 elements are able to host shadow trees',
    link:'http://www.w3.org/TR/shadow-dom/#shadow-dom-subtrees',
    highlight:'The existence of multiple DOM trees is enabled by letting any element in the ' +
        'document tree to host one or more additional DOM trees',
    seealso:'http://www.w3.org/TR/html4/index/elements.html',
    bug: ['https://bugs.webkit.org/show_bug.cgi?id=102864']
};




function A_04_00_01_test(elementName) {
// create element
	var d = newHTMLDocument();
	var n = d.createElement(elementName);
    d.body.appendChild(n);

// add first shadow tree
    var shadowTree1 =  createSR(n);
    assert_equals(shadowTree1.ownerDocument, d, 'Expected: Shadow tree 1 is part of the document, Actual: Shadow tree 1 is not part of the document');
 // add second shadow tree
    var shadowTree2 =  createSR(n);
    assert_equals(shadowTree2.ownerDocument, d, 'Expected: Shadow tree 2 is part of the document, Actual: Shadow tree 2 is not part of the document');
}

test(function () {
	A_04_00_01_test('A');
}, 'A_04_00_01_T01', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('ABBR');
}, 'A_04_00_01_T02', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('ACRONYM');
}, 'A_04_00_01_T03', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('ADDRESS');
}, 'A_04_00_01_T04', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('APPLET');
}, 'A_04_00_01_T05', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));


test(function () {
	A_04_00_01_test('AUDIO');
}, 'A_04_00_01_T05_01', PROPS(A_04_00_01, {
  author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
  reviewer:''
}));

test(function () {
	A_04_00_01_test('B');
}, 'A_04_00_01_T06', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('BASE');
}, 'A_04_00_01_T07', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('BASEFONT');
}, 'A_04_00_01_T08', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('BDO');
}, 'A_04_00_01_T09', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('BIG');
}, 'A_04_00_01_T10', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('BLOCKQUOTE');
}, 'A_04_00_01_T11', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('BODY');
}, 'A_04_00_01_T12', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('BR');
}, 'A_04_00_01_T12', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('BUTTON');
}, 'A_04_00_01_T13', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('CAPTION');
}, 'A_04_00_01_T14', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('CANVAS');
}, 'A_04_00_01_T14_01', PROPS(A_04_00_01, {
  author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
  reviewer:''
}));


test(function () {
	A_04_00_01_test('CENTER');
}, 'A_04_00_01_T15', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('CITE');
}, 'A_04_00_01_T16', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('CODE');
}, 'A_04_00_01_T17', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('COL');
}, 'A_04_00_01_T18', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('COLGROUP');
}, 'A_04_00_01_T19', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('DD');
}, 'A_04_00_01_T20', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('DEL');
}, 'A_04_00_01_T21', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('DFN');
}, 'A_04_00_01_T22', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('DIR');
}, 'A_04_00_01_T23', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('DIV');
}, 'A_04_00_01_T24', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('DL');
}, 'A_04_00_01_T25', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('DT');
}, 'A_04_00_01_T26', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('EM');
}, 'A_04_00_01_T27', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('EMBED');
}, 'A_04_00_01_T27_01', PROPS(A_04_00_01, {
  author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
  reviewer:''
}));

test(function () {
	A_04_00_01_test('FIELDSET');
}, 'A_04_00_01_T28', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('FONT');
}, 'A_04_00_01_T29', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('FORM');
}, 'A_04_00_01_T30', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('FRAME');
}, 'A_04_00_01_T31', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('FRAMESET');
}, 'A_04_00_01_T32', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('H1');
}, 'A_04_00_01_T33', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('H2');
}, 'A_04_00_01_T34', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('H3');
}, 'A_04_00_01_T35', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('H4');
}, 'A_04_00_01_T36', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('H5');
}, 'A_04_00_01_T37', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('H6');
}, 'A_04_00_01_T38', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('HEAD');
}, 'A_04_00_01_T39', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('HR');
}, 'A_04_00_01_T40', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('HTML');
}, 'A_04_00_01_T41', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('I');
}, 'A_04_00_01_T42', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('IFRAME');
}, 'A_04_00_01_T43', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('IMG');
}, 'A_04_00_01_T44', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));


test(function () {
	A_04_00_01_test('INPUT');
}, 'A_04_00_01_T45', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('INS');
}, 'A_04_00_01_T46', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('ISINDEX');
}, 'A_04_00_01_T47', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('KBD');
}, 'A_04_00_01_T48', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('LABEL');
}, 'A_04_00_01_T49', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('LEGEND');
}, 'A_04_00_01_T50', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('LI');
}, 'A_04_00_01_T51', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('LINK');
}, 'A_04_00_01_T52', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('MAP');
}, 'A_04_00_01_T53', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('MENU');
}, 'A_04_00_01_T54', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('META');
}, 'A_04_00_01_T55', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('METER');
}, 'A_04_00_01_T55_01', PROPS(A_04_00_01, {
  author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
  reviewer:''
}));


test(function () {
	A_04_00_01_test('NOFRAMES');
}, 'A_04_00_01_T56', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('NOSCRIPT');
}, 'A_04_00_01_T57', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('OBJECT');
}, 'A_04_00_01_T58', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('OL');
}, 'A_04_00_01_T59', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('OPTGROUP');
}, 'A_04_00_01_T60', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('OPTION');
}, 'A_04_00_01_T61', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('P');
}, 'A_04_00_01_T62', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('PARAM');
}, 'A_04_00_01_T63', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('PRE');
}, 'A_04_00_01_T64', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('PROGRESS');
}, 'A_04_00_01_T64_01', PROPS(A_04_00_01, {
  author:'Sergey G. Grekhov <sgrekhov@unipro.ru>',
  reviewer:''
}));

test(function () {
	A_04_00_01_test('Q');
}, 'A_04_00_01_T65', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('S');
}, 'A_04_00_01_T66', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('SAMP');
}, 'A_04_00_01_T67', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('SCRIPT');
}, 'A_04_00_01_T68', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('SELECT');
}, 'A_04_00_01_T69', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('SMALL');
}, 'A_04_00_01_T70', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('SPAN');
}, 'A_04_00_01_T71', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('STRIKE');
}, 'A_04_00_01_T72', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('STRONG');
}, 'A_04_00_01_T73', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('STYLE');
}, 'A_04_00_01_T74', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('SUB');
}, 'A_04_00_01_T75', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('SUP');
}, 'A_04_00_01_T76', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('TABLE');
}, 'A_04_00_01_T77', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('TBODY');
}, 'A_04_00_01_T78', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('TD');
}, 'A_04_00_01_T79', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('TEXTAREA');
}, 'A_04_00_01_T80', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('TFOOT');
}, 'A_04_00_01_T81', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('TH');
}, 'A_04_00_01_T82', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('THEAD');
}, 'A_04_00_01_T83', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('TITLE');
}, 'A_04_00_01_T84', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('TR');
}, 'A_04_00_01_T85', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('TT');
}, 'A_04_00_01_T86', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('U');
}, 'A_04_00_01_T87', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('UL');
}, 'A_04_00_01_T88', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));

test(function () {
	A_04_00_01_test('VAR');
}, 'A_04_00_01_T89', PROPS(A_04_00_01, {
  author:'Mikhail Fursov <mfursov@unipro.ru>',
  reviewer:'Sergey G. Grekhov <sgrekhov@unipro.ru>, Aleksei Yu. Semenov <a.semenov@unipro.ru>'
}));



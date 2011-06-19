// Alert the reader of egregious Opera bug that will make the specced
// implementation horribly buggy
//@{
(function() {
	var div = document.createElement("div");
	div.appendChild(document.createElement("br"));
	document.body.insertBefore(div, document.body.firstChild);
	var range = document.createRange();
	range.setStart(div, 1);
	div.insertBefore(document.createElement("p"), div.firstChild);
	if (range.startOffset > range.startContainer.childNodes.length) {
		var warningDiv = document.createElement("p");
		document.body.insertBefore(warningDiv, document.body.firstChild);
		warningDiv.style.fontWeight = "bold";
		warningDiv.style.fontSize = "2em";
		warningDiv.style.color = "red";
		warningDiv.innerHTML = 'Your browser suffers from an <a href="http://software.hixie.ch/utilities/js/live-dom-viewer/saved/1028">egregious bug</a> in range mutation that will give incorrect results for the spec columns in many cases.  To ensure that the spec column contains the output actually required by the spec, use a different browser.';
	}
	div.parentNode.removeChild(div);
})();
//@}

// Insert the toolbar thingie as soon as the script file is loaded
//@{
(function() {
	var toolbarDiv = document.createElement("div");
	toolbarDiv.id = "toolbar";
	// Note: this is completely not a hack at all.
	toolbarDiv.innerHTML = "<style id=alerts>/* body > div > table > tbody > tr:not(.alert):not(:first-child):not(.active) { display: none } */</style>"
		+ "<label><input id=alert-checkbox type=checkbox accesskey=a checked onclick='updateAlertRowStyle()'> Display rows without spec <u>a</u>lerts</label>"
		+ "<label><input id=browser-checkbox type=checkbox accesskey=b checked onclick='localStorage[\"display-browser-tests\"] = event.target.checked'> Run <u>b</u>rowser tests as well as spec tests</label>";

	document.body.appendChild(toolbarDiv);
})();
//@}

// Confusingly, we're storing a string here, not a boolean.
document.querySelector("#alert-checkbox").checked = localStorage["display-alerts"] != "false";
document.querySelector("#browser-checkbox").checked = localStorage["display-browser-tests"] != "false";

function updateAlertRowStyle() {
//@{
	var checked = document.querySelector("#alert-checkbox").checked;
	var style = document.querySelector("#alerts");
	if (checked && !/^\/\*/.test(style.textContent)) {
		style.textContent = "/* " + style.textContent + " */";
	} else if (!checked) {
		style.textContent = style.textContent.replace(/(\/\* | \*\/)/g, "");
	}
	localStorage["display-alerts"] = checked;
}
//@}
updateAlertRowStyle();

// Feature-test whether the browser wraps at <wbr> or not, and set word-wrap:
// break-word where necessary if not.  (IE and Opera don't wrap, Gecko and
// WebKit do.)  word-wrap: break-word will break anywhere at all, so it looks
// significantly uglier.
//@{
(function() {
	var wordWrapTestDiv = document.createElement("div");
	wordWrapTestDiv.style.width = "5em";
	document.body.appendChild(wordWrapTestDiv);
	wordWrapTestDiv.innerHTML = "abc";
	var height1 = getComputedStyle(wordWrapTestDiv).height;
	wordWrapTestDiv.innerHTML = "abc<wbr>abc<wbr>abc<wbr>abc<wbr>abc<wbr>abc";
	var height2 = getComputedStyle(wordWrapTestDiv).height;
	document.body.removeChild(wordWrapTestDiv);
	if (height1 == height2) {
		document.body.className += " wbr-workaround";
	}
})();
//@}

// Now for the meat of the file.
var tests = {
	backcolor: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'<p>foo[bar]baz',
		'<p>foo]bar[baz',
		'<div><p>foo[bar]baz</p></div>',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'{<p><p> <p>foo</p>}',
		'{<p>foo</p><p>bar</p>}',
		'<p>[foo</p><p>bar]</p>',
		'<p>foo[bar<i>baz]qoz</i>quz',
	],
	//@}
	bold: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'foo[bar]baz',
		'foo]bar[baz',
		'{<p><p> <p>foo</p>}',
		'foo[bar<i>baz]qoz</i>quz',

		'foo<span contenteditable=false>[bar]</span>baz',
		'fo[o<span contenteditable=false>bar</span>b]az',
		'fo[<b>o</b><span contenteditable=false>bar</span><b>b</b>]az',
		'<span contenteditable=false>foo<span contenteditable=true>[bar]</span>baz</span>',
		'<span contenteditable=false>fo[o<span contenteditable=true>bar</span>b]az</span>',
		'<span contenteditable=false>fo[<b>o<span contenteditable=true>bar</span>b</b>]az</span>',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'foo<span style="font-weight: bold">[bar]</span>baz',
		'foo<b>[bar]</b>baz',
		'foo<b>bar</b>[baz]',
		'[foo]<b>bar</b>baz',
		'<b>foo</b>[bar]<b>baz</b>',
		'foo<strong>bar</strong>[baz]',
		'[foo]<strong>bar</strong>baz',
		'<strong>foo</strong>[bar]<strong>baz</strong>',
		'<b>foo</b>[bar]<strong>baz</strong>',
		'<strong>foo</strong>[bar]<b>baz</b>',
		'foo[<b>bar</b>]baz',
		'foo[<b>bar]</b>baz',
		'foo<b>[bar</b>]baz',

		'foo{<b></b>}baz',
		'foo{<i></i>}baz',
		'foo{<b><i></i></b>}baz',
		'foo{<i><b></b></i>}baz',

		'foo<strong>[bar]</strong>baz',
		'foo[<strong>bar</strong>]baz',
		'foo[<strong>bar]</strong>baz',
		'foo<strong>[bar</strong>]baz',
		'foo<span style="font-weight: bold">[bar]</span>baz',
		'foo[<span style="font-weight: bold">bar</span>]baz',
		'foo[<span style="font-weight: bold">bar]</span>baz',
		'foo<span style="font-weight: bold">[bar</span>]baz',

		'<b>{<p>foo</p><p>bar</p>}<p>baz</p></b>',
		'<b><p>foo[<i>bar</i>}</p><p>baz</p></b>',

		'foo [bar <b>baz] qoz</b> quz sic',
		'foo bar <b>baz [qoz</b> quz] sic',

		'<b id=purple>bar [baz] qoz</b>',

		'foo<span style="font-weight: 100">[bar]</span>baz',
		'foo<span style="font-weight: 400">[bar]</span>baz',
		'foo<span style="font-weight: 700">[bar]</span>baz',
		'foo<span style="font-weight: 900">[bar]</span>baz',
		'foo<span style="font-weight: 400">[bar</span>]baz',
		'foo<span style="font-weight: 700">[bar</span>]baz',
		'foo[<span style="font-weight: 400">bar]</span>baz',
		'foo[<span style="font-weight: 700">bar]</span>baz',
		'foo[<span style="font-weight: 400">bar</span>]baz',
		'foo[<span style="font-weight: 700">bar</span>]baz',
		'<span style="font-weight: 100">foo[bar]baz</span>',
		'<span style="font-weight: 400">foo[bar]baz</span>',
		'<span style="font-weight: 700">foo[bar]baz</span>',
		'<span style="font-weight: 900">foo[bar]baz</span>',
		'{<span style="font-weight: 100">foobar]baz</span>',
		'{<span style="font-weight: 400">foobar]baz</span>',
		'{<span style="font-weight: 700">foobar]baz</span>',
		'{<span style="font-weight: 900">foobar]baz</span>',
		'<span style="font-weight: 100">foo[barbaz</span>}',
		'<span style="font-weight: 400">foo[barbaz</span>}',
		'<span style="font-weight: 700">foo[barbaz</span>}',
		'<span style="font-weight: 900">foo[barbaz</span>}',

		'<h3>foo[bar]baz</h3>',
		'{<h3>foobar]baz</h3>',
		'<h3>foo[barbaz</h3>}',
		'<h3>[foobarbaz]</h3>',
		'{<h3>foobarbaz]</h3>',
		'<h3>[foobarbaz</h3>}',
		'{<h3>foobarbaz</h3>}',

		'<b>foo<span style="font-weight: normal">bar<b>[baz]</b>quz</span>qoz</b>',
		'<b>foo<span style="font-weight: normal">[bar]</span>baz</b>',

		'{<b>foo</b> <b>bar</b>}',
		'{<h3>foo</h3><b>bar</b>}',

		'<i><b>foo</b></i>[bar]<i><b>baz</b></i>',
		'<i><b>foo</b></i>[bar]<b>baz</b>',
		'<b>foo</b>[bar]<i><b>baz</b></i>',
		'<font color=red face=monospace><b>foo</b></font>[bar]',

		'foo<span style="font-weight: normal"><b>{bar}</b></span>baz',
		'[foo<span class=notbold>bar</span>baz]',
		'<b><span class=notbold>[foo]</span></b>',
		'<b><span class=notbold>foo[bar]baz</span></b>',

		'<p style="font-weight: bold">foo[bar]baz</p>',
	],
	//@}
	createlink: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'foo[bar]baz',
		'foo]bar[baz',
		'{<p><p> <p>foo</p>}',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'<a href=http://www.google.com/>foo[bar]baz</a>',
		'<a href=http://www.google.com/>foo[barbaz</a>}',
		'{<a href=http://www.google.com/>foobar]baz</a>',
		'{<a href=http://www.google.com/>foobarbaz</a>}',
		'<a href=http://www.google.com/>[foobarbaz]</a>',

		'foo<a href=http://www.google.com/>[bar]</a>baz',
		'[foo]<a href=http://www.google.com/>bar</a>baz',
		'foo<a href=http://www.google.com/>bar</a>[baz]',
		'foo[<a href=http://www.google.com/>bar</a>]baz',
		'foo<a href=http://www.google.com/>[bar</a>baz]',
		'[foo<a href=http://www.google.com/>bar]</a>baz',
		'[foo<a href=http://www.google.com/>bar</a>baz]',

		'<a href=otherurl>foo[bar]baz</a>',
		'<a href=otherurl>foo[barbaz</a>}',
		'{<a href=otherurl>foobar]baz</a>',
		'{<a href=otherurl>foobarbaz</a>}',
		'<a href=otherurl>[foobarbaz]</a>',

		'foo<a href=otherurl>[bar]</a>baz',
		'foo[<a href=otherurl>bar</a>]baz',
		'foo<a href=otherurl>[bar</a>baz]',
		'[foo<a href=otherurl>bar]</a>baz',
		'[foo<a href=otherurl>bar</a>baz]',

		'<a href=otherurl><b>foo[bar]baz</b></a>',
		'<a href=otherurl><b>foo[barbaz</b></a>}',
		'{<a href=otherurl><b>foobar]baz</b></a>',
		'<a href=otherurl><b>[foobarbaz]</b></a>',

		'<a name=abc>foo[bar]baz</a>',
		'<a name=abc><b>foo[bar]baz</b></a>',
	],
	//@}
	// Opera requires this to be quoted, contrary to ES5 11.1.5 which allows
	// PropertyName to be any IdentifierName, and see 7.6 which defines
	// IdentifierName to include ReservedWord; Identifier excludes it.
	"delete": [
	//@{
		// Collapsed selection
		//
		// These three commented-out test call Firefox 5.0a2 to blow up, not
		// just throwing exceptions on the tests themselves but on many
		// subsequent tests too.
		//'[]foo',
		//'<span>[]foo</span>',
		//'<p>[]foo</p>',
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'foo<span style=display:none>bar</span>[]baz',
		'fo&ouml;[]bar',
		'foo&#x308;[]bar',

		'<p>foo</p><p>[]bar</p>',
		'<p>foo</p>[]bar',
		'foo<p>[]bar</p>',
		'<p>foo<br></p><p>[]bar</p>',
		'<p>foo<br></p>[]bar',
		'foo<br><p>[]bar</p>',
		'<p>foo<br><br></p><p>[]bar</p>',
		'<p>foo<br><br></p>[]bar',
		'foo<br><br><p>[]bar</p>',

		'<div><p>foo</p></div><p>[]bar</p>',
		'<p>foo</p><div><p>[]bar</p></div>',
		'<div><p>foo</p></div><div><p>[]bar</p></div>',
		'<div><p>foo</p></div>[]bar',
		'foo<div><p>[]bar</p></div>',

		'<div>foo</div><div>[]bar</div>',
		'<pre>foo</pre>[]bar',

		'foo<br>[]bar',
		'foo<br><b>[]bar</b>',
		'foo<hr>[]bar',
		'<p>foo<hr><p>[]bar',
		'<p>foo</p><br><p>[]bar</p>',
		'<p>foo</p><br><br><p>[]bar</p>',
		'<p>foo</p><img src=/img/lion.svg><p>[]bar',
		'foo<img src=/img/lion.svg>[]bar',
		'<a href=/>foo</a>[]bar',
		'foo<a href=/>[]bar</a>',

		// Tables with collapsed selection
		'foo<table><tr><td>[]bar</table>baz',
		'foo<table><tr><td>bar</table>[]baz',
		'<p>foo<table><tr><td>[]bar</table><p>baz',
		'<p>foo<table><tr><td>bar</table><p>[]baz',
		'<table><tr><td>foo<td>[]bar</table>',
		'<table><tr><td>foo<tr><td>[]bar</table>',

		'foo<br><table><tr><td>[]bar</table>baz',
		'foo<table><tr><td>bar<br></table>[]baz',
		'<p>foo<br><table><tr><td>[]bar</table><p>baz',
		'<p>foo<table><tr><td>bar<br></table><p>[]baz',
		'<table><tr><td>foo<br><td>[]bar</table>',
		'<table><tr><td>foo<br><tr><td>[]bar</table>',

		'foo<br><br><table><tr><td>[]bar</table>baz',
		'foo<table><tr><td>bar<br><br></table>[]baz',
		'<p>foo<br><br><table><tr><td>[]bar</table><p>baz',
		'<p>foo<table><tr><td>bar<br><br></table><p>[]baz',
		'<table><tr><td>foo<br><br><td>[]bar</table>',
		'<table><tr><td>foo<br><br><tr><td>[]bar</table>',

		'foo<hr><table><tr><td>[]bar</table>baz',
		'foo<table><tr><td>bar<hr></table>[]baz',
		'<table><tr><td>foo<hr><td>[]bar</table>',
		'<table><tr><td>foo<hr><tr><td>[]bar</table>',

		// Lists with collapsed selection
		'foo<ol><li>[]bar<li>baz</ol>',
		'foo<br><ol><li>[]bar<li>baz</ol>',
		'foo<br><br><ol><li>[]bar<li>baz</ol>',
		'<ol><li>foo<li>[]bar</ol>',
		'<ol><li>foo<br><li>[]bar</ol>',
		'<ol><li>foo<br><br><li>[]bar</ol>',
		'<ol><li>foo<li>[]bar<br>baz</ol>',
		'<ol><li>foo<br>bar<li>[]baz</ol>',

		'<ol><li><p>foo<li>[]bar</ol>',
		'<ol><li>foo<li><p>[]bar</ol>',
		'<ol><li><p>foo<li><p>[]bar</ol>',

		'<ol><li>foo<ul><li>[]bar</ul></ol>',
		'foo<ol><ol><li>[]bar</ol></ol>',
		'foo<div><ol><li>[]bar</ol></div>',

		'foo<dl><dt>[]bar<dd>baz</dl>',
		'foo<dl><dd>[]bar</dl>',
		'<dl><dt>foo<dd>[]bar</dl>',
		'<dl><dt>foo<dt>[]bar<dd>baz</dl>',
		'<dl><dt>foo<dd>bar<dd>[]baz</dl>',

		'<ol><li>foo</ol>[]bar',
		'<ol><li>foo<br></ol>[]bar',
		'<ol><li>foo<br><br></ol>[]bar',

		'<ol><li><br></ol>[]bar',
		'<ol><li>foo<li><br></ol>[]bar',

		// Indented stuff with collapsed selection
		'foo<blockquote>[]bar</blockquote>',
		'foo<blockquote><blockquote>[]bar</blockquote></blockquote>',
		'foo<blockquote><div>[]bar</div></blockquote>',
		'foo<blockquote style="color: red">[]bar</blockquote>',

		'foo<blockquote><blockquote><p>[]bar<p>baz</blockquote></blockquote>',
		'foo<blockquote><div><p>[]bar<p>baz</div></blockquote>',
		'foo<blockquote style="color: red"><p>[]bar<p>baz</blockquote>',

		'foo<blockquote><p><b>[]bar</b><p>baz</blockquote>',
		'foo<blockquote><p><strong>[]bar</strong><p>baz</blockquote>',
		'foo<blockquote><p><span>[]bar</span><p>baz</blockquote>',

		'foo<blockquote><ol><li>[]bar</ol></blockquote><p>extra',
		'foo<blockquote>bar<ol><li>[]baz</ol>quz</blockquote><p>extra',
		'foo<blockquote><ol><li>bar</li><ol><li>[]baz</ol><li>quz</ol></blockquote><p>extra',

		// Invisible stuff with collapsed selection
		'foo<span></span>[]bar',
		'foo<span><span></span></span>[]bar',
		'foo<quasit></quasit>[]bar',
		'foo<br><span></span>[]bar',
		'<span>foo<span></span></span>[]bar',
		'foo<span></span><span>[]bar</span>',

		// Uncollapsed selection
		'foo[bar]baz',

		'foo<b>[bar]</b>baz',
		'foo<b>{bar}</b>baz',
		'foo{<b>bar</b>}baz',
		'foo<span>[bar]</span>baz',
		'foo<span>{bar}</span>baz',
		'foo{<span>bar</span>}baz',
		'<b>foo[bar</b><i>baz]quz</i>',
		'<p>foo</p><p>[bar]</p><p>baz</p>',
		'<p>foo</p><p>{bar}</p><p>baz</p>',
		'<p>foo</p><p>{bar</p>}<p>baz</p>',
		'<p>foo</p>{<p>bar}</p><p>baz</p>',
		'<p>foo</p>{<p>bar</p>}<p>baz</p>',

		'<p>foo[bar<p>baz]quz',
		'<p>foo[bar<div>baz]quz</div>',
		'<p>foo[bar<h1>baz]quz</h1>',
		'<div>foo[bar</div><p>baz]quz',
		'<blockquote>foo[bar</blockquote><pre>baz]quz</pre>',

		'<p><b>foo[bar</b><p>baz]quz',
		'<div><p>foo[bar</div><p>baz]quz',
		'<p>foo[bar<blockquote><p>baz]quz<p>qoz</blockquote',
		'<p>foo[bar<p style=color:red>baz]quz',
		'<p>foo[bar<p><b>baz]quz</b>',

		'<div><p>foo<p>[bar<p>baz]</div>',

		'foo[<br>]bar',
		'<p>foo[</p><p>]bar</p>',
		'<p>foo[</p><p>]bar<br>baz</p>',
		'foo[<p>]bar</p>',
		'foo{<p>}bar</p>',
		'foo[<p>]bar<br>baz</p>',
		'foo[<p>]bar</p>baz',
		'foo{<p>bar</p>}baz',
		'foo<p>{bar</p>}baz',
		'foo{<p>bar}</p>baz',
		'<p>foo[</p>]bar',
		'<p>foo{</p>}bar',
		'<p>foo[</p>]bar<br>baz',
		'<p>foo[</p>]bar<p>baz</p>',
		'foo[<div><p>]bar</div>',
		'<div><p>foo[</p></div>]bar',
		'foo[<div><p>]bar</p>baz</div>',
		'foo[<div>]bar<p>baz</p></div>',
		'<div><p>foo</p>bar[</div>]baz',
		'<div>foo<p>bar[</p></div>]baz',

		'<p>foo<br>{</p>]bar',
		'<p>foo<br><br>{</p>]bar',
		'foo<br>{<p>]bar</p>',
		'foo<br><br>{<p>]bar</p>',
		'<p>foo<br>{</p><p>}bar</p>',
		'<p>foo<br><br>{</p><p>}bar</p>',

		'<table><tbody><tr><th>foo<th>[bar]<th>baz<tr><td>quz<td>qoz<td>qiz</table>',
		'<table><tbody><tr><th>foo<th>ba[r<th>b]az<tr><td>quz<td>qoz<td>qiz</table>',
		'<table><tbody><tr><th>fo[o<th>bar<th>b]az<tr><td>quz<td>qoz<td>qiz</table>',
		'<table><tbody><tr><th>foo<th>bar<th>ba[z<tr><td>q]uz<td>qoz<td>qiz</table>',
		'<table><tbody><tr><th>[foo<th>bar<th>baz]<tr><td>quz<td>qoz<td>qiz</table>',
		'<table><tbody><tr><th>[foo<th>bar<th>baz<tr><td>quz<td>qoz<td>qiz]</table>',
		'{<table><tbody><tr><th>foo<th>bar<th>baz<tr><td>quz<td>qoz<td>qiz</table>}',
		'<table><tbody><tr><td>foo<td>ba[r<tr><td>baz<td>quz<tr><td>q]oz<td>qiz</table>',
		'<p>fo[o<table><tr><td>b]ar</table><p>baz',
		'<p>foo<table><tr><td>ba[r</table><p>b]az',
		'<p>fo[o<table><tr><td>bar</table><p>b]az',

		'<p>foo<ol><li>ba[r<li>b]az</ol><p>quz',
		'<p>foo<ol><li>bar<li>[baz]</ol><p>quz',
		'<p>fo[o<ol><li>b]ar<li>baz</ol><p>quz',
		'<p>foo<ol><li>bar<li>ba[z</ol><p>q]uz',
		'<p>fo[o<ol><li>bar<li>b]az</ol><p>quz',
		'<p>fo[o<ol><li>bar<li>baz</ol><p>q]uz',

		'<ol><li>fo[o</ol><ol><li>b]ar</ol>',
		'<ol><li>fo[o</ol><ul><li>b]ar</ul>',

		'foo[<ol><li>]bar</ol>',
		'<ol><li>foo[<li>]bar</ol>',
		'foo[<dl><dt>]bar<dd>baz</dl>',
		'foo[<dl><dd>]bar</dl>',
		'<dl><dt>foo[<dd>]bar</dl>',
		'<dl><dt>foo[<dt>]bar<dd>baz</dl>',
		'<dl><dt>foo<dd>bar[<dd>]baz</dl>',
	],
	//@}
	fontname: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'foo[bar]baz',
		'foo]bar[baz',
		'{<p><p> <p>foo</p>}',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'foo<code>[bar]</code>baz',
		'foo<kbd>[bar]</kbd>baz',
		'foo<listing>[bar]</listing>baz',
		'foo<pre>[bar]</pre>baz',
		'foo<samp>[bar]</samp>baz',
		'foo<tt>[bar]</tt>baz',

		'foo<code>b[a]r</code>baz',
		'foo<kbd>b[a]r</kbd>baz',
		'foo<listing>b[a]r</listing>baz',
		'foo<pre>b[a]r</pre>baz',
		'foo<samp>b[a]r</samp>baz',
		'foo<tt>b[a]r</tt>baz',

		'[foo<code>bar</code>baz]',
		'[foo<kbd>bar</kbd>baz]',
		'[foo<listing>bar</listing>baz]',
		'[foo<pre>bar</pre>baz]',
		'[foo<samp>bar</samp>baz]',
		'[foo<tt>bar</tt>baz]',

		'[foo<code>ba]r</code>baz',
		'[foo<kbd>ba]r</kbd>baz',
		'[foo<listing>ba]r</listing>baz',
		'[foo<pre>ba]r</pre>baz',
		'[foo<samp>ba]r</samp>baz',
		'[foo<tt>ba]r</tt>baz',

		'foo<code>b[ar</code>baz]',
		'foo<kbd>b[ar</kbd>baz]',
		'foo<listing>b[ar</listing>baz]',
		'foo<pre>b[ar</pre>baz]',
		'foo<samp>b[ar</samp>baz]',
		'foo<tt>b[ar</tt>baz]',

		'foo<span style="font-family: sans-serif">[bar]</span>baz',
		'foo<span style="font-family: sans-serif">b[a]r</span>baz',
		'foo<span style="font-family: monospace">[bar]</span>baz',
		'foo<span style="font-family: monospace">b[a]r</span>baz',
	],
	//@}
	fontsize: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		["1", 'foo[bar]baz'],
		["0", 'foo[bar]baz'],
		["-5", 'foo[bar]baz'],
		["6", 'foo[bar]baz'],
		["7", 'foo[bar]baz'],
		["8", 'foo[bar]baz'],
		["100", 'foo[bar]baz'],
		["2em", 'foo[bar]baz'],
		["20pt", 'foo[bar]baz'],
		["xx-large", 'foo[bar]baz'],
		[" 1 ", 'foo[bar]baz'],
		["1.", 'foo[bar]baz'],
		["1.0", 'foo[bar]baz'],
		["1.0e2", 'foo[bar]baz'],
		["1.1", 'foo[bar]baz'],
		["1.9", 'foo[bar]baz'],
		["+0", 'foo[bar]baz'],
		["+1", 'foo[bar]baz'],
		["+9", 'foo[bar]baz'],
		["-0", 'foo[bar]baz'],
		["-1", 'foo[bar]baz'],
		["-9", 'foo[bar]baz'],
		["", 'foo[bar]baz'],

		'{<p><p> <p>foo</p>}',
		'foo[bar<i>baz]qoz</i>quz',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'foo<font size=1>[bar]</font>baz',
		'<font size=1>foo[bar]baz</font>',
		'foo<font size=3>[bar]</font>baz',
		'<font size=3>foo[bar]baz</font>',
		'foo<font size=4>[bar]</font>baz',
		'<font size=4>foo[bar]baz</font>',
		'foo<font size=+1>[bar]</font>baz',
		'<font size=+1>foo[bar]baz</font>',
		'<font size=4>foo<font size=1>b[a]r</font>baz</font>',

		'foo<span style="font-size: xx-small">[bar]</span>baz',
		'<span style="font-size: xx-small">foo[bar]baz</span>',
		'foo<span style="font-size: medium">[bar]</span>baz',
		'<span style="font-size: medium">foo[bar]baz</span>',
		'foo<span style="font-size: large">[bar]</span>baz',
		'<span style="font-size: large">foo[bar]baz</span>',
		'<span style="font-size: large">foo<span style="font-size: xx-small">b[a]r</span>baz</span>',

		'foo<span style="font-size: 2em">[bar]</span>baz',
		'<span style="font-size: 2em">foo[bar]baz</span>',

		'<p style="font-size: xx-small">foo[bar]baz</p>',
		'<p style="font-size: medium">foo[bar]baz</p>',
		'<p style="font-size: large">foo[bar]baz</p>',
		'<p style="font-size: 2em">foo[bar]baz</p>',

		["3", '<p style="font-size: xx-small">foo[bar]baz</p>'],
		["3", '<p style="font-size: medium">foo[bar]baz</p>'],
		["3", '<p style="font-size: large">foo[bar]baz</p>'],
		["3", '<p style="font-size: 2em">foo[bar]baz</p>'],

		// Minor algorithm bug: this changes the size of the "b" and "r" in
		// "bar" when we pull down styles
		["3", '<font size=6>foo <span style="font-size: 2em">b[a]r</span> baz</font>'],

		["3", 'foo<big>[bar]</big>baz'],
		["3", 'foo<big>b[a]r</big>baz'],
		["3", 'foo<small>[bar]</small>baz'],
		["3", 'foo<small>b[a]r</small>baz'],
	],
	//@}
	forecolor: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'foo[bar]baz',
		'foo]bar[baz',
		'{<p><p> <p>foo</p>}',
		'foo[bar<i>baz]qoz</i>quz',

		['red', 'foo[bar]baz'],
		['f', 'foo[bar]baz'],
		['#f', 'foo[bar]baz'],
		['f00', 'foo[bar]baz'],
		['#f00', 'foo[bar]baz'],
		['ff0000', 'foo[bar]baz'],
		['#ff0000', 'foo[bar]baz'],
		['fff000000', 'foo[bar]baz'],
		['#fff000000', 'foo[bar]baz'],
		['rgb(255, 0, 0)', 'foo[bar]baz'],
		['rgb(100%, 0, 0)', 'foo[bar]baz'],
		['rgb( 255 ,0 ,0)', 'foo[bar]baz'],
		['rgba(255, 0, 0, 0.0)', 'foo[bar]baz'],
		['rgb(375, -10, 15)', 'foo[bar]baz'],
		['rgba(0, 0, 0, 1)', 'foo[bar]baz'],
		['rgba(255, 255, 255, 1)', 'foo[bar]baz'],
		['rgba(255, 0, 0, 0.5)', 'foo[bar]baz'],
		['hsl(0%, 100%, 50%)', 'foo[bar]baz'],
		['cornsilk', 'foo[bar]baz'],
		['potato quiche', 'foo[bar]baz'],
		['transparent', 'foo[bar]baz'],
		['currentColor', 'foo[bar]baz'],

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'foo<font color=red>[bar]</font>baz',
		'foo{<font color=red>bar</font>}baz',
		'<span style="color: red">foo<span style="color: blue">[bar]</span>baz</span>',
		'<span style="color: #f00">foo<span style="color: blue">[bar]</span>baz</span>',
		'<span style="color: #ff0000">foo<span style="color: blue">[bar]</span>baz</span>',
		'<span style="color: rgb(255, 0, 0)">foo<span style="color: blue">[bar]</span>baz</span>',
		'<font color=red>foo<font color=blue>[bar]</font>baz</font>',
		'<span style="color: rgb(255, 0, 0)">foo<span style="color: blue">b[ar]</span>baz</span>',
		'foo<span id=purple>ba[r</span>ba]z',
		'<span style="color: rgb(255, 0, 0)">foo<span id=purple>b[a]r</span>baz</span>',
	],
	//@}
	formatblock: [
	//@{
		'foo[]bar<p>extra',
		'<span>foo</span>{}<span>bar</span><p>extra',
		'<span>foo[</span><span>]bar</span><p>extra',
		'foo[bar]baz<p>extra',
		'foo]bar[baz<p>extra',
		'{<p><p> <p>foo</p>}',
		'foo[bar<i>baz]qoz</i>quz<p>extra',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'<div>[foobar]</div>',
		'<p>[foobar]</p>',
		'<blockquote>[foobar]</blockquote>',
		'<h1>[foobar]</h1>',
		'<h2>[foobar]</h2>',
		'<h3>[foobar]</h3>',
		'<h4>[foobar]</h4>',
		'<h5>[foobar]</h5>',
		'<h6>[foobar]</h6>',
		'<dl><dt>[foo]<dd>bar</dl>',
		'<dl><dt>foo<dd>[bar]</dl>',
		'<dl><dt>[foo<dd>bar]</dl>',
		'<ol><li>[foobar]</ol>',
		'<ul><li>[foobar]</ul>',
		'<address>[foobar]</address>',
		'<pre>[foobar]</pre>',
		'<article>[foobar]</article>',
		'<ins>[foobar]</ins>',
		'<del>[foobar]</del>',
		'<quasit>[foobar]</quasit>',
		'<quasit style="display: block">[foobar]</quasit>',

		['<p>', 'foo[]bar<p>extra'],
		['<p>', '<span>foo</span>{}<span>bar</span><p>extra'],
		['<p>', '<span>foo[</span><span>]bar</span><p>extra'],
		['<p>', 'foo[bar]baz<p>extra'],
		['<p>', 'foo]bar[baz<p>extra'],
		['<p>', '{<p><p> <p>foo</p>}'],
		['<p>', 'foo[bar<i>baz]qoz</i>quz<p>extra'],

		['<p>', '<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>'],
		['<p>', '<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>'],
		['<p>', '<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>'],
		['<p>', '<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>'],
		['<p>', '<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>'],
		['<p>', '{<table><tr><td>foo<td>bar<td>baz</table>}'],

		['<p>', '<div>[foobar]</div>'],
		['<p>', '<p>[foobar]</p>'],
		['<p>', '<blockquote>[foobar]</blockquote>'],
		['<p>', '<h1>[foobar]</h1>'],
		['<p>', '<h2>[foobar]</h2>'],
		['<p>', '<h3>[foobar]</h3>'],
		['<p>', '<h4>[foobar]</h4>'],
		['<p>', '<h5>[foobar]</h5>'],
		['<p>', '<h6>[foobar]</h6>'],
		['<p>', '<dl><dt>[foo]<dd>bar</dl>'],
		['<p>', '<dl><dt>foo<dd>[bar]</dl>'],
		['<p>', '<dl><dt>[foo<dd>bar]</dl>'],
		['<p>', '<ol><li>[foobar]</ol>'],
		['<p>', '<ul><li>[foobar]</ul>'],
		['<p>', '<address>[foobar]</address>'],
		['<p>', '<pre>[foobar]</pre>'],
		['<p>', '<article>[foobar]</article>'],
		['<p>', '<ins>[foobar]</ins>'],
		['<p>', '<del>[foobar]</del>'],
		['<p>', '<quasit>[foobar]</quasit>'],
		['<p>', '<quasit style="display: block">[foobar]</quasit>'],

		['<blockquote>', '<blockquote>[foo]</blockquote><p>extra'],
		['<blockquote>', '<blockquote><p>[foo]<p>bar</blockquote><p>extra'],
		['<blockquote>', '[foo]<blockquote>bar</blockquote><p>extra'],
		['<blockquote>', '<p>[foo<p>bar]<p>baz'],
		['<blockquote>', '<section>[foo]</section>'],
		['<blockquote>', '<section><p>[foo]</section>'],
		['<blockquote>', '<section><hgroup><h1>[foo]</h1><h2>bar</h2></hgroup><p>baz</section>'],
		['<article>', '<section>[foo]</section>'],

		['<p>', '<div>[foobar]</div>'],
		['<blockquote>', '<div>[foobar]</div>'],
		['<h1>', '<div>[foobar]</div>'],
		['<h2>', '<div>[foobar]</div>'],
		['<h3>', '<div>[foobar]</div>'],
		['<h4>', '<div>[foobar]</div>'],
		['<h5>', '<div>[foobar]</div>'],
		['<h6>', '<div>[foobar]</div>'],
		['<dl>', '<div>[foobar]</div>'],
		['<dt>', '<div>[foobar]</div>'],
		['<dd>', '<div>[foobar]</div>'],
		['<ol>', '<div>[foobar]</div>'],
		['<ul>', '<div>[foobar]</div>'],
		['<li>', '<div>[foobar]</div>'],
		['<address>', '<div>[foobar]</div>'],
		['<pre>', '<div>[foobar]</div>'],
		['<article>', '<div>[foobar]</div>'],
		['<ins>', '<div>[foobar]</div>'],
		['<del>', '<div>[foobar]</div>'],
		['<quasit>', '<div>[foobar]</div>'],

		['<div>', '<p>[foobar]</p>'],
		['<p>', '<p>[foobar]</p>'],
		['<blockquote>', '<p>[foobar]</p>'],
		['<h1>', '<p>[foobar]</p>'],
		['<h2>', '<p>[foobar]</p>'],
		['<h3>', '<p>[foobar]</p>'],
		['<h4>', '<p>[foobar]</p>'],
		['<h5>', '<p>[foobar]</p>'],
		['<h6>', '<p>[foobar]</p>'],
		['<dl>', '<p>[foobar]</p>'],
		['<dt>', '<p>[foobar]</p>'],
		['<dd>', '<p>[foobar]</p>'],
		['<ol>', '<p>[foobar]</p>'],
		['<ul>', '<p>[foobar]</p>'],
		['<li>', '<p>[foobar]</p>'],
		['<address>', '<p>[foobar]</p>'],
		['<pre>', '<p>[foobar]</p>'],
		['<ins>', '<p>[foobar]</p>'],
		['<del>', '<p>[foobar]</p>'],
		['<quasit>', '<p>[foobar]</p>'],
		['<article>', '<p>[foobar]</p>'],
		['<aside>', '<p>[foobar]</p>'],
		['<body>', '<p>[foobar]</p>'],
		['<figcaption>', '<p>[foobar]</p>'],
		['<figure>', '<p>[foobar]</p>'],
		['<footer>', '<p>[foobar]</p>'],
		['<header>', '<p>[foobar]</p>'],
		['<head>', '<p>[foobar]</p>'],
		['<hgroup>', '<p>[foobar]</p>'],
		['<html>', '<p>[foobar]</p>'],
		['<nav>', '<p>[foobar]</p>'],
		['<section>', '<p>[foobar]</p>'],

		['<div>', '<p>[foo<p>bar]'],
		['<p>', '<p>[foo<p>bar]'],
		['<blockquote>', '<p>[foo<p>bar]'],
		['<h1>', '<p>[foo<p>bar]'],
		['<h2>', '<p>[foo<p>bar]'],
		['<h3>', '<p>[foo<p>bar]'],
		['<h4>', '<p>[foo<p>bar]'],
		['<h5>', '<p>[foo<p>bar]'],
		['<h6>', '<p>[foo<p>bar]'],
		['<dl>', '<p>[foo<p>bar]'],
		['<dt>', '<p>[foo<p>bar]'],
		['<dd>', '<p>[foo<p>bar]'],
		['<ol>', '<p>[foo<p>bar]'],
		['<ul>', '<p>[foo<p>bar]'],
		['<li>', '<p>[foo<p>bar]'],
		['<address>', '<p>[foo<p>bar]'],
		['<pre>', '<p>[foo<p>bar]'],
		['<ins>', '<p>[foo<p>bar]'],
		['<del>', '<p>[foo<p>bar]'],
		['<quasit>', '<p>[foo<p>bar]'],
		['<article>', '<p>[foo<p>bar]'],
		['<aside>', '<p>[foo<p>bar]'],
		['<body>', '<p>[foo<p>bar]'],
		['<figcaption>', '<p>[foo<p>bar]'],
		['<figure>', '<p>[foo<p>bar]'],
		['<footer>', '<p>[foo<p>bar]'],
		['<header>', '<p>[foo<p>bar]'],
		['<head>', '<p>[foo<p>bar]'],
		['<hgroup>', '<p>[foo<p>bar]'],
		['<html>', '<p>[foo<p>bar]'],
		['<nav>', '<p>[foo<p>bar]'],
		['<section>', '<p>[foo<p>bar]'],

		['p', '<div>[foobar]</div>'],

		'<ol><li>[foo]<li>bar</ol>',

		['<p>', '<h1>[foo]<br>bar</h1>'],
		['<p>', '<h1>foo<br>[bar]</h1>'],
		['<p>', '<h1>[foo<br>bar]</h1>'],
		['<address>', '<h1>[foo]<br>bar</h1>'],
		['<address>', '<h1>foo<br>[bar]</h1>'],
		['<address>', '<h1>[foo<br>bar]</h1>'],
		['<pre>', '<h1>[foo]<br>bar</h1>'],
		['<pre>', '<h1>foo<br>[bar]</h1>'],
		['<pre>', '<h1>[foo<br>bar]</h1>'],
		['<h2>', '<h1>[foo]<br>bar</h1>'],
		['<h2>', '<h1>foo<br>[bar]</h1>'],
		['<h2>', '<h1>[foo<br>bar]</h1>'],

		['<h1>', '<p>[foo]<br>bar</p>'],
		['<h1>', '<p>foo<br>[bar]</p>'],
		['<h1>', '<p>[foo<br>bar]</p>'],
		['<address>', '<p>[foo]<br>bar</p>'],
		['<address>', '<p>foo<br>[bar]</p>'],
		['<address>', '<p>[foo<br>bar]</p>'],
		['<pre>', '<p>[foo]<br>bar</p>'],
		['<pre>', '<p>foo<br>[bar]</p>'],
		['<pre>', '<p>[foo<br>bar]</p>'],

		['<p>', '<address>[foo]<br>bar</address>'],
		['<p>', '<address>foo<br>[bar]</address>'],
		['<p>', '<address>[foo<br>bar]</address>'],
		['<pre>', '<address>[foo]<br>bar</address>'],
		['<pre>', '<address>foo<br>[bar]</address>'],
		['<pre>', '<address>[foo<br>bar]</address>'],
		['<h1>', '<address>[foo]<br>bar</address>'],
		['<h1>', '<address>foo<br>[bar]</address>'],
		['<h1>', '<address>[foo<br>bar]</address>'],

		['<p>', '<pre>[foo]<br>bar</pre>'],
		['<p>', '<pre>foo<br>[bar]</pre>'],
		['<p>', '<pre>[foo<br>bar]</pre>'],
		['<address>', '<pre>[foo]<br>bar</pre>'],
		['<address>', '<pre>foo<br>[bar]</pre>'],
		['<address>', '<pre>[foo<br>bar]</pre>'],
		['<h1>', '<pre>[foo]<br>bar</pre>'],
		['<h1>', '<pre>foo<br>[bar]</pre>'],
		['<h1>', '<pre>[foo<br>bar]</pre>'],

		['<h1>', '<p>[foo</p>bar]'],
		['<p>', '<div>[foo<p>bar]</p></div>'],
		['<p>', '<xmp>[foo]</xmp>'],
		['<div>', '<xmp>[foo]</xmp>'],
	],
	//@}
	forwarddelete: [
	//@{
		// Collapsed selection
		'foo[]',
		'<span>foo[]</span>',
		'<p>foo[]</p>',
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'foo[]<span style=display:none>bar</span>baz',
		'fo[]&ouml;bar',
		'fo[]o&#x308;bar',

		'<p>foo[]</p><p>bar</p>',
		'<p>foo[]</p>bar',
		'foo[]<p>bar</p>',
		'<p>foo[]<br></p><p>bar</p>',
		'<p>foo[]<br></p>bar',
		'foo[]<br><p>bar</p>',

		'<div><p>foo[]</p></div><p>bar</p>',
		'<p>foo[]</p><div><p>bar</p></div>',
		'<div><p>foo[]</p></div><div><p>bar</p></div>',
		'<div><p>foo[]</p></div>bar',
		'foo[]<div><p>bar</p></div>',

		'<div>foo[]</div><div>bar</div>',
		'<pre>foo[]</pre>bar',

		'foo[]<br>bar',
		'<b>foo[]</b><br>bar',
		'foo[]<hr>bar',
		'<p>foo[]<hr><p>bar',
		'<p>foo[]</p><br><p>bar</p>',
		'<p>foo[]</p><br><br><p>bar</p>',
		'<p>foo[]</p><img src=/img/lion.svg><p>bar',
		'foo[]<img src=/img/lion.svg>bar',
		'<a href=/>foo[]</a>bar',
		'foo[]<a href=/>bar</a>',

		// Tables with collapsed selection
		'foo[]<table><tr><td>bar</table>baz',
		'foo<table><tr><td>bar[]</table>baz',
		'<p>foo[]<table><tr><td>bar</table><p>baz',
		'<table><tr><td>foo[]<td>bar</table>',
		'<table><tr><td>foo[]<tr><td>bar</table>',

		'foo[]<br><table><tr><td>bar</table>baz',
		'foo<table><tr><td>bar[]<br></table>baz',
		'<p>foo[]<br><table><tr><td>bar</table><p>baz',
		'<p>foo<table><tr><td>bar[]<br></table><p>baz',
		'<table><tr><td>foo[]<br><td>bar</table>',
		'<table><tr><td>foo[]<br><tr><td>bar</table>',

		'foo<table><tr><td>bar[]</table><br>baz',
		'foo[]<table><tr><td><hr>bar</table>baz',
		'<table><tr><td>foo[]<td><hr>bar</table>',
		'<table><tr><td>foo[]<tr><td><hr>bar</table>',

		// Lists with collapsed selection
		'foo[]<ol><li>bar<li>baz</ol>',
		'foo[]<br><ol><li>bar<li>baz</ol>',
		'<ol><li>foo[]<li>bar</ol>',
		'<ol><li>foo[]<br><li>bar</ol>',
		'<ol><li>foo[]<li>bar<br>baz</ol>',

		'<ol><li><p>foo[]<li>bar</ol>',
		'<ol><li>foo[]<li><p>bar</ol>',
		'<ol><li><p>foo[]<li><p>bar</ol>',

		'<ol><li>foo[]<ul><li>bar</ul></ol>',
		'foo[]<ol><ol><li>bar</ol></ol>',
		'foo[]<div><ol><li>bar</ol></div>',

		'foo[]<dl><dt>bar<dd>baz</dl>',
		'foo[]<dl><dd>bar</dl>',
		'<dl><dt>foo[]<dd>bar</dl>',
		'<dl><dt>foo[]<dt>bar<dd>baz</dl>',
		'<dl><dt>foo<dd>bar[]<dd>baz</dl>',

		'<ol><li>foo[]</ol>bar',
		'<ol><li>foo[]<br></ol>bar',

		'<ol><li>{}<br></ol>bar',
		'<ol><li>foo<li>{}<br></ol>bar',

		// Indented stuff with collapsed selection
		'foo[]<blockquote>bar</blockquote>',
		'foo[]<blockquote><blockquote>bar</blockquote></blockquote>',
		'foo[]<blockquote><div>bar</div></blockquote>',
		'foo[]<blockquote style="color: red">bar</blockquote>',

		'foo[]<blockquote><blockquote><p>bar<p>baz</blockquote></blockquote>',
		'foo[]<blockquote><div><p>bar<p>baz</div></blockquote>',
		'foo[]<blockquote style="color: red"><p>bar<p>baz</blockquote>',

		'foo[]<blockquote><p><b>bar</b><p>baz</blockquote>',
		'foo[]<blockquote><p><strong>bar</strong><p>baz</blockquote>',
		'foo[]<blockquote><p><span>bar</span><p>baz</blockquote>',

		'foo[]<blockquote><ol><li>bar</ol></blockquote><p>extra',
		'foo[]<blockquote>bar<ol><li>baz</ol>quz</blockquote><p>extra',
		'foo<blockquote><ol><li>bar[]</li><ol><li>baz</ol><li>quz</ol></blockquote><p>extra',

		// Invisible stuff with collapsed selection
		'foo[]<span></span>bar',
		'foo[]<span><span></span></span>bar',
		'foo[]<quasit></quasit>bar',
		'foo[]<span></span><br>bar',
		'<span>foo[]<span></span></span>bar',
		'foo[]<span></span><span>bar</span>',

		// Uncollapsed selection (should be same as delete command)
		'foo[bar]baz',

		'foo<b>[bar]</b>baz',
		'foo<b>{bar}</b>baz',
		'foo{<b>bar</b>}baz',
		'foo<span>[bar]</span>baz',
		'foo<span>{bar}</span>baz',
		'foo{<span>bar</span>}baz',
		'<b>foo[bar</b><i>baz]quz</i>',
		'<p>foo</p><p>[bar]</p><p>baz</p>',
		'<p>foo</p><p>{bar}</p><p>baz</p>',
		'<p>foo</p><p>{bar</p>}<p>baz</p>',
		'<p>foo</p>{<p>bar}</p><p>baz</p>',
		'<p>foo</p>{<p>bar</p>}<p>baz</p>',

		'<p>foo[bar<p>baz]quz',
		'<p>foo[bar<div>baz]quz</div>',
		'<p>foo[bar<h1>baz]quz</h1>',
		'<div>foo[bar</div><p>baz]quz',
		'<blockquote>foo[bar</blockquote><pre>baz]quz</pre>',

		'<p><b>foo[bar</b><p>baz]quz',
		'<div><p>foo[bar</div><p>baz]quz',
		'<p>foo[bar<blockquote><p>baz]quz<p>qoz</blockquote',
		'<p>foo[bar<p style=color:red>baz]quz',
		'<p>foo[bar<p><b>baz]quz</b>',

		'<div><p>foo<p>[bar<p>baz]</div>',

		'foo[<br>]bar',
		'<p>foo[</p><p>]bar</p>',
		'<p>foo[</p><p>]bar<br>baz</p>',
		'foo[<p>]bar</p>',
		'foo{<p>}bar</p>',
		'foo[<p>]bar<br>baz</p>',
		'foo[<p>]bar</p>baz',
		'foo{<p>bar</p>}baz',
		'foo<p>{bar</p>}baz',
		'foo{<p>bar}</p>baz',
		'<p>foo[</p>]bar',
		'<p>foo{</p>}bar',
		'<p>foo[</p>]bar<br>baz',
		'<p>foo[</p>]bar<p>baz</p>',
		'foo[<div><p>]bar</div>',
		'<div><p>foo[</p></div>]bar',
		'foo[<div><p>]bar</p>baz</div>',
		'foo[<div>]bar<p>baz</p></div>',
		'<div><p>foo</p>bar[</div>]baz',
		'<div>foo<p>bar[</p></div>]baz',

		'<p>foo<br>{</p>]bar',
		'<p>foo<br><br>{</p>]bar',
		'foo<br>{<p>]bar</p>',
		'foo<br><br>{<p>]bar</p>',
		'<p>foo<br>{</p><p>}bar</p>',
		'<p>foo<br><br>{</p><p>}bar</p>',

		'<table><tbody><tr><th>foo<th>[bar]<th>baz<tr><td>quz<td>qoz<td>qiz</table>',
		'<table><tbody><tr><th>foo<th>ba[r<th>b]az<tr><td>quz<td>qoz<td>qiz</table>',
		'<table><tbody><tr><th>fo[o<th>bar<th>b]az<tr><td>quz<td>qoz<td>qiz</table>',
		'<table><tbody><tr><th>foo<th>bar<th>ba[z<tr><td>q]uz<td>qoz<td>qiz</table>',
		'<table><tbody><tr><th>[foo<th>bar<th>baz]<tr><td>quz<td>qoz<td>qiz</table>',
		'<table><tbody><tr><th>[foo<th>bar<th>baz<tr><td>quz<td>qoz<td>qiz]</table>',
		'{<table><tbody><tr><th>foo<th>bar<th>baz<tr><td>quz<td>qoz<td>qiz</table>}',
		'<table><tbody><tr><td>foo<td>ba[r<tr><td>baz<td>quz<tr><td>q]oz<td>qiz</table>',
		'<p>fo[o<table><tr><td>b]ar</table><p>baz',
		'<p>foo<table><tr><td>ba[r</table><p>b]az',
		'<p>fo[o<table><tr><td>bar</table><p>b]az',

		'<p>foo<ol><li>ba[r<li>b]az</ol><p>quz',
		'<p>foo<ol><li>bar<li>[baz]</ol><p>quz',
		'<p>fo[o<ol><li>b]ar<li>baz</ol><p>quz',
		'<p>foo<ol><li>bar<li>ba[z</ol><p>q]uz',
		'<p>fo[o<ol><li>bar<li>b]az</ol><p>quz',
		'<p>fo[o<ol><li>bar<li>baz</ol><p>q]uz',

		'<ol><li>fo[o</ol><ol><li>b]ar</ol>',
		'<ol><li>fo[o</ol><ul><li>b]ar</ul>',

		'foo[<ol><li>]bar</ol>',
		'<ol><li>foo[<li>]bar</ol>',
		'foo[<dl><dt>]bar<dd>baz</dl>',
		'foo[<dl><dd>]bar</dl>',
		'<dl><dt>foo[<dd>]bar</dl>',
		'<dl><dt>foo[<dt>]bar<dd>baz</dl>',
		'<dl><dt>foo<dd>bar[<dd>]baz</dl>',
	],
	//@}
	hilitecolor: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'foo[bar]baz',
		'foo]bar[baz',
		'{<p><p> <p>foo</p>}',
		'foo[bar<i>baz]qoz</i>quz',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'<p style="background-color: rgb(255, 136, 136)">foo[bar]baz</p>',
		'<p style="background-color: #ff8888">foo[bar]baz</p>',
		'<p style="background-color: aqua">foo[bar]baz</p>',
		'{<p style="background-color: aqua">foo</p><p>bar</p>}',
		'<span style="background-color: #ff8888">foo<span style="background-color: aqua">[bar]</span>baz</span>',
		'<span style="background-color: #f88">foo<span style="background-color: aqua">[bar]</span>baz</span>',
		'<span style="background-color: rgb(255, 136, 136)">foo<span style="background-color: aqua">[bar]</span>baz</span>',
		'<span style="background-color: #ff8888">foo<span style="background-color: aqua">b[ar]</span>baz</span>',
		'<p style="background-color: #ff8888">foo<span style="background-color: aqua">b[ar]</span>baz</p>',
		'<div style="background-color: #ff8888"><p style="background-color: aqua">b[ar]</p></div>',
		'<span style="display: block; background-color: #ff8888"><span style="display: block; background-color: aqua">b[ar]</span></span>',
	],
	//@}
	indent: [
	//@{
		// All these have a trailing unselected paragraph, because otherwise
		// Gecko is unhappy: it throws exceptions in non-CSS mode, and in CSS
		// mode it adds the indentation invisibly to the wrapper div in many
		// cases.
		'foo[]bar<p>extra',
		'<span>foo</span>{}<span>bar</span><p>extra',
		'<span>foo[</span><span>]bar</span><p>extra',
		'foo[bar]baz<p>extra',
		'<p dir=rtl>פו[בר]בז<p dir=rtl>נוםף',
		'<p dir=rtl>פו[ברבז<p>Foobar]baz<p>Extra',
		'<p>Foo[barbaz<p dir=rtl>פובר]בז<p>Extra',
		'<div><p>Foo[barbaz<p dir=rtl>פובר]בז</div><p>Extra',
		'foo]bar[baz<p>extra',
		'{<p><p> <p>foo</p>}<p>extra',
		'foo[bar<i>baz]qoz</i>quz<p>extra',
		'[]foo<p>extra',
		'foo[]<p>extra',
		'<p>[]foo<p>extra',
		'<p>foo[]<p>extra',
		'<p>{}<br>foo</p><p>extra',
		'<p>foo<br>{}</p><p>extra',
		'<span>{}<br>foo</span>bar<p>extra',
		'<span>foo<br>{}</span>bar<p>extra',
		'<p>foo</p>{}<p>bar</p>',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table><p>extra',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table><p>extra',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table><p>extra',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table><p>extra',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table><p>extra',
		'{<table><tr><td>foo<td>bar<td>baz</table>}<p>extra',

		'<p>foo[bar]</p><p>baz</p><p>extra',
		'<p>[foobar</p><p>ba]z</p><p>extra',
		'foo[bar]<br>baz<p>extra',
		'foo[bar]<br><br><br><br>baz<p>extra',
		'foobar<br>[ba]z<p>extra',
		'foobar<br><br><br><br>[ba]z<p>extra',
		'foo[bar<br>ba]z<p>extra',
		'<div>foo<p>[bar]</p>baz</div><p>extra',

		// These mimic existing indentation in various browsers, to see how
		// they cope with indenting twice.  This is spec, Gecko non-CSS, and
		// Opera:
		'<blockquote><p>foo[bar]</p><p>baz</p></blockquote><p>extra',
		'<blockquote><p>foo[bar</p><p>b]az</p></blockquote><p>extra',
		'<blockquote><p>foo[bar]</p></blockquote><p>baz</p><p>extra',
		'<blockquote><p>foo[bar</p></blockquote><p>b]az</p><p>extra',
		'<p>[foo]<blockquote><p>bar</blockquote><p>extra',
		'<p>[foo<blockquote><p>b]ar</blockquote><p>extra',
		'<p>foo<blockquote><p>bar</blockquote><p>[baz]<p>extra',
		'<p>foo<blockquote><p>[bar</blockquote><p>baz]<p>extra',
		'<p>[foo<blockquote><p>bar</blockquote><p>baz]<p>extra',
		'<blockquote><p>foo</blockquote><p>[bar]<blockquote><p>baz</blockquote><p>extra',

		'<blockquote>foo[bar]<br>baz</blockquote><p>extra',
		'<blockquote>foo[bar<br>b]az</blockquote><p>extra',
		'<blockquote>foo[bar]</blockquote>baz<p>extra',
		'<blockquote>foo[bar</blockquote>b]az<p>extra',
		'[foo]<blockquote>bar</blockquote><p>extra',
		'[foo<blockquote>b]ar</blockquote><p>extra',
		'foo<blockquote>bar</blockquote>[baz]<p>extra',
		'[foo<blockquote>bar</blockquote>baz]<p>extra',
		'<blockquote>foo</blockquote>[bar]<blockquote>baz</blockquote><p>extra',

		// IE:
		'<blockquote style="margin-right: 0" dir="ltr"><p>foo[bar]</p><p>baz</p></blockquote><p>extra',
		'<blockquote style="margin-right: 0" dir="ltr"><p>foo[bar</p><p>b]az</p></blockquote><p>extra',
		'<blockquote style="margin-right: 0" dir="ltr"><p>foo[bar]</p></blockquote><p>baz</p><p>extra',
		'<blockquote style="margin-right: 0" dir="ltr"><p>foo[bar</p></blockquote><p>b]az</p><p>extra',
		'<p>[foo]<blockquote style="margin-right: 0" dir="ltr"><p>bar</blockquote><p>extra',
		'<p>[foo<blockquote style="margin-right: 0" dir="ltr"><p>b]ar</blockquote><p>extra',
		'<p>foo<blockquote style="margin-right: 0" dir="ltr"><p>bar</blockquote><p>[baz]<p>extra',
		'<p>foo<blockquote style="margin-right: 0" dir="ltr"><p>[bar</blockquote><p>baz]<p>extra',
		'<p>[foo<blockquote style="margin-right: 0" dir="ltr"><p>bar</blockquote><p>baz]<p>extra',
		'<blockquote style="margin-right: 0" dir="ltr"><p>foo</blockquote><p>[bar]<blockquote style="margin-right: 0" dir="ltr"><p>baz</blockquote><p>extra',

		// Firefox CSS mode:
		'<p style="margin-left: 40px">foo[bar]</p><p style="margin-left: 40px">baz</p><p>extra',
		'<p style="margin-left: 40px">foo[bar</p><p style="margin-left: 40px">b]az</p><p>extra',
		'<p style="margin-left: 40px">foo[bar]</p><p>baz</p><p>extra',
		'<p style="margin-left: 40px">foo[bar</p><p>b]az</p><p>extra',
		'<p>[foo]<p style="margin-left: 40px">bar<p>extra',
		'<p>[foo<p style="margin-left: 40px">b]ar<p>extra',
		'<p>foo<p style="margin-left: 40px">bar<p>[baz]<p>extra',
		'<p>foo<p style="margin-left: 40px">[bar<p>baz]<p>extra',
		'<p>[foo<p style="margin-left: 40px">bar<p>baz]<p>extra',
		'<p style="margin-left: 40px">foo<p>[bar]<p style="margin-left: 40px">baz<p>extra',

		// WebKit:
		'<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px"><p>foo[bar]</p><p>baz</p></blockquote><p>extra',
		'<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px"><p>foo[bar</p><p>b]az</p></blockquote><p>extra',
		'<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px"><p>foo[bar]</p></blockquote><p>baz</p><p>extra',
		'<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px"><p>foo[bar</p></blockquote><p>b]az</p><p>extra',
		'<p>[foo]<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px"><p>bar</blockquote><p>extra',
		'<p>[foo<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px"><p>b]ar</blockquote><p>extra',
		'<p>foo<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px"><p>bar</blockquote><p>[baz]<p>extra',
		'<p>foo<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px"><p>[bar</blockquote><p>baz]<p>extra',
		'<p>[foo<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px"><p>bar</blockquote><p>baz]<p>extra',
		'<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px"><p>foo</blockquote><p>[bar]<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px"><p>baz</blockquote><p>extra',

		// MDC says "In Firefox, if the selection spans multiple lines at
		// different levels of indentation, only the least indented lines in
		// the selection will be indented."  Let's test that.
		'<blockquote>f[oo<blockquote>b]ar</blockquote></blockquote><p>extra',

		// Lists!
		'<ol><li>foo<li>[bar]<li>baz</ol>',
		'<ol data-start=1 data-end=2><li>foo<li>bar<li>baz</ol>',
		'<ol><li>foo</ol>[bar]',
		'<ol><li>[foo]<br>bar<li>baz</ol>',
		'<ol><li>foo<br>[bar]<li>baz</ol>',
		'<ol><li><div>[foo]</div>bar<li>baz</ol>',
		'<ol><li>foo<ol><li>[bar]<li>baz</ol><li>quz</ol>',
		'<ol><li>foo<ol><li>bar<li>[baz]</ol><li>quz</ol>',
		'<ol><li>foo</li><ol><li>[bar]<li>baz</ol><li>quz</ol>',
		'<ol><li>foo</li><ol data-start=0 data-end=1><li>bar<li>baz</ol><li>quz</ol>',
		'<ol><li>foo</li><ol><li>bar<li>[baz]</ol><li>quz</ol>',
		'<ol><li>foo</li><ol data-start=1 data-end=2><li>bar<li>baz</ol><li>quz</ol>',
		'<ol><li>foo<ol><li>b[a]r</ol><li>baz</ol>',
		'<ol><li>foo</li><ol><li>b[a]r</ol><li>baz</ol>',
		'<ol><li>foo{<ol><li>bar</ol>}<li>baz</ol>',
		'<ol><li>foo</li>{<ol><li>bar</ol>}<li>baz</ol>',
		'<ol><li>[foo]<ol><li>bar</ol><li>baz</ol>',
		'<ol><li>[foo]</li><ol><li>bar</ol><li>baz</ol>',
		'<ol><li>foo<li>[bar]<ol><li>baz</ol><li>quz</ol>',
		'<ol><li>foo<li>[bar]</li><ol><li>baz</ol><li>quz</ol>',
		'<ol><li>foo<ol><li>bar<li>baz</ol><li>[quz]</ol>',
		'<ol><li>foo</li><ol><li>bar<li>baz</ol><li>[quz]</ol>',

		// Try indenting multiple items at once.
		'<ol><li>foo<li>b[ar<li>baz]</ol>',
		'<ol><li>[foo<ol><li>bar]</ol><li>baz</ol>',
		'<ol><li>[foo</li><ol><li>bar]</ol><li>baz</ol>',
		'<ol><li>foo<ol><li>b[ar</ol><li>b]az</ol>',
		'<ol><li>foo</li><ol><li>b[ar</ol><li>b]az</ol>',
		'<ol><li>[foo<ol><li>bar</ol><li>baz]</ol><p>extra',
		'<ol><li>[foo</li><ol><li>bar</ol><li>baz]</ol><p>extra',

		// We probably can't actually get this DOM . . .
		'<ol><li>[foo]<ol><li>bar</ol>baz</ol>',
		'<ol><li>foo<ol><li>[bar]</ol>baz</ol>',
		'<ol><li>foo<ol><li>bar</ol>[baz]</ol>',
		'<ol><li>[foo<ol><li>bar]</ol>baz</ol>',
	],
	//@}
	inserthorizontalrule: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'<p>foo[bar<p>baz]quz',
		'<div><b>foo</b>{}<b>bar</b></div>',
		'<div><b>foo[</b><b>]bar</b></div>',
		'<div><b>foo</b>{<b>bar</b>}<b>baz</b></div>',
		'<b>foo[]bar</b>',
		'<b id=abc>foo[]bar</b>',
		["abc", 'foo[bar]baz'],
		'foo[bar]baz',

		'foo<b>[bar]</b>baz',
		'foo<b>{bar}</b>baz',
		'foo{<b>bar</b>}baz',
		'<p>foo<p>[bar]<p>baz',
		'<p>foo<p>{bar}<p>baz',
		'<p>foo{<p>bar</p>}<p>baz',

		'<p>foo[bar]baz</p>',
		'<p id=abc>foo[bar]baz</p>',
		'<h1>foo[bar]baz</h1>',
		'<p>foo<b>b[a]r</b>baz</p>',

		'<a>foo[bar]baz</a>',
		'<a href=/>foo[bar]baz</a>',
		'<abbr>foo[bar]baz</abbr>',
		'<address>foo[bar]baz</address>',
		'<article>foo[bar]baz</article>',
		'<aside>foo[bar]baz</aside>',
		'<b>foo[bar]baz</b>',
		'<bdi>foo[bar]baz</bdi>',
		'<bdo dir=rtl>foo[bar]baz</bdo>',
		'<blockquote>foo[bar]baz</blockquote>',
		'<table><caption>foo[bar]baz</caption><tr><td>quz</table>',
		'<cite>foo[bar]baz</cite>',
		'<code>foo[bar]baz</code>',
		'<dl><dd>foo[bar]baz</dd></dl>',
		'<del>foo[bar]baz</del>',
		'<details>foo[bar]baz</details>',
		'<dfn>foo[bar]baz</dfn>',
		'<div>foo[bar]baz</div>',
		'<dl><dt>foo[bar]baz</dt></dl>',
		'<em>foo[bar]baz</em>',
		'<figure><figcaption>foo[bar]baz</figcaption>quz</figure>',
		'<figure>foo[bar]baz</figure>',
		'<footer>foo[bar]baz</footer>',
		'<h1>foo[bar]baz</h1>',
		'<h2>foo[bar]baz</h2>',
		'<h3>foo[bar]baz</h3>',
		'<h4>foo[bar]baz</h4>',
		'<h5>foo[bar]baz</h5>',
		'<h6>foo[bar]baz</h6>',
		'<header>foo[bar]baz</header>',
		'<hgroup>foo[bar]baz</hgroup>',
		'<hgroup><h1>foo[bar]baz</h1></hgroup>',
		'<i>foo[bar]baz</i>',
		'<ins>foo[bar]baz</ins>',
		'<kbd>foo[bar]baz</kbd>',
		'<mark>foo[bar]baz</mark>',
		'<nav>foo[bar]baz</nav>',
		'<ol><li>foo[bar]baz</li></ol>',
		'<p>foo[bar]baz</p>',
		'<pre>foo[bar]baz</pre>',
		'<q>foo[bar]baz</q>',
		'<ruby>foo[bar]baz<rt>quz</rt></ruby>',
		'<ruby>foo<rt>bar[baz]quz</rt></ruby>',
		'<ruby>foo<rp>bar[baz]quz</rp><rt>qoz</rt><rp>qiz</rp></ruby>',
		'<s>foo[bar]baz</s>',
		'<samp>foo[bar]baz</samp>',
		'<section>foo[bar]baz</section>',
		'<small>foo[bar]baz</small>',
		'<span>foo[bar]baz</span>',
		'<strong>foo[bar]baz</strong>',
		'<sub>foo[bar]baz</sub>',
		'<sup>foo[bar]baz</sup>',
		'<table><tr><td>foo[bar]baz</td></table>',
		'<table><tr><th>foo[bar]baz</th></table>',
		'<u>foo[bar]baz</u>',
		'<ul><li>foo[bar]baz</li></ul>',
		'<var>foo[bar]baz</var>',

		'<acronym>foo[bar]baz</acronym>',
		'<big>foo[bar]baz</big>',
		'<blink>foo[bar]baz</blink>',
		'<center>foo[bar]baz</center>',
		'<dir>foo[bar]baz</dir>',
		'<dir><li>foo[bar]baz</li></dir>',
		'<font>foo[bar]baz</font>',
		'<listing>foo[bar]baz</listing>',
		'<marquee>foo[bar]baz</marquee>',
		'<nobr>foo[bar]baz</nobr>',
		'<strike>foo[bar]baz</strike>',
		'<tt>foo[bar]baz</tt>',
		'<xmp>foo[bar]baz</xmp>',

		'<quasit>foo[bar]baz</quasit>',
	],
	//@}
	inserthtml: [
	//@{
		'foo[]bar',
		'foo[bar]baz',
		['', 'foo[bar]baz'],
		['\0', 'foo[bar]baz'],
		['\x07', 'foo[bar]baz'],
		['\ud800', 'foo[bar]baz'],

		['<b>', 'foo[bar]baz'],
		['<b>abc', 'foo[bar]baz'],
		['<p>abc', '<p>foo[bar]baz'],
		['<li>abc', '<p>foo[bar]baz'],
		['<p>abc', '<ol>{<li>foo</li>}<li>bar</ol>'],
		['<p>abc', '<ol><li>foo</li>{<li>bar</li>}<li>baz</ol>'],
		['<p>abc', '<ol><li>[foo]</li><li>bar</ol>'],

		['abc', '<xmp>f[o]o</xmp>'],
		['<b>abc</b>', '<xmp>f[o]o</xmp>'],
		['abc', '<script>f[o]o</script>bar'],
		['<b>abc</b>', '<script>f[o]o</script>bar'],

		['<a>abc</a>', '<a>f[o]o</a>'],
		['<a href=/>abc</a>', '<a href=.>f[o]o</a>'],
		['<hr>', '<p>f[o]o'],
		['<hr>', '<b>f[o]o</b>'],
		['<h2>abc</h2>', '<h1>f[o]o</h1>'],
		['<td>abc</td>', '<table><tr><td>f[o]o</table>'],
		['<td>abc</td>', 'f[o]o'],

		['<dt>abc</dt>', '<dl><dt>f[o]o<dd>bar</dl>'],
		['<dt>abc</dt>', '<dl><dt>foo<dd>b[a]r</dl>'],
		['<dd>abc</dd>', '<dl><dt>f[o]o<dd>bar</dl>'],
		['<dd>abc</dd>', '<dl><dt>foo<dd>b[a]r</dl>'],
		['<dt>abc</dt>', 'f[o]o'],
		['<dt>abc</dt>', '<ol><li>f[o]o</ol>'],
		['<dd>abc</dd>', 'f[o]o'],
		['<dd>abc</dd>', '<ol><li>f[o]o</ol>'],

		['<li>abc</li>', '<dir><li>f[o]o</dir>'],
		['<li>abc</li>', '<ol><li>f[o]o</ol>'],
		['<li>abc</li>', '<ul><li>f[o]o</ul>'],
		['<dir><li>abc</dir>', '<dir><li>f[o]o</dir>'],
		['<dir><li>abc</dir>', '<ol><li>f[o]o</ol>'],
		['<dir><li>abc</dir>', '<ul><li>f[o]o</ul>'],
		['<ol><li>abc</ol>', '<dir><li>f[o]o</dir>'],
		['<ol><li>abc</ol>', '<ol><li>f[o]o</ol>'],
		['<ol><li>abc</ol>', '<ul><li>f[o]o</ul>'],
		['<ul><li>abc</ul>', '<dir><li>f[o]o</dir>'],
		['<ul><li>abc</ul>', '<ol><li>f[o]o</ol>'],
		['<ul><li>abc</ul>', '<ul><li>f[o]o</ul>'],
		['<li>abc</li>', 'f[o]o'],

		['<nobr>abc</nobr>', '<nobr>f[o]o</nobr>'],
		['<nobr>abc</nobr>', 'f[o]o'],
	],
	//@}
	insertimage: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		["", 'foo[bar]baz'],
		'foo[bar]baz',

		'foo<b>[bar]</b>baz',
		'foo<b>{bar}</b>baz',
		'foo{<b>bar</b>}baz',
		'foo<span>[bar]</span>baz',
		'foo<span>{bar}</span>baz',
		'foo{<span>bar</span>}baz',
		'<b>foo[bar</b><i>baz]quz</i>',
		'<p>foo</p><p>[bar]</p><p>baz</p>',
		'<p>foo</p><p>{bar}</p><p>baz</p>',
		'<p>foo</p>{<p>bar</p>}<p>baz</p>',

		'<p>foo[bar<p>baz]quz',
		'<p>foo[bar<div>baz]quz</div>',
		'<p>foo[bar<h1>baz]quz</h1>',
		'<div>foo[bar</div><p>baz]quz',
		'<blockquote>foo[bar</blockquote><pre>baz]quz</pre>',

		'<p><b>foo[bar</b><p>baz]quz',
		'<div><p>foo[bar</div><p>baz]quz',
		'<p>foo[bar<blockquote><p>baz]quz<p>qoz</blockquote',
		'<p>foo[bar<p style=color:red>baz]quz',
		'<p>foo[bar<p><b>baz]quz</b>',

		'<div><p>foo<p>[bar<p>baz]</div>',

		'foo[<br>]bar',
		'<p>foo[</p><p>]bar</p>',
		'<p>foo[</p><p>]bar<br>baz</p>',
		'foo[<p>]bar</p>',
		'foo[<p>]bar<br>baz</p>',
		'foo[<p>]bar</p>baz',
		'<p>foo[</p>]bar',
		'<p>foo[</p>]bar<br>baz',
		'<p>foo[</p>]bar<p>baz</p>',
		'foo[<div><p>]bar</div>',
		'<div><p>foo[</p></div>]bar',
		'foo[<div><p>]bar</p>baz</div>',
		'foo[<div>]bar<p>baz</p></div>',
		'<div><p>foo</p>bar[</div>]baz',
		'<div>foo<p>bar[</p></div>]baz',
	],
	//@}
	insertlinebreak: [
	//@{ Just the same as insertparagraph (set below).
	],
	//@}
	insertorderedlist: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'foo[bar]baz',
		'foo]bar[baz',
		'{<p><p> <p>foo</p>}',
		'foo[bar<b>baz]qoz</b>quz',
		'foo<br>[bar]',
		'f[oo<br>b]ar<br>baz',
		'<p>[foo]<br>bar</p>',
		'[foo<ol><li>bar]</ol>baz',
		'foo<ol><li>[bar</ol>baz]',
		'[foo<ul><li>bar]</ul>baz',
		'foo<ul><li>[bar</ul>baz]',
		'foo<ul><li>[bar</ul><ol><li>baz]</ol>quz',
		'foo<ol><li>[bar</ol><ul><li>baz]</ul>quz',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'<p>foo<p>[bar]<p>baz',
		'<p>foo<blockquote>[bar]</blockquote><p>baz',
		'<dl><dt>foo<dd>[bar]<dt>baz<dd>quz</dl>',
		'<dl><dt>foo<dd>bar<dt>[baz]<dd>quz</dl>',

		'<p>foo<p>b[a]r<p>baz',
		'<p>foo<blockquote>b[a]r</blockquote><p>baz',
		'<dl><dt>foo<dd>b[a]r<dt>baz<dd>quz</dl>',
		'<dl><dt>foo<dd>bar<dt>b[a]z<dd>quz</dl>',

		'<p>[foo<p>bar]<p>baz',
		'<p>[foo<blockquote>bar]</blockquote><p>baz',
		'<dl><dt>[foo<dd>bar]<dt>baz<dd>quz</dl>',
		'<dl><dt>foo<dd>[bar<dt>baz]<dd>quz</dl>',

		'<p>[foo<blockquote><p>bar]<p>baz</blockquote>',


		// Various <ol> stuff
		'<ol><li>foo<li>[bar]<li>baz</ol>',
		'<ol data-start=1 data-end=2><li>foo<li>bar<li>baz</ol>',
		'<ol><li>foo</ol>[bar]',
		'[foo]<ol><li>bar</ol>',
		'<ol><li>foo</ol>[bar]<ol><li>baz</ol>',
		'<ol><ol><li>[foo]</ol></ol>',
		'<ol><li>[foo]<br>bar<li>baz</ol>',
		'<ol><li>foo<br>[bar]<li>baz</ol>',
		'<ol><li><div>[foo]</div>bar<li>baz</ol>',
		'<ol><li>foo<ol><li>[bar]<li>baz</ol><li>quz</ol>',
		'<ol><li>foo<ol><li>bar<li>[baz]</ol><li>quz</ol>',
		'<ol><li>foo</li><ol><li>[bar]<li>baz</ol><li>quz</ol>',
		'<ol><li>foo</li><ol data-start=0 data-end=1><li>bar<li>baz</ol><li>quz</ol>',
		'<ol><li>foo</li><ol><li>bar<li>[baz]</ol><li>quz</ol>',
		'<ol><li>foo</li><ol data-start=1 data-end=2><li>bar<li>baz</ol><li>quz</ol>',
		'<ol><li>foo<ol><li>b[a]r</ol><li>baz</ol>',
		'<ol><li>foo</li><ol><li>b[a]r</ol><li>baz</ol>',
		'<ol><li>foo{<ol><li>bar</ol>}<li>baz</ol>',
		'<ol><li>foo</li>{<ol><li>bar</ol>}<li>baz</ol>',
		'<ol><li>[foo]<ol><li>bar</ol><li>baz</ol>',
		'<ol><li>[foo]</li><ol><li>bar</ol><li>baz</ol>',
		'<ol><li>foo<li>[bar]<ol><li>baz</ol><li>quz</ol>',
		'<ol><li>foo<li>[bar]</li><ol><li>baz</ol><li>quz</ol>',
		'<ol><li>foo<ol><li>bar<li>baz</ol><li>[quz]</ol>',
		'<ol><li>foo</li><ol><li>bar<li>baz</ol><li>[quz]</ol>',

		// Multiple items at once.
		'<ol><li>foo<li>b[ar<li>baz]</ol>',
		'<ol><li>[foo<ol><li>bar]</ol><li>baz</ol>',
		'<ol><li>[foo</li><ol><li>bar]</ol><li>baz</ol>',
		'<ol><li>foo<ol><li>b[ar</ol><li>b]az</ol>',
		'<ol><li>foo</li><ol><li>b[ar</ol><li>b]az</ol>',
		'<ol><li>[foo<ol><li>bar</ol><li>baz]</ol><p>extra',
		'<ol><li>[foo</li><ol><li>bar</ol><li>baz]</ol><p>extra',
		'<ol><li>foo<li>[bar</li><ol><li>baz</ol><li>quz]</ol>',

		// We probably can't actually get this DOM . . .
		'<ol><li>[foo]<ol><li>bar</ol>baz</ol>',
		'<ol><li>foo<ol><li>[bar]</ol>baz</ol>',
		'<ol><li>foo<ol><li>bar</ol>[baz]</ol>',
		'<ol><li>[foo<ol><li>bar]</ol>baz</ol>',


		// Same stuff but with <ul>
		'<ul><li>foo<li>[bar]<li>baz</ul>',
		'<ol data-start=1 data-end=2><li>foo<li>bar<li>baz</ul>',
		'<ul><li>foo</ul>[bar]',
		'[foo]<ul><li>bar</ul>',
		'<ul><li>foo</ul>[bar]<ul><li>baz</ul>',
		'<ul><ul><li>[foo]</ul></ul>',
		'<ul><li>[foo]<br>bar<li>baz</ul>',
		'<ul><li>foo<br>[bar]<li>baz</ul>',
		'<ul><li><div>[foo]</div>bar<li>baz</ul>',
		'<ul><li>foo<ul><li>[bar]<li>baz</ul><li>quz</ul>',
		'<ul><li>foo<ul><li>bar<li>[baz]</ul><li>quz</ul>',
		'<ul><li>foo</li><ul><li>[bar]<li>baz</ul><li>quz</ul>',
		'<ul><li>foo</li><ul data-start=0 data-end=1><li>bar<li>baz</ul><li>quz</ul>',
		'<ul><li>foo</li><ul><li>bar<li>[baz]</ul><li>quz</ul>',
		'<ul><li>foo</li><ul data-start=1 data-end=2><li>bar<li>baz</ul><li>quz</ul>',
		'<ul><li>foo<ul><li>b[a]r</ul><li>baz</ul>',
		'<ul><li>foo</li><ul><li>b[a]r</ul><li>baz</ul>',
		'<ul><li>foo{<ul><li>bar</ul>}<li>baz</ul>',
		'<ul><li>foo</li>{<ul><li>bar</ul>}<li>baz</ul>',
		'<ul><li>[foo]<ul><li>bar</ul><li>baz</ul>',
		'<ul><li>[foo]</li><ul><li>bar</ul><li>baz</ul>',
		'<ul><li>foo<li>[bar]<ul><li>baz</ul><li>quz</ul>',
		'<ul><li>foo<li>[bar]</li><ul><li>baz</ul><li>quz</ul>',
		'<ul><li>foo<ul><li>bar<li>baz</ul><li>[quz]</ul>',
		'<ul><li>foo</li><ul><li>bar<li>baz</ul><li>[quz]</ul>',

		// Multiple items at once.
		'<ul><li>foo<li>b[ar<li>baz]</ul>',
		'<ul><li>[foo<ul><li>bar]</ul><li>baz</ul>',
		'<ul><li>[foo</li><ul><li>bar]</ul><li>baz</ul>',
		'<ul><li>foo<ul><li>b[ar</ul><li>b]az</ul>',
		'<ul><li>foo</li><ul><li>b[ar</ul><li>b]az</ul>',
		'<ul><li>[foo<ul><li>bar</ul><li>baz]</ul><p>extra',
		'<ul><li>[foo</li><ul><li>bar</ul><li>baz]</ul><p>extra',
		'<ul><li>foo<li>[bar</li><ul><li>baz</ul><li>quz]</ul>',

		// We probably can't actually get this DOM . . .
		'<ul><li>[foo]<ul><li>bar</ul>baz</ul>',
		'<ul><li>foo<ul><li>[bar]</ul>baz</ul>',
		'<ul><li>foo<ul><li>bar</ul>[baz]</ul>',
		'<ul><li>[foo<ul><li>bar]</ul>baz</ul>',


		// Mix of <ol> and <ul>
		'foo<ol><li>bar</ol><ul><li>[baz]</ul>quz',
		'foo<ol><li>bar</ol><ul><li>[baz</ul>quz]',
		'foo<ul><li>[bar]</ul><ol><li>baz</ol>quz',
		'[foo<ul><li>bar]</ul><ol><li>baz</ol>quz',
		'<ol><li>foo</li><ul><li>[bar]</ul><li>baz</ol>',
		'<ul><li>foo</li><ol><li>[bar]</ol><li>baz</ul>',

		// Interaction with indentation
		'[foo]<blockquote>bar</blockquote>baz',
		'foo<blockquote>[bar]</blockquote>baz',
		'[foo<blockquote>bar]</blockquote>baz',
		'<ol><li>foo</ol><blockquote>[bar]</blockquote>baz',
		'[foo]<blockquote><ol><li>bar</ol></blockquote>baz',
		'foo<blockquote>[bar]<br>baz</blockquote>',
		'[foo<blockquote>bar]<br>baz</blockquote>',
		'<ol><li>foo</ol><blockquote>[bar]<br>baz</blockquote>',

		'<p>[foo]<blockquote><p>bar</blockquote><p>baz',
		'<p>foo<blockquote><p>[bar]</blockquote><p>baz',
		'<p>[foo<blockquote><p>bar]</blockquote><p>baz',
		'<ol><li>foo</ol><blockquote><p>[bar]</blockquote><p>baz',
		'<p>[foo]<blockquote><ol><li><p>bar</ol></blockquote><p>baz',
		'<p>foo<blockquote><p>[bar]<p>baz</blockquote>',
		'<p>[foo<blockquote><p>bar]<p>baz</blockquote>',
		'<ol><li>foo</ol><blockquote><p>[bar]<p>baz</blockquote>',

		'[foo]<div style="margin: 0 40px">bar</div>baz',
		'foo<div style="margin: 0 40px">[bar]</div>baz',
		'[foo<div style="margin: 0 40px">bar]</div>baz',
		'<ol><li>foo</ol><div style="margin: 0 40px">[bar]</div>baz',
		'[foo]<div style="margin: 0 40px"><ol><li>bar</ol></div>baz',
		'foo<div style="margin: 0 40px">[bar]<br>baz</div>',
		'[foo<div style="margin: 0 40px">bar]<br>baz</div>',
		'<ol><li>foo</ol><div style="margin: 0 40px">[bar]<br>baz</div>',

		'<p>[foo]<div style="margin: 0 40px"><p>bar</div><p>baz',
		'<p>foo<div style="margin: 0 40px"><p>[bar]</div><p>baz',
		'<p>[foo<div style="margin: 0 40px"><p>bar]</div><p>baz',
		'<ol><li>foo</ol><div style="margin: 0 40px"><p>[bar]</div><p>baz',
		'<p>[foo]<div style="margin: 0 40px"><ol><li><p>bar</ol></div><p>baz',
		'<p>foo<div style="margin: 0 40px"><p>[bar]<p>baz</div>',
		'<p>[foo<div style="margin: 0 40px"><p>bar]<p>baz</div>',
		'<ol><li>foo</ol><div style="margin: 0 40px"><p>[bar]<p>baz</div>',

		// Attributes
		'<ul id=abc><li>foo<li>[bar]<li>baz</ul>',
		'<ul style=color:red><li>foo<li>[bar]<li>baz</ul>',
		'<ul style=text-indent:1em><li>foo<li>[bar]<li>baz</ul>',
		'<ul id=abc><li>[foo]<li>bar<li>baz</ul>',
		'<ul style=color:red><li>[foo]<li>bar<li>baz</ul>',
		'<ul style=text-indent:1em><li>[foo]<li>bar<li>baz</ul>',
		'<ul id=abc><li>foo<li>bar<li>[baz]</ul>',
		'<ul style=color:red><li>foo<li>bar<li>[baz]</ul>',
		'<ul style=text-indent:1em><li>foo<li>bar<li>[baz]</ul>',
	],
	//@}
	insertparagraph: [
	//@{
		'foo[bar]baz',
		'fo[o<table><tr><td>b]ar</table>',
		'<table><tr><td>[foo<td>bar]<tr><td>baz<td>quz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<tr><td>baz<td>quz</table>',
		'<table><tr><td>fo[o</table>b]ar',
		'<table><tr><td>fo[o<td>b]ar<td>baz</table>',
		'{<table><tr><td>foo</table>}',
		'<table><tr><td>[foo]</table>',
		'<ol><li>[foo]<li>bar</ol>',
		'<ol><li>f[o]o<li>bar</ol>',

		'[]foo',
		'foo[]',
		'<span>foo[]</span>',
		'foo[]<br>',
		'foo[]bar',
		'<address>[]foo</address>',
		'<address>foo[]</address>',
		'<address>foo[]<br></address>',
		'<address>foo[]bar</address>',
		'<div>[]foo</div>',
		'<div>foo[]</div>',
		'<div>foo[]<br></div>',
		'<div>foo[]bar</div>',
		'<dl><dt>[]foo<dd>bar</dl>',
		'<dl><dt>foo[]<dd>bar</dl>',
		'<dl><dt>foo[]<br><dd>bar</dl>',
		'<dl><dt>foo[]bar<dd>baz</dl>',
		'<dl><dt>foo<dd>[]bar</dl>',
		'<dl><dt>foo<dd>bar[]</dl>',
		'<dl><dt>foo<dd>bar[]<br></dl>',
		'<dl><dt>foo<dd>bar[]baz</dl>',
		'<h1>[]foo</h1>',
		'<h1>foo[]</h1>',
		'<h1>foo[]<br></h1>',
		'<h1>foo[]bar</h1>',
		'<ol><li>[]foo</ol>',
		'<ol><li>foo[]</ol>',
		'<ol><li>foo[]<br></ol>',
		'<ol><li>foo[]bar</ol>',
		'<p>[]foo</p>',
		'<p>foo[]</p>',
		'<p>foo[]<br></p>',
		'<p>foo[]bar</p>',
		'<pre>[]foo</pre>',
		'<pre>foo[]</pre>',
		'<pre>foo[]<br></pre>',
		'<pre>foo[]bar</pre>',

		'<pre>foo[]<br><br></pre>',
		'<pre>foo<br>{}<br></pre>',
		'<pre>foo&#10;[]</pre>',
		'<pre>foo[]&#10;</pre>',
		'<pre>foo&#10;[]&#10;</pre>',

		'<xmp>foo[]bar</xmp>',
		'<script>foo[]bar</script>baz',

		'<ol><li>{}<br></li></ol>',
		'foo<ol><li>{}<br></li></ol>',
		'<ol><li>{}<br></li></ol>foo',
		'<ol><li>foo<li>{}<br></ol>',
		'<ol><li>{}<br><li>bar</ol>',
		'<ol><li>foo</li><ul><li>{}<br></ul></ol>',

		'<dl><dt>{}<br></dt></dl>',
		'<dl><dt>foo<dd>{}<br></dl>',
		'<dl><dt>{}<br><dd>bar</dl>',

		'<h1>foo[bar</h1><p>baz]quz</p>',
		'<p>foo[bar</p><h1>baz]quz</h1>',
		'<p>foo</p>{}<br>',
		'{}<br><p>foo</p>',
		'<p>foo</p>{}<br><h1>bar</h1>',
		'<h1>foo</h1>{}<br><p>bar</p>',
		'<h1>foo</h1>{}<br><h2>bar</h2>',
		'<p>foo</p><h1>[bar]</h1><p>baz</p>',
		'<p>foo</p>{<h1>bar</h1>}<p>baz</p>',

		'<table><tr><td>foo[]bar</table>',
		'<table><tr><td><p>foo[]bar</table>',

		'<blockquote>[]foo</blockquote>',
		'<blockquote>foo[]</blockquote>',
		'<blockquote>foo[]<br></blockquote>',
		'<blockquote>foo[]bar</blockquote>',
		'<blockquote><p>[]foo</blockquote>',
		'<blockquote><p>foo[]</blockquote>',
		'<blockquote><p>foo[]bar</blockquote>',
		'<blockquote><p>foo[]<p>bar</blockquote>',
		'<blockquote><p>foo[]bar<p>baz</blockquote>',

		'<span>foo[]bar</span>',
		'<span>foo[]bar</span>baz',
		'<b>foo[]bar</b>',
		'<b>foo[]bar</b>baz',
		'<b>foo[]</b>bar',
		'foo<b>[]bar</b>',
		'<b>foo[]</b><i>bar</i>',
		'<b id=x class=y>foo[]bar</b>',
		'<i><b>foo[]bar</b>baz</i>',

		'<p><b>foo[]bar</b></p>',
		'<p><b>[]foo</b></p>',
		'<p><b id=x class=y>foo[]bar</b></p>',
		'<div><b>foo[]bar</b></div>',

		'<a href=foo>foo[]bar</a>',
		'<a href=foo>foo[]bar</a>baz',
		'<a href=foo>foo[]</a>bar',
		'foo<a href=foo>[]bar</a>',
	],
	//@}
	inserttext: [
	//@{
		'foo[bar]baz',
		['', 'foo[bar]baz'],

		['\t', 'foo[]bar'],
		[' ', 'foo[]bar'],
		['&', 'foo[]bar'],
		['\n', 'foo[]bar'],
		['\r', 'foo[]bar'],
		['\r\n', 'foo[]bar'],
		['abc\ndef', 'foo[]bar'],
		['\0', 'foo[]bar'],
		['\ud800', 'foo[]bar'],
		['\x07', 'foo[]bar'],

		'foo[]bar',
		'<p>foo[]',
		'<p>foo</p>{}',
		'<p>[]foo',
		'<p>{}foo',
		'{}<p>foo',
		'<p>foo</p>{}<p>bar</p>',
		'<b>foo[]</b>bar',
		'<b>foo</b>[]bar',
		'foo<b>{}</b>bar',
		'<a>foo[]</a>bar',
		'<a>foo</a>[]bar',
		'<a href=/>foo[]</a>bar',
		'<a href=/>foo</a>[]bar',
		'<p>fo[o<p>b]ar',
		'<p>fo[o<p>bar<p>b]az',
		'<p>{}<br>',
	],
	//@}
	insertunorderedlist: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'foo[bar]baz',
		'foo]bar[baz',
		'{<p><p> <p>foo</p>}',
		'foo[bar<b>baz]qoz</b>quz',
		'foo<br>[bar]',
		'f[oo<br>b]ar<br>baz',
		'<p>[foo]<br>bar</p>',
		'[foo<ol><li>bar]</ol>baz',
		'foo<ol><li>[bar</ol>baz]',
		'[foo<ul><li>bar]</ul>baz',
		'foo<ul><li>[bar</ul>baz]',
		'foo<ul><li>[bar</ul><ol><li>baz]</ol>quz',
		'foo<ol><li>[bar</ol><ul><li>baz]</ul>quz',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'<p>foo<p>[bar]<p>baz',
		'<p>foo<blockquote>[bar]</blockquote><p>baz',
		'<dl><dt>foo<dd>[bar]<dt>baz<dd>quz</dl>',
		'<dl><dt>foo<dd>bar<dt>[baz]<dd>quz</dl>',

		'<p>foo<p>b[a]r<p>baz',
		'<p>foo<blockquote>b[a]r</blockquote><p>baz',
		'<dl><dt>foo<dd>b[a]r<dt>baz<dd>quz</dl>',
		'<dl><dt>foo<dd>bar<dt>b[a]z<dd>quz</dl>',

		'<p>[foo<p>bar]<p>baz',
		'<p>[foo<blockquote>bar]</blockquote><p>baz',
		'<dl><dt>[foo<dd>bar]<dt>baz<dd>quz</dl>',
		'<dl><dt>foo<dd>[bar<dt>baz]<dd>quz</dl>',

		'<p>[foo<blockquote><p>bar]<p>baz</blockquote>',


		// Various <ol> stuff
		'<ol><li>foo<li>[bar]<li>baz</ol>',
		'<ol data-start=1 data-end=2><li>foo<li>bar<li>baz</ol>',
		'<ol><li>foo</ol>[bar]',
		'[foo]<ol><li>bar</ol>',
		'<ol><li>foo</ol>[bar]<ol><li>baz</ol>',
		'<ol><ol><li>[foo]</ol></ol>',
		'<ol><li>[foo]<br>bar<li>baz</ol>',
		'<ol><li>foo<br>[bar]<li>baz</ol>',
		'<ol><li><div>[foo]</div>bar<li>baz</ol>',
		'<ol><li>foo<ol><li>[bar]<li>baz</ol><li>quz</ol>',
		'<ol><li>foo<ol><li>bar<li>[baz]</ol><li>quz</ol>',
		'<ol><li>foo</li><ol><li>[bar]<li>baz</ol><li>quz</ol>',
		'<ol><li>foo</li><ol data-start=0 data-end=1><li>bar<li>baz</ol><li>quz</ol>',
		'<ol><li>foo</li><ol><li>bar<li>[baz]</ol><li>quz</ol>',
		'<ol><li>foo</li><ol data-start=1 data-end=2><li>bar<li>baz</ol><li>quz</ol>',
		'<ol><li>foo<ol><li>b[a]r</ol><li>baz</ol>',
		'<ol><li>foo</li><ol><li>b[a]r</ol><li>baz</ol>',
		'<ol><li>foo{<ol><li>bar</ol>}<li>baz</ol>',
		'<ol><li>foo</li>{<ol><li>bar</ol>}<li>baz</ol>',
		'<ol><li>[foo]<ol><li>bar</ol><li>baz</ol>',
		'<ol><li>[foo]</li><ol><li>bar</ol><li>baz</ol>',
		'<ol><li>foo<li>[bar]<ol><li>baz</ol><li>quz</ol>',
		'<ol><li>foo<li>[bar]</li><ol><li>baz</ol><li>quz</ol>',
		'<ol><li>foo<ol><li>bar<li>baz</ol><li>[quz]</ol>',
		'<ol><li>foo</li><ol><li>bar<li>baz</ol><li>[quz]</ol>',

		// Multiple items at once.
		'<ol><li>foo<li>b[ar<li>baz]</ol>',
		'<ol><li>[foo<ol><li>bar]</ol><li>baz</ol>',
		'<ol><li>[foo</li><ol><li>bar]</ol><li>baz</ol>',
		'<ol><li>foo<ol><li>b[ar</ol><li>b]az</ol>',
		'<ol><li>foo</li><ol><li>b[ar</ol><li>b]az</ol>',
		'<ol><li>[foo<ol><li>bar</ol><li>baz]</ol><p>extra',
		'<ol><li>[foo</li><ol><li>bar</ol><li>baz]</ol><p>extra',
		'<ol><li>foo<li>[bar</li><ol><li>baz</ol><li>quz]</ol>',

		// We probably can't actually get this DOM . . .
		'<ol><li>[foo]<ol><li>bar</ol>baz</ol>',
		'<ol><li>foo<ol><li>[bar]</ol>baz</ol>',
		'<ol><li>foo<ol><li>bar</ol>[baz]</ol>',
		'<ol><li>[foo<ol><li>bar]</ol>baz</ol>',


		// Same stuff but with <ul>
		'<ul><li>foo<li>[bar]<li>baz</ul>',
		'<ol data-start=1 data-end=2><li>foo<li>bar<li>baz</ul>',
		'<ul><li>foo</ul>[bar]',
		'[foo]<ul><li>bar</ul>',
		'<ul><li>foo</ul>[bar]<ul><li>baz</ul>',
		'<ul><ul><li>[foo]</ul></ul>',
		'<ul><li>[foo]<br>bar<li>baz</ul>',
		'<ul><li>foo<br>[bar]<li>baz</ul>',
		'<ul><li><div>[foo]</div>bar<li>baz</ul>',
		'<ul><li>foo<ul><li>[bar]<li>baz</ul><li>quz</ul>',
		'<ul><li>foo<ul><li>bar<li>[baz]</ul><li>quz</ul>',
		'<ul><li>foo</li><ul><li>[bar]<li>baz</ul><li>quz</ul>',
		'<ul><li>foo</li><ul data-start=0 data-end=1><li>bar<li>baz</ul><li>quz</ul>',
		'<ul><li>foo</li><ul><li>bar<li>[baz]</ul><li>quz</ul>',
		'<ul><li>foo</li><ul data-start=1 data-end=2><li>bar<li>baz</ul><li>quz</ul>',
		'<ul><li>foo<ul><li>b[a]r</ul><li>baz</ul>',
		'<ul><li>foo</li><ul><li>b[a]r</ul><li>baz</ul>',
		'<ul><li>foo{<ul><li>bar</ul>}<li>baz</ul>',
		'<ul><li>foo</li>{<ul><li>bar</ul>}<li>baz</ul>',
		'<ul><li>[foo]<ul><li>bar</ul><li>baz</ul>',
		'<ul><li>[foo]</li><ul><li>bar</ul><li>baz</ul>',
		'<ul><li>foo<li>[bar]<ul><li>baz</ul><li>quz</ul>',
		'<ul><li>foo<li>[bar]</li><ul><li>baz</ul><li>quz</ul>',
		'<ul><li>foo<ul><li>bar<li>baz</ul><li>[quz]</ul>',
		'<ul><li>foo</li><ul><li>bar<li>baz</ul><li>[quz]</ul>',

		// Multiple items at once.
		'<ul><li>foo<li>b[ar<li>baz]</ul>',
		'<ul><li>[foo<ul><li>bar]</ul><li>baz</ul>',
		'<ul><li>[foo</li><ul><li>bar]</ul><li>baz</ul>',
		'<ul><li>foo<ul><li>b[ar</ul><li>b]az</ul>',
		'<ul><li>foo</li><ul><li>b[ar</ul><li>b]az</ul>',
		'<ul><li>[foo<ul><li>bar</ul><li>baz]</ul><p>extra',
		'<ul><li>[foo</li><ul><li>bar</ul><li>baz]</ul><p>extra',
		'<ul><li>foo<li>[bar</li><ul><li>baz</ul><li>quz]</ul>',

		// We probably can't actually get this DOM . . .
		'<ul><li>[foo]<ul><li>bar</ul>baz</ul>',
		'<ul><li>foo<ul><li>[bar]</ul>baz</ul>',
		'<ul><li>foo<ul><li>bar</ul>[baz]</ul>',
		'<ul><li>[foo<ul><li>bar]</ul>baz</ul>',


		// Mix of <ol> and <ul>
		'foo<ol><li>bar</ol><ul><li>[baz]</ul>quz',
		'foo<ol><li>bar</ol><ul><li>[baz</ul>quz]',
		'foo<ul><li>[bar]</ul><ol><li>baz</ol>quz',
		'[foo<ul><li>bar]</ul><ol><li>baz</ol>quz',
		'<ol><li>foo</li><ul><li>[bar]</ul><li>baz</ol>',
		'<ul><li>foo</li><ol><li>[bar]</ol><li>baz</ul>',

		// Interaction with indentation
		'[foo]<blockquote>bar</blockquote>baz',
		'foo<blockquote>[bar]</blockquote>baz',
		'[foo<blockquote>bar]</blockquote>baz',
		'<ol><li>foo</ol><blockquote>[bar]</blockquote>baz',
		'[foo]<blockquote><ol><li>bar</ol></blockquote>baz',
		'foo<blockquote>[bar]<br>baz</blockquote>',
		'[foo<blockquote>bar]<br>baz</blockquote>',
		'<ol><li>foo</ol><blockquote>[bar]<br>baz</blockquote>',

		'<p>[foo]<blockquote><p>bar</blockquote><p>baz',
		'<p>foo<blockquote><p>[bar]</blockquote><p>baz',
		'<p>[foo<blockquote><p>bar]</blockquote><p>baz',
		'<ol><li>foo</ol><blockquote><p>[bar]</blockquote><p>baz',
		'<p>[foo]<blockquote><ol><li><p>bar</ol></blockquote><p>baz',
		'<p>foo<blockquote><p>[bar]<p>baz</blockquote>',
		'<p>[foo<blockquote><p>bar]<p>baz</blockquote>',
		'<ol><li>foo</ol><blockquote><p>[bar]<p>baz</blockquote>',

		'[foo]<div style="margin: 0 40px">bar</div>baz',
		'foo<div style="margin: 0 40px">[bar]</div>baz',
		'[foo<div style="margin: 0 40px">bar]</div>baz',
		'<ol><li>foo</ol><div style="margin: 0 40px">[bar]</div>baz',
		'[foo]<div style="margin: 0 40px"><ol><li>bar</ol></div>baz',
		'foo<div style="margin: 0 40px">[bar]<br>baz</div>',
		'[foo<div style="margin: 0 40px">bar]<br>baz</div>',
		'<ol><li>foo</ol><div style="margin: 0 40px">[bar]<br>baz</div>',

		'<p>[foo]<div style="margin: 0 40px"><p>bar</div><p>baz',
		'<p>foo<div style="margin: 0 40px"><p>[bar]</div><p>baz',
		'<p>[foo<div style="margin: 0 40px"><p>bar]</div><p>baz',
		'<ol><li>foo</ol><div style="margin: 0 40px"><p>[bar]</div><p>baz',
		'<p>[foo]<div style="margin: 0 40px"><ol><li><p>bar</ol></div><p>baz',
		'<p>foo<div style="margin: 0 40px"><p>[bar]<p>baz</div>',
		'<p>[foo<div style="margin: 0 40px"><p>bar]<p>baz</div>',
		'<ol><li>foo</ol><div style="margin: 0 40px"><p>[bar]<p>baz</div>',

		// Attributes
		'<ul id=abc><li>foo<li>[bar]<li>baz</ul>',
		'<ul style=color:red><li>foo<li>[bar]<li>baz</ul>',
		'<ul style=text-indent:1em><li>foo<li>[bar]<li>baz</ul>',
		'<ul id=abc><li>[foo]<li>bar<li>baz</ul>',
		'<ul style=color:red><li>[foo]<li>bar<li>baz</ul>',
		'<ul style=text-indent:1em><li>[foo]<li>bar<li>baz</ul>',
		'<ul id=abc><li>foo<li>bar<li>[baz]</ul>',
		'<ul style=color:red><li>foo<li>bar<li>[baz]</ul>',
		'<ul style=text-indent:1em><li>foo<li>bar<li>[baz]</ul>',
	],
	//@}
	italic: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'foo[bar]baz',
		'foo]bar[baz',
		'{<p><p> <p>foo</p>}',
		'foo[bar<b>baz]qoz</b>quz',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'foo<span style="font-style: italic">[bar]</span>baz',
		'foo<address>[bar]</address>baz',
		'foo<cite>[bar]</cite>baz',
		'foo<dfn>[bar]</dfn>baz',
		'foo<em>[bar]</em>baz',
		'foo<i>[bar]</i>baz',
		'foo<var>[bar]</var>baz',

		'foo{<address>bar</address>}baz',
		'foo{<cite>bar</cite>}baz',
		'foo{<dfn>bar</dfn>}baz',
		'foo{<em>bar</em>}baz',
		'foo{<i>bar</i>}baz',
		'foo{<var>bar</var>}baz',

		'foo<address>b[a]r</address>baz',
		'foo<cite>b[a]r</cite>baz',
		'foo<dfn>b[a]r</dfn>baz',
		'foo<em>b[a]r</em>baz',
		'foo<i>b[a]r</i>baz',
		'foo<var>b[a]r</var>baz',

		'fo[o<address>bar</address>b]az',
		'fo[o<cite>bar</cite>b]az',
		'fo[o<dfn>bar</dfn>b]az',
		'fo[o<em>bar</em>b]az',
		'fo[o<i>bar</i>b]az',
		'fo[o<var>bar</var>b]az',

		'foo[<address>bar</address>baz]',
		'foo[<cite>bar</cite>baz]',
		'foo[<dfn>bar</dfn>baz]',
		'foo[<em>bar</em>baz]',
		'foo[<i>bar</i>baz]',
		'foo[<var>bar</var>baz]',

		'[foo<address>bar</address>]baz',
		'[foo<cite>bar</cite>]baz',
		'[foo<dfn>bar</dfn>]baz',
		'[foo<em>bar</em>]baz',
		'[foo<i>bar</i>]baz',
		'[foo<var>bar</var>]baz',

		'foo<span style="font-style: italic">[bar]</span>baz',
		'foo<span style="font-style: oblique">[bar]</span>baz',
		'foo<span style="font-style: oblique">b[a]r</span>baz',

		'<i>{<p>foo</p><p>bar</p>}<p>baz</p></i>',
		'<i><p>foo[<b>bar</b>}</p><p>baz</p></i>',
		'foo [bar <b>baz] qoz</b> quz sic',
		'foo bar <b>baz [qoz</b> quz] sic',
		'foo [bar <i>baz] qoz</i> quz sic',
		'foo bar <i>baz [qoz</i> quz] sic',
	],
	//@}
	justifycenter: [
	//@{
		'foo[]bar<p>extra',
		'<span>foo</span>{}<span>bar</span><p>extra',
		'<span>foo[</span><span>]bar</span><p>extra',
		'foo[bar]baz<p>extra',
		'foo[bar<b>baz]qoz</b>quz<p>extra',
		'<p>foo[]bar<p>extra',
		'<p>foo[bar]baz<p>extra',
		'<h1>foo[bar]baz</h1><p>extra',
		'<pre>foo[bar]baz</pre><p>extra',
		'<xmp>foo[bar]baz</xmp><p>extra',
		'{<table><tr><td>foo<td>bar</table>}<p>extra',
		'<center><p>[foo]<p>bar</center><p>extra',
		'<center><p>[foo<p>bar]</center><p>extra',

		'<div align=center><p>[foo]<p>bar</div><p>extra',
		'<div align=center><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:center><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:center><p>[foo<p>bar]</div><p>extra',

		'<div align=justify><p>[foo]<p>bar</div><p>extra',
		'<div align=justify><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:justify><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:justify><p>[foo<p>bar]</div><p>extra',

		'<div align=left><p>[foo]<p>bar</div><p>extra',
		'<div align=left><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:left><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:left><p>[foo<p>bar]</div><p>extra',

		'<div align=right><p>[foo]<p>bar</div><p>extra',
		'<div align=right><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:right><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:right><p>[foo<p>bar]</div><p>extra',

		'<center>foo</center>[bar]<p>extra',
		'[foo]<center>bar</center><p>extra',
		'<center>foo</center>[bar]<center>baz</center><p>extra',
		'<div align=center>foo</div>[bar]<p>extra',
		'[foo]<div align=center>bar</div><p>extra',
		'<div align=center>foo</div>[bar]<div align=center>baz</div><p>extra',
		'<div align=center><p>foo</div><p>[bar]<p>extra',
		'<p>[foo]<div align=center><p>bar</div><p>extra',
		'<div align=center><p>foo</div><p>[bar]<div align=center><p>baz</div><p>extra',
		'<div style=text-align:center>foo</div>[bar]<p>extra',
		'[foo]<div style=text-align:center>bar</div><p>extra',
		'<div style=text-align:center>foo</div>[bar]<div style=text-align:center>baz</div><p>extra',
		'<div style=text-align:center><p>foo</div><p>[bar]<p>extra',
		'<p>[foo]<div style=text-align:center><p>bar</div><p>extra',
		'<div style=text-align:center><p>foo</div><p>[bar]<div style=text-align:center><p>baz</div><p>extra',
		'<p align=center>foo<p>[bar]<p>extra',
		'<p>[foo]<p align=center>bar<p>extra',
		'<p align=center>foo<p>[bar]<p align=center>baz<p>extra',

		'<div align=nonsense><p>[foo]</div><p>extra',
		'<div style=text-align:inherit><p>[foo]</div><p>extra',
		'<quasit align=right><p>[foo]</p></quasit><p>extra',
	],
	//@}
	justifyfull: [
	//@{
		'foo[]bar<p>extra',
		'<span>foo</span>{}<span>bar</span><p>extra',
		'<span>foo[</span><span>]bar</span><p>extra',
		'foo[bar]baz<p>extra',
		'foo[bar<b>baz]qoz</b>quz<p>extra',
		'<p>foo[]bar<p>extra',
		'<p>foo[bar]baz<p>extra',
		'<h1>foo[bar]baz</h1><p>extra',
		'<pre>foo[bar]baz</pre><p>extra',
		'<xmp>foo[bar]baz</xmp><p>extra',
		'{<table><tr><td>foo<td>bar</table>}<p>extra',
		'<center><p>[foo]<p>bar</center><p>extra',
		'<center><p>[foo<p>bar]</center><p>extra',

		'<div align=center><p>[foo]<p>bar</div><p>extra',
		'<div align=center><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:center><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:center><p>[foo<p>bar]</div><p>extra',

		'<div align=justify><p>[foo]<p>bar</div><p>extra',
		'<div align=justify><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:justify><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:justify><p>[foo<p>bar]</div><p>extra',

		'<div align=left><p>[foo]<p>bar</div><p>extra',
		'<div align=left><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:left><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:left><p>[foo<p>bar]</div><p>extra',

		'<div align=right><p>[foo]<p>bar</div><p>extra',
		'<div align=right><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:right><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:right><p>[foo<p>bar]</div><p>extra',

		'<div align=justify>foo</div>[bar]<p>extra',
		'[foo]<div align=justify>bar</div><p>extra',
		'<div align=justify>foo</div>[bar]<div align=justify>baz</div><p>extra',
		'<div align=justify><p>foo</div><p>[bar]<p>extra',
		'<p>[foo]<div align=justify><p>bar</div><p>extra',
		'<div align=justify><p>foo</div><p>[bar]<div align=justify><p>baz</div><p>extra',
		'<div style=text-align:justify>foo</div>[bar]<p>extra',
		'[foo]<div style=text-align:justify>bar</div><p>extra',
		'<div style=text-align:justify>foo</div>[bar]<div style=text-align:justify>baz</div><p>extra',
		'<div style=text-align:justify><p>foo</div><p>[bar]<p>extra',
		'<p>[foo]<div style=text-align:justify><p>bar</div><p>extra',
		'<div style=text-align:justify><p>foo</div><p>[bar]<div style=text-align:justify><p>baz</div><p>extra',
		'<p align=justify>foo<p>[bar]<p>extra',
		'<p>[foo]<p align=justify>bar<p>extra',
		'<p align=justify>foo<p>[bar]<p align=justify>baz<p>extra',

		'<div align=nonsense><p>[foo]</div><p>extra',
		'<div style=text-align:inherit><p>[foo]</div><p>extra',
		'<quasit align=center><p>[foo]</p></quasit><p>extra',
	],
	//@}
	justifyleft: [
	//@{
		'foo[]bar<p>extra',
		'<span>foo</span>{}<span>bar</span><p>extra',
		'<span>foo[</span><span>]bar</span><p>extra',
		'foo[bar]baz<p>extra',
		'foo[bar<b>baz]qoz</b>quz<p>extra',
		'<p>foo[]bar<p>extra',
		'<p>foo[bar]baz<p>extra',
		'<h1>foo[bar]baz</h1><p>extra',
		'<pre>foo[bar]baz</pre><p>extra',
		'<xmp>foo[bar]baz</xmp><p>extra',
		'{<table><tr><td>foo<td>bar</table>}<p>extra',
		'<center><p>[foo]<p>bar</center><p>extra',
		'<center><p>[foo<p>bar]</center><p>extra',

		'<div align=center><p>[foo]<p>bar</div><p>extra',
		'<div align=center><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:center><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:center><p>[foo<p>bar]</div><p>extra',

		'<div align=justify><p>[foo]<p>bar</div><p>extra',
		'<div align=justify><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:justify><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:justify><p>[foo<p>bar]</div><p>extra',

		'<div align=left><p>[foo]<p>bar</div><p>extra',
		'<div align=left><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:left><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:left><p>[foo<p>bar]</div><p>extra',

		'<div align=right><p>[foo]<p>bar</div><p>extra',
		'<div align=right><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:right><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:right><p>[foo<p>bar]</div><p>extra',

		'<div align=left>foo</div>[bar]<p>extra',
		'[foo]<div align=left>bar</div><p>extra',
		'<div align=left>foo</div>[bar]<div align=left>baz</div><p>extra',
		'<div align=left><p>foo</div><p>[bar]<p>extra',
		'<p>[foo]<div align=left><p>bar</div><p>extra',
		'<div align=left><p>foo</div><p>[bar]<div align=left><p>baz</div><p>extra',
		'<div style=text-align:left>foo</div>[bar]<p>extra',
		'[foo]<div style=text-align:left>bar</div><p>extra',
		'<div style=text-align:left>foo</div>[bar]<div style=text-align:left>baz</div><p>extra',
		'<div style=text-align:left><p>foo</div><p>[bar]<p>extra',
		'<p>[foo]<div style=text-align:left><p>bar</div><p>extra',
		'<div style=text-align:left><p>foo</div><p>[bar]<div style=text-align:left><p>baz</div><p>extra',
		'<p align=left>foo<p>[bar]<p>extra',
		'<p>[foo]<p align=left>bar<p>extra',
		'<p align=left>foo<p>[bar]<p align=left>baz<p>extra',

		'<div align=nonsense><p>[foo]</div><p>extra',
		'<div style=text-align:inherit><p>[foo]</div><p>extra',
		'<quasit align=center><p>[foo]</p></quasit><p>extra',
	],
	//@}
	justifyright: [
	//@{
		'foo[]bar<p>extra',
		'<span>foo</span>{}<span>bar</span><p>extra',
		'<span>foo[</span><span>]bar</span><p>extra',
		'foo[bar]baz<p>extra',
		'foo[bar<b>baz]qoz</b>quz<p>extra',
		'<p>foo[]bar<p>extra',
		'<p>foo[bar]baz<p>extra',
		'<h1>foo[bar]baz</h1><p>extra',
		'<pre>foo[bar]baz</pre><p>extra',
		'<xmp>foo[bar]baz</xmp><p>extra',
		'{<table><tr><td>foo<td>bar</table>}<p>extra',
		'<center><p>[foo]<p>bar</center><p>extra',
		'<center><p>[foo<p>bar]</center><p>extra',

		'<div align=center><p>[foo]<p>bar</div><p>extra',
		'<div align=center><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:center><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:center><p>[foo<p>bar]</div><p>extra',

		'<div align=justify><p>[foo]<p>bar</div><p>extra',
		'<div align=justify><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:justify><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:justify><p>[foo<p>bar]</div><p>extra',

		'<div align=left><p>[foo]<p>bar</div><p>extra',
		'<div align=left><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:left><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:left><p>[foo<p>bar]</div><p>extra',

		'<div align=right><p>[foo]<p>bar</div><p>extra',
		'<div align=right><p>[foo<p>bar}</div><p>extra',
		'<div style=text-align:right><p>[foo]<p>bar</div><p>extra',
		'<div style=text-align:right><p>[foo<p>bar]</div><p>extra',

		'<div align=right>foo</div>[bar]<p>extra',
		'[foo]<div align=right>bar</div><p>extra',
		'<div align=right>foo</div>[bar]<div align=right>baz</div><p>extra',
		'<div align=right><p>foo</div><p>[bar]<p>extra',
		'<p>[foo]<div align=right><p>bar</div><p>extra',
		'<div align=right><p>foo</div><p>[bar]<div align=right><p>baz</div><p>extra',
		'<div style=text-align:right>foo</div>[bar]<p>extra',
		'[foo]<div style=text-align:right>bar</div><p>extra',
		'<div style=text-align:right>foo</div>[bar]<div style=text-align:right>baz</div><p>extra',
		'<div style=text-align:right><p>foo</div><p>[bar]<p>extra',
		'<p>[foo]<div style=text-align:right><p>bar</div><p>extra',
		'<div style=text-align:right><p>foo</div><p>[bar]<div style=text-align:right><p>baz</div><p>extra',
		'<p align=right>foo<p>[bar]<p>extra',
		'<p>[foo]<p align=right>bar<p>extra',
		'<p align=right>foo<p>[bar]<p align=right>baz<p>extra',

		'<div align=nonsense><p>[foo]</div><p>extra',
		'<div style=text-align:inherit><p>[foo]</div><p>extra',
		'<quasit align=center><p>[foo]</p></quasit><p>extra',
	],
	//@}
	outdent: [
	//@{
		// These mimic existing indentation in various browsers, to see how
		// they cope with outdenting various things.  This is spec, Gecko
		// non-CSS, and Opera:
		'<blockquote><p>foo[bar]</p><p>baz</p></blockquote><p>extra',
		'<blockquote><p>foo[bar</p><p>b]az</p></blockquote><p>extra',
		'<blockquote><p>foo[bar]</p></blockquote><p>baz</p><p>extra',
		'<blockquote><p>foo[bar</p></blockquote><p>b]az</p><p>extra',

		// IE:
		'<blockquote style="margin-right: 0px;" dir="ltr"><p>foo[bar]</p><p>baz</p></blockquote><p>extra',
		'<blockquote style="margin-right: 0px;" dir="ltr"><p>foo[bar</p><p>b]az</p></blockquote><p>extra',
		'<blockquote style="margin-right: 0px;" dir="ltr"><p>foo[bar]</p></blockquote><p>baz</p><p>extra',
		'<blockquote style="margin-right: 0px;" dir="ltr"><p>foo[bar</p></blockquote><p>b]az</p><p>extra',

		// Firefox CSS mode:
		'<p style="margin-left: 40px">foo[bar]</p><p style="margin-left: 40px">baz</p><p>extra',
		'<p style="margin-left: 40px">foo[bar</p><p style="margin-left: 40px">b]az</p><p>extra',
		'<p style="margin-left: 40px">foo[bar]</p><p>baz</p><p>extra',
		'<p style="margin-left: 40px">foo[bar</p><p>b]az</p><p>extra',

		// WebKit:
		'<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px;"><p>foo[bar]</p><p>baz</p></blockquote><p>extra',
		'<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px;"><p>foo[bar</p><p>b]az</p></blockquote><p>extra',
		'<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px;"><p>foo[bar]</p></blockquote><p>baz</p><p>extra',
		'<blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px;"><p>foo[bar</p></blockquote><p>b]az</p><p>extra',

		// Now let's try nesting lots of stuff and see what happens.
		'<blockquote><blockquote>foo[bar]baz</blockquote></blockquote>',
		'<blockquote><blockquote data-abc=def>foo[bar]baz</blockquote></blockquote>',
		'<blockquote data-abc=def><blockquote>foo[bar]baz</blockquote></blockquote>',
		'<blockquote><div>foo[bar]baz</div></blockquote>',
		'<blockquote><div id=abc>foo[bar]baz</div></blockquote>',
		'<blockquote id=abc>foo[bar]baz</blockquote>',
		'<blockquote style="color: red">foo[bar]baz</blockquote>',

		'<blockquote><blockquote><p>foo[bar]<p>baz</blockquote></blockquote>',
		'<blockquote><blockquote data-abc=def><p>foo[bar]<p>baz</blockquote></blockquote>',
		'<blockquote data-abc=def><blockquote><p>foo[bar]<p>baz</blockquote></blockquote>',
		'<blockquote><div><p>foo[bar]<p>baz</div></blockquote>',
		'<blockquote><div id=abc><p>foo[bar]<p>baz</div></blockquote>',
		'<blockquote id=abc><p>foo[bar]<p>baz</blockquote>',
		'<blockquote style="color: red"><p>foo[bar]<p>baz</blockquote>',

		'<blockquote><p><b>foo[bar]</b><p>baz</blockquote>',
		'<blockquote><p><strong>foo[bar]</strong><p>baz</blockquote>',
		'<blockquote><p><span>foo[bar]</span><p>baz</blockquote>',
		'<blockquote><blockquote style="color: red"><p>foo[bar]</blockquote><p>baz</blockquote>',
		'<blockquote style="color: red"><blockquote><p>foo[bar]</blockquote><p>baz</blockquote>',

		// Lists!
		'<ol><li>foo<li>[bar]<li>baz</ol>',
		'<ol data-start=1 data-end=2><li>foo<li>bar<li>baz</ol>',
		'<ol><li>foo</ol>[bar]',
		'<ol><li>[foo]<br>bar<li>baz</ol>',
		'<ol><li>foo<br>[bar]<li>baz</ol>',
		'<ol><li><div>[foo]</div>bar<li>baz</ol>',
		'<ol><li>foo<ol><li>[bar]<li>baz</ol><li>quz</ol>',
		'<ol><li>foo<ol><li>bar<li>[baz]</ol><li>quz</ol>',
		'<ol><li>foo</li><ol><li>[bar]<li>baz</ol><li>quz</ol>',
		'<ol><li>foo</li><ol data-start=0 data-end=1><li>bar<li>baz</ol><li>quz</ol>',
		'<ol><li>foo</li><ol><li>bar<li>[baz]</ol><li>quz</ol>',
		'<ol><li>foo</li><ol data-start=1 data-end=2><li>bar<li>baz</ol><li>quz</ol>',
		'<ol><li>foo<ol><li>b[a]r</ol><li>baz</ol>',
		'<ol><li>foo</li><ol><li>b[a]r</ol><li>baz</ol>',
		'<ol><li>foo{<ol><li>bar</ol>}<li>baz</ol>',
		'<ol><li>foo</li>{<ol><li>bar</ol>}<li>baz</ol>',
		'<ol><li>[foo]<ol><li>bar</ol><li>baz</ol>',
		'<ol><li>[foo]</li><ol><li>bar</ol><li>baz</ol>',
		'<ol><li>foo<li>[bar]<ol><li>baz</ol><li>quz</ol>',
		'<ol><li>foo<li>[bar]</li><ol><li>baz</ol><li>quz</ol>',
		'<ol><li>foo<ol><li>bar<li>baz</ol><li>[quz]</ol>',
		'<ol><li>foo</li><ol><li>bar<li>baz</ol><li>[quz]</ol>',

		// Try outdenting multiple items at once.
		'<ol><li>foo<li>b[ar<li>baz]</ol>',
		'<ol><li>[foo<ol><li>bar]</ol><li>baz</ol>',
		'<ol><li>[foo</li><ol><li>bar]</ol><li>baz</ol>',
		'<ol><li>foo<ol><li>b[ar</ol><li>b]az</ol>',
		'<ol><li>foo</li><ol><li>b[ar</ol><li>b]az</ol>',
		'<ol><li>[foo<ol><li>bar</ol><li>baz]</ol><p>extra',
		'<ol><li>[foo</li><ol><li>bar</ol><li>baz]</ol><p>extra',

		// We probably can't actually get this DOM . . .
		'<ol><li>[foo]<ol><li>bar</ol>baz</ol>',
		'<ol><li>foo<ol><li>[bar]</ol>baz</ol>',
		'<ol><li>foo<ol><li>bar</ol>[baz]</ol>',
		'<ol><li>[foo<ol><li>bar]</ol>baz</ol>',

		// Attribute handling on lists
		'foo<ol start=5><li>[bar]</ol>baz',
		'foo<ol id=abc><li>[bar]</ol>baz',
		'foo<ol style=color:red><li>[bar]</ol>baz',
		'foo<ol><li value=5>[bar]</ol>baz',
		'foo<ol><li id=abc>[bar]</ol>baz',
		'foo<ol><li style=color:red>[bar]</ol>baz',
		'<ol><li>foo</li><ol><li value=5>[bar]</ol></ol>',
		'<ul><li>foo</li><ol><li value=5>[bar]</ol></ul>',
		'<ol><li>foo</li><ol start=5><li>[bar]</ol><li>baz</ol>',
		'<ol><li>foo</li><ol id=abc><li>[bar]</ol><li>baz</ol>',
		'<ol><li>foo</li><ol style=color:red><li>[bar]</ol><li>baz</ol>',
		'<ol><li>foo</li><ol style=text-indent:1em><li>[bar]</ol><li>baz</ol>',
		'<ol><li>foo</li><ol start=5><li>[bar<li>baz]</ol><li>quz</ol>',
		'<ol><li>foo</li><ol id=abc><li>[bar<li>baz]</ol><li>quz</ol>',
		'<ol><li>foo</li><ol style=color:red><li>[bar<li>baz]</ol><li>quz</ol>',
		'<ol><li>foo</li><ol style=text-indent:1em><li>[bar<li>baz]</ol><li>quz</ol>',

		// List inside indentation element
		'<blockquote><ol><li>[foo]</ol></blockquote><p>extra',
		'<blockquote>foo<ol><li>[bar]</ol>baz</blockquote><p>extra',
		'<blockquote><ol><li>foo</li><ol><li>[bar]</ol><li>baz</ol></blockquote><p>extra',

		'<ol><li><h1>[foo]</h1></ol>',
		'<ol><li><xmp>[foo]</xmp></li></ol>',
	],
	//@}
	removeformat: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'[foo<b>bar</b>baz]',
		'foo[<b>bar</b>baz]',
		'foo[<b>bar</b>]baz',
		'foo<b>[bar]</b>baz',
		'foo<b>b[a]r</b>baz',
		'[foo<strong>bar</strong>baz]',
		'[foo<span style="font-weight: bold">bar</span>baz]',
		'foo<span style="font-weight: bold">b[a]r</span>baz',
		'[foo<b id=foo>bar</b>baz]',
		'foo<b id=foo>b[a]r</b>baz',

		// HTML has lots of inline elements, doesn't it?
		'[foo<a>bar</a>baz]',
		'foo<a>b[a]r</a>baz',
		'[foo<a href=foo>bar</a>baz]',
		'foo<a href=foo>b[a]r</a>baz',
		'[foo<abbr>bar</abbr>baz]',
		'foo<abbr>b[a]r</abbr>baz',
		'[foo<acronym>bar</acronym>baz]',
		'foo<acronym>b[a]r</acronym>baz',
		'[foo<b>bar</b>baz]',
		'foo<b>b[a]r</b>baz',
		'[foo<bdi dir=rtl>bar</bdi>baz]',
		'foo<bdi dir=rtl>b[a]r</bdi>baz',
		'[foo<bdo dir=rtl>bar</bdo>baz]',
		'foo<bdo dir=rtl>b[a]r</bdo>baz',
		'[foo<big>bar</big>baz]',
		'foo<big>b[a]r</big>baz',
		'[foo<blink>bar</blink>baz]',
		'foo<blink>b[a]r</blink>baz',
		'[foo<cite>bar</cite>baz]',
		'foo<cite>b[a]r</cite>baz',
		'[foo<code>bar</code>baz]',
		'foo<code>b[a]r</code>baz',
		'[foo<del>bar</del>baz]',
		'foo<del>b[a]r</del>baz',
		'[foo<dfn>bar</dfn>baz]',
		'foo<dfn>b[a]r</dfn>baz',
		'[foo<em>bar</em>baz]',
		'foo<em>b[a]r</em>baz',
		'[foo<font>bar</font>baz]',
		'foo<font>b[a]r</font>baz',
		'[foo<font color=red>bar</font>baz]',
		'foo<font color=red>b[a]r</font>baz',
		'[foo<i>bar</i>baz]',
		'foo<i>b[a]r</i>baz',
		'[foo<ins>bar</ins>baz]',
		'foo<ins>b[a]r</ins>baz',
		'[foo<kbd>bar</kbd>baz]',
		'foo<kbd>b[a]r</kbd>baz',
		'[foo<mark>bar</mark>baz]',
		'foo<mark>b[a]r</mark>baz',
		'[foo<nobr>bar</nobr>baz]',
		'foo<nobr>b[a]r</nobr>baz',
		'[foo<q>bar</q>baz]',
		'foo<q>b[a]r</q>baz',
		'[foo<samp>bar</samp>baz]',
		'foo<samp>b[a]r</samp>baz',
		'[foo<s>bar</s>baz]',
		'foo<s>b[a]r</s>baz',
		'[foo<small>bar</small>baz]',
		'foo<small>b[a]r</small>baz',
		'[foo<span>bar</span>baz]',
		'foo<span>b[a]r</span>baz',
		'[foo<strike>bar</strike>baz]',
		'foo<strike>b[a]r</strike>baz',
		'[foo<strong>bar</strong>baz]',
		'foo<strong>b[a]r</strong>baz',
		'[foo<sub>bar</sub>baz]',
		'foo<sub>b[a]r</sub>baz',
		'[foo<sup>bar</sup>baz]',
		'foo<sup>b[a]r</sup>baz',
		'[foo<tt>bar</tt>baz]',
		'foo<tt>b[a]r</tt>baz',
		'[foo<u>bar</u>baz]',
		'foo<u>b[a]r</u>baz',
		'[foo<var>bar</var>baz]',
		'foo<var>b[a]r</var>baz',

		// Empty and replaced elements
		'[foo<br>bar]',
		'[foo<hr>bar]',
		'[foo<wbr>bar]',
		'[foo<img>bar]',
		'[foo<img src=abc>bar]',
		'[foo<video></video>bar]',
		'[foo<video src=abc></video>bar]',
		'[foo<svg><circle fill=red r=20 cx=20 cy=20 /></svg>bar]',

		// Unrecognized elements
		'[foo<nonexistentelement>bar</nonexistentelement>baz]',
		'foo<nonexistentelement>b[a]r</nonexistentelement>baz',
		'[foo<nonexistentelement style="display: block">bar</nonexistentelement>baz]',
		'foo<nonexistentelement style="display: block">b[a]r</nonexistentelement>baz',

		// Random stuff
		'[foo<span id=foo>bar</span>baz]',
		'foo<span id=foo>b[a]r</span>baz',
		'[foo<span class=foo>bar</span>baz]',
		'foo<span class=foo>b[a]r</span>baz',
		'[foo<b style="font-weight: normal">bar</b>baz]',
		'foo<b style="font-weight: normal">b[a]r</b>baz',
		'<p style="background-color: red">foo[bar]baz</p>',
		'<p><span style="background-color: red">foo[bar]baz</span></p>',
		'<p style="font-weight: bold">foo[bar]baz</p>',
		'<b><p style="font-weight: bold">foo[bar]baz</p></b>',
		'<p style="font-variant: small-caps">foo[bar]baz</p>',
		'{<p style="font-variant: small-caps">foobarbaz</p>}',
		'<p style="text-indent: 2em">foo[bar]baz</p>',
		'{<p style="text-indent: 2em">foobarbaz</p>}',
	],
	//@}
	strikethrough: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'foo[bar]baz',
		'foo]bar[baz',
		'{<p><p> <p>foo</p>}',
		'foo[bar<b>baz]qoz</b>quz',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'foo<u>[bar]</u>baz',
		'foo<span style="text-decoration: underline">[bar]</span>baz',
		'<u>foo[bar]baz</u>',
		'<u>foo[b<span style="color:red">ar]ba</span>z</u>',
		'<u>foo[b<span style="color:red" id=foo>ar]ba</span>z</u>',
		'<u>foo[b<span style="font-size:3em">ar]ba</span>z</u>',
		'<u>foo[b<i>ar]ba</i>z</u>',
		'<p style="text-decoration: underline">foo[bar]baz</p>',

		'foo<s>[bar]</s>baz',
		'foo<span style="text-decoration: line-through">[bar]</span>baz',
		'<s>foo[bar]baz</s>',
		'<s>foo[b<span style="color:red">ar]ba</span>z</s>',
		'<s>foo[b<span style="color:red" id=foo>ar]ba</span>z</s>',
		'<s>foo[b<span style="font-size:3em">ar]ba</span>z</s>',
		'<s>foo[b<i>ar]ba</i>z</s>',
		'<p style="text-decoration: line-through">foo[bar]baz</p>',

		'foo<strike>[bar]</strike>baz',
		'<strike>foo[bar]baz</strike>',
		'<strike>foo[b<span style="color:red">ar]ba</span>z</strike>',
		'<strike>foo[b<span style="color:red" id=foo>ar]ba</span>z</strike>',
		'<strike>foo[b<span style="font-size:3em">ar]ba</span>z</strike>',
		'<strike>foo[b<i>ar]ba</i>z</strike>',

		'foo<ins>[bar]</ins>baz',
		'<ins>foo[bar]baz</ins>',
		'<ins>foo[b<span style="color:red">ar]ba</span>z</ins>',
		'<ins>foo[b<span style="color:red" id=foo>ar]ba</span>z</ins>',
		'<ins>foo[b<span style="font-size:3em">ar]ba</span>z</ins>',
		'<ins>foo[b<i>ar]ba</i>z</ins>',

		'foo<del>[bar]</del>baz',
		'<del>foo[bar]baz</del>',
		'<del>foo[b<span style="color:red">ar]ba</span>z</del>',
		'<del>foo[b<span style="color:red" id=foo>ar]ba</span>z</del>',
		'<del>foo[b<span style="font-size:3em">ar]ba</span>z</del>',
		'<del>foo[b<i>ar]ba</i>z</del>',

		'foo<span style="text-decoration: underline line-through">[bar]</span>baz',
		'foo<span style="text-decoration: underline line-through">b[a]r</span>baz',
		'foo<s style="text-decoration: underline">[bar]</s>baz',
		'foo<s style="text-decoration: underline">b[a]r</s>baz',
		'foo<u style="text-decoration: line-through">[bar]</u>baz',
		'foo<u style="text-decoration: line-through">b[a]r</u>baz',
		'foo<s style="text-decoration: overline">[bar]</s>baz',
		'foo<s style="text-decoration: overline">b[a]r</s>baz',
		'foo<u style="text-decoration: overline">[bar]</u>baz',
		'foo<u style="text-decoration: overline">b[a]r</u>baz',

		'<p style="text-decoration: line-through">foo[bar]baz</p>',
		'<p style="text-decoration: overline">foo[bar]baz</p>',

		'foo<span class="underline">[bar]</span>baz',
		'foo<span class="underline">b[a]r</span>baz',
		'foo<span class="line-through">[bar]</span>baz',
		'foo<span class="line-through">b[a]r</span>baz',
		'foo<span class="underline-and-line-through">[bar]</span>baz',
		'foo<span class="underline-and-line-through">b[a]r</span>baz',
	],
	//@}
	subscript: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'foo[bar]baz',
		'foo]bar[baz',
		'{<p><p> <p>foo</p>}',
		'foo[bar<b>baz]qoz</b>quz',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'foo<sub>[bar]</sub>baz',
		'foo<sub>b[a]r</sub>baz',
		'foo<sup>[bar]</sup>baz',
		'foo<sup>b[a]r</sup>baz',

		'foo<sub><sub>[bar]</sub></sub>baz',
		'foo<sub><sub>b[a]r</sub></sub>baz',
		'foo<sub>b<sub>[a]</sub>r</sub>baz',
		'foo<sup><sup>[bar]</sup></sup>baz',
		'foo<sup><sup>b[a]r</sup></sup>baz',
		'foo<sup>b<sup>[a]</sup>r</sup>baz',
		'foo<sub><sup>[bar]</sup></sub>baz',
		'foo<sub><sup>b[a]r</sup></sub>baz',
		'foo<sub>b<sup>[a]</sup>r</sub>baz',
		'foo<sup><sub>[bar]</sub></sup>baz',
		'foo<sup><sub>b[a]r</sub></sup>baz',
		'foo<sup>b<sub>[a]</sub>r</sup>baz',
	],
	//@}
	superscript: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'foo[bar]baz',
		'foo]bar[baz',
		'{<p><p> <p>foo</p>}',
		'foo[bar<b>baz]qoz</b>quz',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'foo<sub>[bar]</sub>baz',
		'foo<sub>b[a]r</sub>baz',
		'foo<sup>[bar]</sup>baz',
		'foo<sup>b[a]r</sup>baz',

		'foo<sub><sub>[bar]</sub></sub>baz',
		'foo<sub><sub>b[a]r</sub></sub>baz',
		'foo<sub>b<sub>[a]</sub>r</sub>baz',
		'foo<sup><sup>[bar]</sup></sup>baz',
		'foo<sup><sup>b[a]r</sup></sup>baz',
		'foo<sup>b<sup>[a]</sup>r</sup>baz',
		'foo<sub><sup>[bar]</sup></sub>baz',
		'foo<sub><sup>b[a]r</sup></sub>baz',
		'foo<sub>b<sup>[a]</sup>r</sub>baz',
		'foo<sup><sub>[bar]</sub></sup>baz',
		'foo<sup><sub>b[a]r</sub></sup>baz',
		'foo<sup>b<sub>[a]</sub>r</sup>baz',
	],
	//@}
	underline: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'foo[bar]baz',
		'foo]bar[baz',
		'{<p><p> <p>foo</p>}',
		'foo[bar<b>baz]qoz</b>quz',

		'<table><tbody><tr><td>foo<td>b[a]r<td>baz</table>',
		'<table><tbody><tr data-start=1 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody><tr data-start=0 data-end=2><td>foo<td>bar<td>baz</table>',
		'<table><tbody data-start=0 data-end=1><tr><td>foo<td>bar<td>baz</table>',
		'<table data-start=0 data-end=1><tbody><tr><td>foo<td>bar<td>baz</table>',
		'{<table><tr><td>foo<td>bar<td>baz</table>}',

		'foo<u>[bar]</u>baz',
		'foo<span style="text-decoration: underline">[bar]</span>baz',
		'<u>foo[bar]baz</u>',
		'<u>foo[b<span style="color:red">ar]ba</span>z</u>',
		'<u>foo[b<span style="color:red" id=foo>ar]ba</span>z</u>',
		'<u>foo[b<span style="font-size:3em">ar]ba</span>z</u>',
		'<u>foo[b<i>ar]ba</i>z</u>',
		'<p style="text-decoration: underline">foo[bar]baz</p>',

		'foo<s>[bar]</s>baz',
		'foo<span style="text-decoration: line-through">[bar]</span>baz',
		'<s>foo[bar]baz</s>',
		'<s>foo[b<span style="color:red">ar]ba</span>z</s>',
		'<s>foo[b<span style="color:red" id=foo>ar]ba</span>z</s>',
		'<s>foo[b<span style="font-size:3em">ar]ba</span>z</s>',
		'<s>foo[b<i>ar]ba</i>z</s>',
		'<p style="text-decoration: line-through">foo[bar]baz</p>',

		'foo<strike>[bar]</strike>baz',
		'<strike>foo[bar]baz</strike>',
		'<strike>foo[b<span style="color:red">ar]ba</span>z</strike>',
		'<strike>foo[b<span style="color:red" id=foo>ar]ba</span>z</strike>',
		'<strike>foo[b<span style="font-size:3em">ar]ba</span>z</strike>',
		'<strike>foo[b<i>ar]ba</i>z</strike>',

		'foo<ins>[bar]</ins>baz',
		'<ins>foo[bar]baz</ins>',
		'<ins>foo[b<span style="color:red">ar]ba</span>z</ins>',
		'<ins>foo[b<span style="color:red" id=foo>ar]ba</span>z</ins>',
		'<ins>foo[b<span style="font-size:3em">ar]ba</span>z</ins>',
		'<ins>foo[b<i>ar]ba</i>z</ins>',

		'foo<del>[bar]</del>baz',
		'<del>foo[bar]baz</del>',
		'<del>foo[b<span style="color:red">ar]ba</span>z</del>',
		'<del>foo[b<span style="color:red" id=foo>ar]ba</span>z</del>',
		'<del>foo[b<span style="font-size:3em">ar]ba</span>z</del>',
		'<del>foo[b<i>ar]ba</i>z</del>',

		'foo<span style="text-decoration: underline line-through">[bar]</span>baz',
		'foo<span style="text-decoration: underline line-through">b[a]r</span>baz',
		'foo<s style="text-decoration: underline">[bar]</s>baz',
		'foo<s style="text-decoration: underline">b[a]r</s>baz',
		'foo<u style="text-decoration: line-through">[bar]</u>baz',
		'foo<u style="text-decoration: line-through">b[a]r</u>baz',
		'foo<s style="text-decoration: overline">[bar]</s>baz',
		'foo<s style="text-decoration: overline">b[a]r</s>baz',
		'foo<u style="text-decoration: overline">[bar]</u>baz',
		'foo<u style="text-decoration: overline">b[a]r</u>baz',

		'<p style="text-decoration: line-through">foo[bar]baz</p>',
		'<p style="text-decoration: overline">foo[bar]baz</p>',

		'foo<span class="underline">[bar]</span>baz',
		'foo<span class="underline">b[a]r</span>baz',
		'foo<span class="line-through">[bar]</span>baz',
		'foo<span class="line-through">b[a]r</span>baz',
		'foo<span class="underline-and-line-through">[bar]</span>baz',
		'foo<span class="underline-and-line-through">b[a]r</span>baz',
	],
	//@}
	unlink: [
	//@{
		'foo[]bar',
		'<span>foo</span>{}<span>bar</span>',
		'<span>foo[</span><span>]bar</span>',
		'<a href=http://www.google.com/>foo[bar]baz</a>',
		'<a href=http://www.google.com/>foo[barbaz</a>}',
		'{<a href=http://www.google.com/>foobar]baz</a>',
		'{<a href=http://www.google.com/>foobarbaz</a>}',
		'<a href=http://www.google.com/>[foobarbaz]</a>',

		'foo<a href=http://www.google.com/>b[]ar</a>baz',
		'foo<a href=http://www.google.com/>[bar]</a>baz',
		'foo[<a href=http://www.google.com/>bar</a>]baz',
		'foo<a href=http://www.google.com/>[bar</a>baz]',
		'[foo<a href=http://www.google.com/>bar]</a>baz',
		'[foo<a href=http://www.google.com/>bar</a>baz]',

		'<a id=foo href=http://www.google.com/>foobar[]baz</a>',
		'<a id=foo href=http://www.google.com/>foo[bar]baz</a>',
		'<a id=foo href=http://www.google.com/>[foobarbaz]</a>',
		'foo<a id=foo href=http://www.google.com/>[bar]</a>baz',
		'foo[<a id=foo href=http://www.google.com/>bar</a>]baz',
		'[foo<a id=foo href=http://www.google.com/>bar</a>baz]',

		'<a name=foo>foobar[]baz</a>',
		'<a name=foo>foo[bar]baz</a>',
		'<a name=foo>[foobarbaz]</a>',
		'foo<a name=foo>[bar]</a>baz',
		'foo[<a name=foo>bar</a>]baz',
		'[foo<a name=foo>bar</a>baz]',
	],
	//@}
};
tests.insertlinebreak = tests.insertparagraph;

var defaultValues = {
//@{
	backcolor: "#FF8888",
	createlink: "http://www.google.com/",
	fontname: "sans-serif",
	fontsize: "4",
	forecolor: "#FF0000",
	formatblock: "<div>",
	hilitecolor: "#FF8888",
	inserthorizontalrule: "",
	inserthtml: "ab<b>c</b>d",
	insertimage: "/img/lion.svg",
	inserttext: "a",
};
//@}

var notes = {
//@{
	backcolor: '<strong>Note:</strong> No spec has yet been written, so the spec column does nothing.',
	fontname: 'Note that the body\'s font-family is "serif".',
	hilitecolor: 'In IE we run backColor instead of hiliteColor.',
};
//@}

var doubleTestingCommands = [
//@{
	"backcolor",
	"bold",
	"fontname",
	"fontsize",
	"forecolor",
	"italic",
	"justifycenter",
	"justifyfull",
	"justifyleft",
	"justifyright",
	"strikethrough",
	"subscript",
	"superscript",
	"underline",
];
//@}

function prettyPrint(value) {
//@{
	// Stolen from testharness.js
	for (var i = 0; i < 32; i++) {
		var replace = "\\";
		switch (i) {
		case 0: replace += "0"; break;
		case 1: replace += "x01"; break;
		case 2: replace += "x02"; break;
		case 3: replace += "x03"; break;
		case 4: replace += "x04"; break;
		case 5: replace += "x05"; break;
		case 6: replace += "x06"; break;
		case 7: replace += "x07"; break;
		case 8: replace += "b"; break;
		case 9: replace += "t"; break;
		case 10: replace += "n"; break;
		case 11: replace += "v"; break;
		case 12: replace += "f"; break;
		case 13: replace += "r"; break;
		case 14: replace += "x0e"; break;
		case 15: replace += "x0f"; break;
		case 16: replace += "x10"; break;
		case 17: replace += "x11"; break;
		case 18: replace += "x12"; break;
		case 19: replace += "x13"; break;
		case 20: replace += "x14"; break;
		case 21: replace += "x15"; break;
		case 22: replace += "x16"; break;
		case 23: replace += "x17"; break;
		case 24: replace += "x18"; break;
		case 25: replace += "x19"; break;
		case 26: replace += "x1a"; break;
		case 27: replace += "x1b"; break;
		case 28: replace += "x1c"; break;
		case 29: replace += "x1d"; break;
		case 30: replace += "x1e"; break;
		case 31: replace += "x1f"; break;
		}
		value = value.replace(String.fromCharCode(i), replace);
	}
	return value;
}
//@}

function doSetup(selector, idx) {
//@{
	var table = document.querySelectorAll(selector)[idx];

	var tr = document.createElement("tr");
	table.firstChild.appendChild(tr);
	tr.className = (tr.className + " active").trim();

	return tr;
}
//@}

function doInputCell(tr, test) {
//@{
	var value = null;
	if (typeof test != "string") {
		value = test[0];
		test = test[1];
	}
	var inputCell = document.createElement("td");
	inputCell.innerHTML = "<div></div><div></div>";
	inputCell.firstChild.innerHTML = test;
	inputCell.lastChild.textContent = inputCell.firstChild.innerHTML;
	if (value !== null) {
		value = prettyPrint(value);
		inputCell.lastChild.textContent += ' (value: "' + value + '")';
	}
	tr.appendChild(inputCell);
}
//@}

function doSpecCell(tr, test, command, styleWithCss) {
//@{
	var value;

	if (typeof test != "string") {
		value = test[0];
		test = test[1];
	}

	var specCell = document.createElement("td");
	tr.appendChild(specCell);
	try {
		var points = setupCell(specCell, test);
		var range = document.createRange();
		range.setStart(points[0], points[1]);
		range.setEnd(points[2], points[3]);
		// The points might be backwards
		if (range.collapsed) {
			range.setEnd(points[0], points[1]);
		}
		specCell.firstChild.contentEditable = "true";
		specCell.firstChild.spellcheck = false;
		myExecCommand("styleWithCSS", false, styleWithCss);
		myExecCommand(command, false, value, range);
		specCell.firstChild.contentEditable = "inherit";
		specCell.firstChild.removeAttribute("spellcheck");
		var compareDiv1 = specCell.firstChild.cloneNode(true);
		addBrackets(range);

		if (specCell.childNodes.length != 2) {
			throw "The cell didn't have two children.  Did something spill outside the test div?";
		}

		compareDiv1.normalize();
		var compareDiv2 = compareDiv1.cloneNode(false);
		compareDiv2.innerHTML = compareDiv1.innerHTML;
		// Oddly, IE9 sometimes produces two nodes that return true for
		// isEqualNode but have different innerHTML (omitting closing tags vs.
		// not).
		if (!compareDiv1.isEqualNode(compareDiv2)
		&& compareDiv1.innerHTML != compareDiv2.innerHTML) {
			throw "DOM does not round-trip through serialization!  "
				+ compareDiv1.innerHTML + " vs. " + compareDiv2.innerHTML;
		}
		if (!compareDiv1.isEqualNode(compareDiv2)) {
			throw "DOM does not round-trip through serialization (although innerHTML is the same)!  "
				+ compareDiv1.innerHTML;
		}

		if (specCell.firstChild.attributes.length) {
			throw "Wrapper div has attributes!  " +
				specCell.innerHTML.replace(/<div><\/div>$/, "");
		}

		specCell.lastChild.textContent = specCell.firstChild.innerHTML;
	} catch (e) {
		specCell.firstChild.contentEditable = "inherit";
		specCell.firstChild.removeAttribute("spellcheck");
		specCell.parentNode.className = "alert";
		specCell.lastChild.className = "alert";
		specCell.lastChild.textContent = "Exception: " + e;
		if (typeof e == "object" && "stack" in e) {
			specCell.lastChild.textContent += " (stack: " + e.stack + ")";
		}

		// Don't bother comparing to localStorage, this is always wrong no
		// matter what.
		return;
	}

	var key = "execcommand-" + command
		+ "-" + Number(styleWithCss)
		+ "-" + tr.firstChild.lastChild.textContent;

	// Use getItem() instead of direct property access to work around Firefox
	// bug: https://bugzilla.mozilla.org/show_bug.cgi?id=532062
	var oldValue = localStorage.getItem(key);
	var newValue = specCell.lastChild.firstChild.textContent;

	if (oldValue === null || oldValue !== newValue) {
		specCell.parentNode.className = "alert";
		var alertDiv = document.createElement("div");
		specCell.lastChild.appendChild(alertDiv);
		alertDiv.className = "alert";
		if (oldValue === null) {
			alertDiv.textContent = "Newly added test result";
		} else if (oldValue.replace(/[\[\]{}]/g, "") == newValue.replace(/[\[\]{}]/g, "")) {
			alertDiv.textContent = "Last run produced a different selection: " + oldValue;
		} else {
			alertDiv.textContent = "Last run produced different markup: " + oldValue;
		}

		var button = document.createElement("button");
		alertDiv.appendChild(button);
		button.textContent = "Store new result";
		button.className = "store-new-result";
		button.onclick = (function(key, val, alertDiv) { return function() {
			localStorage[key] = val;
			// Make it easier to do mass updates, and also to jump to the next
			// new result
			var buttons = document.getElementsByClassName("store-new-result");
			for (var i = 0; i < buttons.length; i++) {
				if (isDescendant(buttons[i], alertDiv)
				&& i + 1 < buttons.length) {
					buttons[i + 1].focus();
					break;
				}
			}
			var td = alertDiv;
			while (td.tagName != "TD") {
				td = td.parentNode;
			}
			alertDiv.parentNode.removeChild(alertDiv);
			if (!td.querySelector(".alert")) {
				td.parentNode.className = (" " + td.parentNode.className + " ")
					.replace(/ alert /g, "")
					.replace(/^ | $/g, "");
			}
		} })(key, newValue, alertDiv);
	}
}
//@}

function browserCellException(e, testDiv, browserCell) {
//@{
	if (testDiv) {
		testDiv.contenteditable = "inherit";
		testDiv.removeAttribute("spellcheck");
	}
	browserCell.lastChild.className = "alert";
	browserCell.lastChild.textContent = "Exception: " + e;
	if (typeof e == "object" && "stack" in e) {
		specCell.lastChild.textContent += " (stack: " + e.stack + ")";
	}
	if (testDiv && testDiv.parentNode != browserCell) {
		browserCell.insertBefore(testDiv, browserCell.firstChild);
	}
}
//@}

function doSameCell(tr) {
//@{
	tr.className = (" " + tr.className + " ").replace(" active ", "").trim();

	var sameCell = document.createElement("td");
	var exception = false;
	try {
		// Ad hoc normalization to avoid basically spurious mismatches.  For
		// now this includes ignoring where the selection goes.
		var normalizedSpecCell = tr.childNodes[1].lastChild.firstChild.textContent
			.replace(/[[\]{}]/g, "")
			.replace(/ class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px;"/g, '')
			.replace(/ style="margin-right: 0px;" dir="ltr"/g, '')
			.replace(/ style="margin-left: 0px;" dir="rtl"/g, '')
			.replace(/ style="margin-(left|right): 40px;"/g, '')
			.replace(/: /g, ":")
			.replace(/;? ?"/g, '"')
			.replace(/<(\/?)strong/g, '<$1b')
			.replace(/<(\/?)strike/g, '<$1s')
			.replace(/<(\/?)em/g, '<$1i')
			.replace(/#[0-9a-fA-F]{6}/g, function(match) { return match.toUpperCase(); });
		var normalizedBrowserCell = tr.childNodes[2].lastChild.firstChild.textContent
			.replace(/[[\]{}]/g, "")
			.replace(/ class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px;"/g, '')
			.replace(/ style="margin-right: 0px;" dir="ltr"/g, '')
			.replace(/ style="margin-left: 0px;" dir="rtl"/g, '')
			.replace(/ style="margin-(left|right): 40px;"/g, '')
			.replace(/: /g, ":")
			.replace(/;? ?"/g, '"')
			.replace(/<(\/?)strong/g, '<$1b')
			.replace(/<(\/?)strike/g, '<$1s')
			.replace(/<(\/?)em/g, '<$1i')
			.replace(/#[0-9a-fA-F]{6}/g, function(match) { return match.toUpperCase(); })
			.replace(/ size="2" width="100%"/g, '')
			.replace(/ class="Apple-style-span"/g, "");
		if (navigator.userAgent.indexOf("MSIE") != -1) {
			// IE produces <font style> instead of <span style>, so let's
			// translate all <span>s to <font>s.
			normalizedSpecCell = normalizedSpecCell
				.replace(/<(\/?)span/g, '<$1font');
			normalizedBrowserCell = normalizedBrowserCell
				.replace(/<(\/?)span/g, '<$1font');
		}
	} catch (e) {
		exception = true;
	}
	if (!document.querySelector("#browser-checkbox").checked) {
		sameCell.className = "maybe";
		sameCell.textContent = "?";
	} else if (!exception && normalizedSpecCell == normalizedBrowserCell) {
		sameCell.className = "yes";
		sameCell.textContent = "\u2713";
	} else {
		sameCell.className = "no";
		sameCell.textContent = "\u2717";
	}
	tr.appendChild(sameCell);

	// Insert <wbr> so IE doesn't stretch the screen.  This is considerably
	// more complicated than it has to be, thanks to Firefox's lack of support
	// for outerHTML.
	for (var i = 0; i <= 2; i++) {
		try {
			var div = tr.childNodes[i].lastChild;
			var text = div.firstChild.textContent;
			div.removeChild(div.firstChild);
			div.insertBefore(document.createElement("div"), div.firstChild);
			div.firstChild.innerHTML = text
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "><wbr>")
				.replace(/&lt;/g, "<wbr>&lt;");
			while (div.firstChild.hasChildNodes()) {
				div.insertBefore(div.firstChild.lastChild, div.firstChild.nextSibling);
			}
			div.removeChild(div.firstChild);
		} catch (e) {};
	}
}
//@}

function doTearDown(command) {
//@{
	getSelection().removeAllRanges();
}
//@}

function setupCell(cell, test) {
//@{
	cell.innerHTML = "<div></div><div></div>";

	// A variety of checks to avoid simple errors.  Not foolproof, of course.
	var re = /\{|\[|data-start/g;
	var markers = [];
	var marker;
	while (marker = re.exec(test)) {
		markers.push(marker);
	}
	if (markers.length != 1) {
		throw "Need exactly one start marker ([ or { or data-start), found " + markers.length;
	}

	var re = /\}|\]|data-end/g;
	var markers = [];
	var marker;
	while (marker = re.exec(test)) {
		markers.push(marker);
	}
	if (markers.length != 1) {
		throw "Need exactly one end marker (] or } or data-end), found " + markers.length;
	}

	var node = cell.firstChild;
	node.innerHTML = test;

	var startNode, startOffset, endNode, endOffset;

	// For braces that don't lie inside text nodes, we can't just set
	// innerHTML, because that might disturb the DOM.  For instance, if the
	// brace is right before a <tr>, it could get moved outside the table
	// entirely, which messes everything up pretty badly.  So we instead
	// allow using data attributes: data-start and data-end on the start and
	// end nodes, with a numeric value indicating the offset.  This format
	// doesn't allow the parent div to be a start or end node, but in that case
	// you can always use the curly braces.
	if (node.querySelector("[data-start]")) {
		startNode = node.querySelector("[data-start]");
		startOffset = startNode.getAttribute("data-start");
		startNode.removeAttribute("data-start");
	}
	if (node.querySelector("[data-end]")) {
		endNode = node.querySelector("[data-end]");
		endOffset = endNode.getAttribute("data-end");
		endNode.removeAttribute("data-end");
	}

	var cur = node;
	while (true) {
		if (!cur || (cur != node && !(cur.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINS))) {
			break;
		}

		if (cur.nodeType != Node.TEXT_NODE) {
			cur = nextNode(cur);
			continue;
		}

		var data = cur.data.replace(/\]/g, "");
		var startIdx = data.indexOf("[");

		data = cur.data.replace(/\[/g, "");
		var endIdx = data.indexOf("]");

		cur.data = cur.data.replace(/[\[\]]/g, "");

		if (startIdx != -1) {
			startNode = cur;
			startOffset = startIdx;
		}

		if (endIdx != -1) {
			endNode = cur;
			endOffset = endIdx;
		}

		// These are only legal as the first or last
		data = cur.data.replace(/\}/g, "");
		var elStartIdx = data.indexOf("{");

		data = cur.data.replace(/\{/g, "");
		var elEndIdx = data.indexOf("}");

		if (elStartIdx == 0) {
			startNode = cur.parentNode;
			startOffset = getNodeIndex(cur);
		} else if (elStartIdx != -1) {
			startNode = cur.parentNode;
			startOffset = getNodeIndex(cur) + 1;
		}
		if (elEndIdx == 0) {
			endNode = cur.parentNode;
			endOffset = getNodeIndex(cur);
		} else if (elEndIdx != -1) {
			endNode = cur.parentNode;
			endOffset = getNodeIndex(cur) + 1;
		}

		cur.data = cur.data.replace(/[{}]/g, "");
		if (!cur.data.length) {
			if (cur == startNode || cur == endNode) {
				throw "You put a square bracket where there was no text node . . .";
			}
			var oldCur = cur;
			cur = nextNode(cur);
			oldCur.parentNode.removeChild(oldCur);
		} else {
			cur = nextNode(cur);
		}
	}

	return [startNode, startOffset, endNode, endOffset];
}
//@}

function setSelection(startNode, startOffset, endNode, endOffset) {
//@{
	if (navigator.userAgent.indexOf("Opera") != -1) {
		// Yes, browser sniffing is evil, but I can't be bothered to debug
		// Opera.
		var range = document.createRange();
		range.setStart(startNode, startOffset);
		range.setEnd(endNode, endOffset);
		if (range.collapsed) {
			range.setEnd(startNode, startOffset);
		}
		getSelection().removeAllRanges();
		getSelection().addRange(range);
	} else if ("extend" in getSelection()) {
		// WebKit behaves unreasonably for collapse(), so do that manually.
		/*
		var range = document.createRange();
		range.setStart(startNode, startOffset);
		getSelection().removeAllRanges();
		getSelection().addRange(range);
		*/
		getSelection().collapse(startNode, startOffset);
		getSelection().extend(endNode, endOffset);
	} else {
		// IE9.  Selections have no direction, so we just make the selection
		// always forwards.
		var range;
		if (getSelection().rangeCount) {
			range = getSelection().getRangeAt(0);
		} else {
			range = document.createRange();
		}
		range.setStart(startNode, startOffset);
		range.setEnd(endNode, endOffset);
		if (range.collapsed) {
			// Phooey, we got them backwards.
			range.setEnd(startNode, startOffset);
		}
		if (!getSelection().rangeCount) {
			getSelection().addRange(range);
		}
	}
}
//@}

/**
 * Add brackets at the start and end points of the given range, so that they're
 * visible.
 */
function addBrackets(range) {
//@{
	// Handle the collapsed case specially, to avoid confusingly getting the
	// markers backwards in some cases
	if (range.startContainer.nodeType == Node.TEXT_NODE) {
		if (range.collapsed) {
			range.startContainer.insertData(range.startOffset, "[]");
		} else {
			range.startContainer.insertData(range.startOffset, "[");
		}
	} else {
		// As everyone knows, the only node types are Text and Element.
		var marker = range.collapsed ? "{}" : "{";
		if (range.startOffset != range.startContainer.childNodes.length
		&& range.startContainer.childNodes[range.startOffset].nodeType == Node.TEXT_NODE) {
			range.startContainer.childNodes[range.startOffset].insertData(0, marker);
		} else if (range.startOffset != 0
		&& range.startContainer.childNodes[range.startOffset - 1].nodeType == Node.TEXT_NODE) {
			range.startContainer.childNodes[range.startOffset - 1].appendData(marker);
		} else {
			// Seems to serialize as I'd want even for tables . . . IE doesn't
			// allow undefined to be passed as the second argument (it throws
			// an exception), so we have to explicitly check the number of
			// children and pass null.
			range.startContainer.insertBefore(document.createTextNode(marker),
				range.startContainer.childNodes.length == range.startOffset
				? null
				: range.startContainer.childNodes[range.startOffset]);
		}
	}
	if (range.collapsed) {
		return;
	}
	if (range.endContainer.nodeType == Node.TEXT_NODE) {
		range.endContainer.insertData(range.endOffset, "]");
	} else {
		if (range.endOffset != range.endContainer.childNodes.length
		&& range.endContainer.childNodes[range.endOffset].nodeType == Node.TEXT_NODE) {
			range.endContainer.childNodes[range.endOffset].insertData(0, "}");
		} else if (range.endOffset != 0
		&& range.endContainer.childNodes[range.endOffset - 1].nodeType == Node.TEXT_NODE) {
			range.endContainer.childNodes[range.endOffset - 1].appendData("}");
		} else {
			range.endContainer.insertBefore(document.createTextNode("}"),
				range.endContainer.childNodes.length == range.endOffset
				? null
				: range.endContainer.childNodes[range.endOffset]);
		}
	}
}
//@}
// vim: foldmarker=@{,@} foldmethod=marker

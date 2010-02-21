"use strict";
var Test = {
  "meta" : { 'helps' : [], 'authors' : [], 'reviewers' : [], 'assert' : "" },
  "results" : { 'passes' : 0, 'fails' : 0 },
  "_output" : null
};

Test._prepareHeader = function prepareHeader(aPass) {
  if (Test._output)
    return true;

  if (!document || !document.body)
    return false;

  // Prepare output box.
  Test._output = document.body.appendChild(document.createElement("div"));
  Test._output.id = "output";

  var p = document.createElement("p");
  p.appendChild(document.createTextNode("Passes: "));
  p.appendChild(document.createTextNode("0"));
  Test._output.appendChild(p);
  p = document.createElement("p");
  p.appendChild(document.createTextNode("Fails: "));
  p.appendChild(document.createTextNode("0"));
  Test._output.appendChild(p);
  p = document.createElement("p");
  p.appendChild(document.createTextNode("Score: "));
  p.appendChild(document.createTextNode("0"));
  p.appendChild(document.createTextNode("%"));
  Test._output.appendChild(p);

  // Toggling
  var label = document.createElement("label");
  label.htmlFor = "toggle";
  label.appendChild(document.createTextNode("Show/hide details"));
  var cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = true;
  cb.id = "toggle";
  Test._output.appendChild(label);
  Test._output.appendChild(cb);

  try {
    // Styling
    // Did you know that this doesn't work in WebKit? It's too hard, apparently.
    // See also <http://weblogs.mozillazine.org/bz/archives/020267.html>.
    var style =
      "#output { white-space: pre-line; background: green; display: table; " + 
      "border: solid black; } " +
      "#output.fail { background: red; } " +
      "#output > p { margin: 0 1em; } " + 
      "#output > label { margin-left: 1em; } " +
      "#output > input { margin-right: 1em; } " +
      "#output > input ~ p { margin: 0.5em 0; padding: 0 1em; } " +
      "#output > input:checked ~ p { display: none; } " +
      "#output > input + p { border-top: thin solid black; " +
      "padding-top: 0.5em; } "
    // And this last line doesn't work in IE.
    document.getElementsByTagName("head")[0]
            .appendChild(document.createElement("style"))
            .appendChild(document.createTextNode(style));
  } catch (e) {
    document.body
            .appendChild(document.createElement("p"))
            .appendChild(document.createTextNode("I hate IE."));
  }

  Test._output.appendChild(document.createElement("p"));

  return true;
};

Test._updateHeader = function updateHeader(aPass) {
  if (!Test._prepareHeader())
    return;

  if (!aPass)
    Test._output.className = "fail";

  try {
    Test._output.childNodes[0].lastChild.data = Test['results']['passes'];
    Test._output.childNodes[1].lastChild.data = Test['results']['fails'];
    Test._output.childNodes[2].childNodes[1].data =
      (100 * Test['results']['passes'] /
        (Test['results']['passes'] + Test['results']['fails'])).toFixed(2);
  } catch (e) {
  }
};

Test._log = function log(aPass, aMessage) {
  if (parent.report)
    parent.report(aPass, aMessage);

  ++Test['results'][aPass ? 'passes' : 'fails'];

  Test._updateHeader(aPass);

  if (Test._prepareHeader())
    Test._output.lastChild.appendChild(
      document.createTextNode((aPass ? "PASS" : ("FAIL: " + aMessage)) + "\n"));

  return aPass;
};

Test.separate = function separate() {
  if (parent != this && parent.separate)
    parent.separate();

  if (!Test._prepareHeader())
    return;

  Test._output.appendChild(document.createElement("p"));
};

Test.finish = function finish() {
  if (parent != this && parent.finishTest)
    parent.finishTest();

  if (!Test._prepareHeader())
    return;

  Test._output
      .appendChild(document.createElement("p"))
      .appendChild(document.createTextNode("Finished"));
};

Test.ok = function ok(aCondition, aError) {
  return Test._log(!!aCondition, aError);
};

Test.is = function is(aGot, aExpected, aMsg) {
  var msg;
  if (aMsg)
    msg = aMsg;
  else if (typeof aExpected === "string")
    msg = "got \"" + aGot + "\", expected \"" + aExpected + "\".";
  else
    msg = "got " + aGot + ", expected " + aExpected + ".";
  return Test.ok(aGot === aExpected, msg);
};

Test.pass = function pass(aError) {
  return Test.ok(true, aError);
};

Test.fail = function fail(aError) {
  return Test.ok(false, aError);
};

(function() {
  try {
    // Get metadata.
    var elts;
    elts = document.querySelectorAll('link[rel="help"]');
    for (var i = 0, il = elts.length; i < il; ++i) {
      Test.meta.helps[i] = { 'text' : elts[i].href, 'href' : elts[i].href };
    }
    elts = document
      .querySelectorAll('link[rel~="author"]');
    for (var i = 0, il = elts.length; i < il; ++i) {
      Test.meta.authors[i] = { 'text' : elts[i].title, 'href' : elts[i].href };
    }
    elts = document
      .querySelectorAll('link[rel~="reviewer"]');
    for (var i = 0, il = elts.length; i < il; ++i) {
      Test.meta.reviewers[i] = { 'text' : elts[i].title, 'href' : elts[i].href };
    }
    var elt = document.querySelector('meta[name="assert"]');
    if (elt)
      Test.meta.assert = elt.content;
  } catch (e) {
    document.body
            .appendChild(document.createElement("p"))
            .appendChild(document.createTextNode("I hate IE."));
  }

  Test._prepareHeader();
})();

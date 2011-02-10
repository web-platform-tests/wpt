"use strict";
var Test = {
  "meta" : { 'helps' : [], 'authors' : [], 'reviewers' : [], 'assert' : "" },
  "results" : { 'passes' : 0, 'fails' : 0 },
  "_output" : null,

  "_prepareHeader" : function prepareHeader(aPass) {
    if (this._output)
      return true;

    if (!document || !document.body)
      return false;

    // Prepare output box.
    this._output = document.body.appendChild(document.createElement("div"));
    this._output.id = "output";

    var p = document.createElement("p");
    p.appendChild(document.createTextNode("Passes: "));
    p.appendChild(document.createTextNode("0"));
    this._output.appendChild(p);
    p = document.createElement("p");
    p.appendChild(document.createTextNode("Fails: "));
    p.appendChild(document.createTextNode("0"));
    this._output.appendChild(p);
    p = document.createElement("p");
    p.appendChild(document.createTextNode("Score: "));
    p.appendChild(document.createTextNode("0"));
    p.appendChild(document.createTextNode("%"));
    this._output.appendChild(p);

    // Toggling
    var label = document.createElement("label");
    label.htmlFor = "toggle";
    label.appendChild(document.createTextNode("Show/hide details"));
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.id = "toggle";
    this._output.appendChild(label);
    this._output.appendChild(cb);

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

    this._output.appendChild(document.createElement("p"));

    return true;
  },

  "_updateHeader" : function updateHeader(aPass) {
    if (!this._prepareHeader())
      return;

    if (!aPass)
      this._output.className = "fail";

    try {
      this._output.childNodes[0].lastChild.data = this['results']['passes'];
      this._output.childNodes[1].lastChild.data = this['results']['fails'];
      this._output.childNodes[2].childNodes[1].data =
        (100 * this['results']['passes'] /
          (this['results']['passes'] + this['results']['fails'])).toFixed(2);
    } catch (e) {
    }
  },

  "_log" : function log(aPass, aMessage) {
    if (parent.report)
      parent.report(aPass, aMessage);

    ++this['results'][aPass ? 'passes' : 'fails'];

    this._updateHeader(aPass);

    if (this._prepareHeader())
      this._output.lastChild.appendChild(
        document.createTextNode((aPass ? "PASS" : ("FAIL: " + aMessage)) + "\n"));

    return aPass;
  },

  "separate" : function separate() {
    if (parent !== window && parent.separate)
      parent.separate();

    if (!this._prepareHeader())
      return;

    this._output.appendChild(document.createElement("p"));
  },

  "finish" : function finish() {
    if (parent !== window && parent.finishTest)
      parent.finishTest();

    if (!this._prepareHeader())
      return;

    this._output
        .appendChild(document.createElement("p"))
        .appendChild(document.createTextNode("Finished"));
  },

  "ok" : function ok(aCondition, aError) {
    return this._log(!!aCondition, aError);
  },

  "is" : function is(aGot, aExpected, aMsg) {
    var msg;
    if (aMsg)
      msg = aMsg;
    else if (typeof aExpected === "string")
      msg = "got \"" + aGot + "\", expected \"" + aExpected + "\".";
    else
      msg = "got " + aGot + ", expected " + aExpected + ".";
    return this.ok(aGot === aExpected, msg);
  },

  "throws" : function throws(aLambda, aCode, aType) {
    var type = aType || "DOMException";
    try {
      aLambda();
      Test.fail("This action should have raised an exception.");
    } catch (e) {
      Test.ok(window[type], "Need a " + type + " object.") &&
      Test.ok(e instanceof window[type], "Wrong exception was raised.") &&
      Test.is(e.code, window[type][aCode]);
    }
  },

  "pass" : function pass(aError) {
    return this.ok(true, aError);
  },

  "fail" : function fail(aError) {
    return this.ok(false, aError);
  },

  "runUntilFinish" : function runUntilFinish(aTests) {
    for (var i = 0, il = aTests.length; i < il; ++i) {
      try {
        aTests.shift()();
      } catch (e) {
        if (e instanceof DOMException) {
          this.fail("DOMException was thrown (code " + e.code + ").");
        } else {
          this.fail("Exception was thrown.");
        }
      }
      this.separate();
    }
  },

  "run" : function run(aTests) {
    this.runUntilFinish(aTests);
    this.finish();
  }
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

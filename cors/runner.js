"use strict";
var runner;

function Runner(aPath, options) {
  this.mStartTime = (new Date()).getTime();
  this.mPath = aPath;
  this.mTimeouts = 0;
  this.mToBeProcessed = 1;
  this.mPasses = 0;
  this.mFails = 0;
  this.mIframe = document.createElement("iframe");
  this.mMeter = null;
  this.mScoreNode = null
  this.mPassNode = null
  this.mFailNode = null
  this.mWrapper = null;
  this.mSectionWrapper = null;
  this.mSection = null;
  this.mOl = null;
  this.mTests = [];
  this.mTestCount = -1;
  this.mSkipManual = false;
  this.testOptions = options;
};
Runner.prototype = {
  "sTimeout": 10000, //ms

  "sOrigTitle": document.title,

  "sSupportsMeter": "value" in document.createElement("meter"),

  "currentTest": function Runner_currentTest() {
    return this.mTests[this.mTestCount];
  },

  "start": function Runner_start() {
    var options = parseOptions();
    this.mSkipManual = "skipmanual" in options && options["skipmanual"] === "1";

    document.title = this.sOrigTitle;
    document.documentElement.className = "";

    clearBody();

    var header = document.body.appendChild(document.createElement("header"));
    this.mMeter = header.appendChild(document.createElement("p"))
                        .appendChild(document.createElement("meter"));

    if (!this.sSupportsMeter) {
      this.mMeter.parentNode.style.background = "red";
      this.mMeter.style.background = "limegreen";
      this.mMeter.style.width = "67%";
    }

    var dl = header.appendChild(document.createElement("dl"));
    dl.appendChild(document.createElement("dt"))
      .appendChild(document.createTextNode("Score"));
    this.mScoreNode = dl.appendChild(document.createElement("dd"))
                        .appendChild(document.createTextNode("0%"));
    dl.appendChild(document.createElement("dt"))
      .appendChild(document.createTextNode("Pass"));
    this.mPassNode = dl.appendChild(document.createElement("dd"))
                       .appendChild(document.createTextNode("0"));
    dl.appendChild(document.createElement("dt"))
      .appendChild(document.createTextNode("Fail"));
    this.mFailNode = dl.appendChild(document.createElement("dd"))
                       .appendChild(document.createTextNode("0"));

    this.mWrapper =
      document.body.appendChild(document.createElement("div"));
    this.mWrapper.id = "wrapper";

    this.mSectionWrapper =
      this.mWrapper.appendChild(document.createElement("div"));
    this.mSectionWrapper.id = "results";

    var p = this.mWrapper.appendChild(document.createElement("p"));
    p.id = "iframewrapper";
    p.appendChild(this.mIframe);

    if (!this.mSkipManual) {
      p = this.mWrapper.appendChild(document.createElement("p"));
      p.id = "manualUI";
      p.textContent = "This test has: "

      var button = document.createElement("button")
      button.textContent = "Passed"
      button.onclick = function() {
        report(true, "Tester clicked \"Pass\"");
        runner.currentTest().passes = 1;
        runner.finishTest();
      }
      p.appendChild(button);
      p.appendChild(document.createTextNode(" "));
      button = document.createElement("button")
      button.textContent = "Failed"
      button.onclick = function() {
        report(false, "Tester clicked \"Fail\"");
        runner.currentTest().fails = 1;
        runner.finishTest();
      }
      p.appendChild(button);
      p.appendChild(document.createTextNode(" "));
      button = document.createElement("button")
      button.textContent = "Skip"
      button.onclick = function() {
        runner.finishTest();
      }
      p.appendChild(button);
    }

    var xhr = new XMLHttpRequest(), self = this;
    xhr.onreadystatechange = function onrsc() {
      if (this.readyState !== 4 || !(this.status === 200 || this.status === 0))
        return;
      self.process(this.responseText, "");
    };
    xhr.open("GET", this.mPath + "MANIFEST?nocache="+Math.random());
    xhr.send(null);//Fx 3
  },

  "process": function Runner_process(aManifest, aPath) {
    --this.mToBeProcessed;
    var dirs = this.parseManifest(aManifest.split("\n"), aPath);
    for (var k = 0, kl = dirs.length; k < kl; ++k) {
      var dir = dirs[k] + "/";
      ++this.mToBeProcessed;
      var xhr = new XMLHttpRequest(), self = this;
      xhr.dataDir = dir;
      xhr.onreadystatechange = function() {
        if (this.readyState !== 4 || !(this.status === 200 || this.status === 0))
          return;

        self.process(this.responseText, this.dataDir);
      };
      xhr.open("GET", this.mPath + dir + "MANIFEST?nocache="+Math.random());
      xhr.send(null);//Fx 3
    }

    if (!this.mToBeProcessed) {
      this.runNextTest()
    }
  },

  "parseManifest": function Runner_parseManifest(aLines, aPath) {
    var dirs = [];
    for (var i = 0, il = aLines.length; i < il; ++i) {
      if (!aLines[i]) {
        continue;
      }

      var chunks = aLines[i].split(" ");

      switch (chunks[0]) {
      case "support":
      case "list":
        break;

      case "dir":
        if (chunks[1]) {
          dirs.push(aPath + chunks[1]);
        }
        break;

      case "manual":
        if (chunks[1]) {
          this.mTests.push({ url: aPath + chunks[1] + this.testOptions, passes: 0, fails: 0, type: "manual" });
        }
        break;

      case "ref":
        if (chunks.length % 2) {
          break;
        }
        var reftests = [];
        for (var j = 2, jl = chunks.length; j < jl; j += 2) {
          reftests.push([chunks[j], aPath + chunks[1], aPath + chunks[j + 1]]);
        }
        this.mTests.push({ type: "reftest", url: aPath + chunks[1] + this.testOptions, passes: 0, fails: 0, tests: reftests })
        break;

      default:
        if (chunks.length > 1) {
          break;
        }
        this.mTests.push({ url: aPath + chunks[0] + this.testOptions, passes: 0, fails: 0, type: "automated" });
      }
    }
    return dirs;
  },

  /* ***** Running the test suite ***** */
  "_report": function Runner__report(aPass, aMessageNodes) {
    var li = document.createElement("li");
    li.className = aPass ? "pass" : "fail";
    li.appendChild(document.createTextNode(aPass ? "Pass" : "Fail: "));
    for (var i = 0, il = aMessageNodes.length; i < il; ++i) {
      li.appendChild(aMessageNodes[i]);
    }
    this.mOl.appendChild(li);
  },

  "fail": function Runner_fail(aMsg) {
    ++this.mFails;
    this._report(false, [document.createTextNode(aMsg)]);
  },

  "timedOut": function Runner_timedOut() {
    this.fail("Timed out.");
    ++this.mTimeouts;
    clearTimeout(this.currentTest().timeout);
    this.runNextTest();
  },

  "updateResults": function Runner_updateResults() {
    if (!this.mPasses && !this.mFails)
      return;
    var score = this.mPasses / (this.mPasses + this.mFails);
    var scorestr = (100 * score).toFixed(2) + "%";
    if (this.sSupportsMeter)
      this.mMeter.value = score;
    else
      this.mMeter.style.width = scorestr;
    this.mScoreNode.data = scorestr;
    this.mPassNode.data = this.mPasses;
    this.mFailNode.data = this.mFails;

    var metadata = this.mIframe && this.mIframe.contentWindow &&
      this.mIframe.contentWindow.Test && this.mIframe.contentWindow.Test.meta;
    if (!metadata)
      return;

    var p = this.mSection.appendChild(document.createElement("p"));

    this.appendList("Created by", metadata.authors, p);
    this.appendList("Reviewed by", metadata.reviewers, p);
    this.appendList("Help:", metadata.helps, p);

    if (metadata.assert) {
      p.appendChild(document.createTextNode("Asserting that " + metadata.assert +
                                            "."));
    }
  },

  "createLink": function Runner_createLink(aLink) {
    var a = document.createElement("a");
    a.href = aLink.href;
    a.appendChild(document.createTextNode(aLink.text));
    return a;
  },

  "appendList": function Runner_appendList(aLabel, aList, aEl) {
    if (!aList.length)
      return;

    aEl.appendChild(document.createTextNode(aLabel + " "));
    for (var i = 0, il = aList.length; i < il; ++i) {
      if (i)
        aEl.appendChild(document.createTextNode(", "));
      aEl.appendChild(this.createLink(aList[i]));
    }
    aEl.appendChild(document.createTextNode(". "));
  },

  "addTitle": function Runner_addTitle() {
    this.mSection = document.createElement("section");
    this.mSectionWrapper.appendChild(this.mSection);

    var a = document.createElement("a");
    a.appendChild(document.createTextNode(this.currentTest().url));
    a.href = this.mPath + this.currentTest().url;

    var h1 = document.createElement("h1");
    h1.appendChild(a);
    this.mSection.appendChild(h1);

    this.mOl = this.mSection.appendChild(document.createElement("ol"));
  },

  "hideManualUI": function() {
    document.body.className = ""
  },

  "showManualUI": function() {
    document.body.className = "manual"
  },

  "runNextTest": function Runner_runNextTest() {
    ++this.mTestCount;
    if (!this.currentTest()) {
      this.finish();
      return;
    }

    this.addTitle();

    switch (this.currentTest().type) {
    case "automated":
      if (!this.mSkipManual) {
        this.hideManualUI()
      }
      this.currentTest().timeout =
        setTimeout(function() { runner.timedOut() }, this.sTimeout);
      this.mIframe.src = this.mPath + this.currentTest().url;
      break;

    case "reftest":
      if (!this.mSkipManual) {
        this.hideManualUI()
      }
      this.mIframe.src = "reftest.html?" +
        JSON.stringify([this.mPath, this.currentTest().tests]);
      break;

    case "manual":
      if (!this.mSkipManual) {
        this.showManualUI()
        this.currentTest().timeout =
          setTimeout(function() { runner.timedOut() }, this.sTimeout);
        this.mIframe.src = this.mPath + this.currentTest().url;
      } else {
        this.finishTest();
      }
      break;

    default:
      throw "Unrecognized test type";
    }
  },

  "finishTest": function Report_finishTest() {
    this.mPasses += this.currentTest().passes;
    this.mFails += this.currentTest().fails;
    this.updateResults();
    clearTimeout(this.currentTest().timeout);
    this.runNextTest();
  },

  /* ***** Finishing up ***** */
  "getXMLReport": function Runner_getXMLReport() {
    var container = document.createElement("div");
    var tests = container
      .appendChild(document.createElementNS(null, "testresults"))
        .appendChild(document.createTextNode("\n "))
      .parentNode
        .appendChild(document.createElementNS(null, "browser"))
          .appendChild(document.createTextNode("\n  "))
        .parentNode
          .appendChild(document.createElementNS(null, "ua"))
            .appendChild(document.createTextNode(navigator.userAgent))
        .parentNode.parentNode
          .appendChild(document.createTextNode("\n  "))
        .parentNode
          .appendChild(document.createElementNS(null, "browsername"))
            .appendChild(document.createTextNode("REPLACE WITH BROWSERNAME BEFORE PUSHING TO HG"))
        .parentNode.parentNode
          .appendChild(document.createTextNode("\n  "))
        .parentNode
          .appendChild(document.createElementNS(null, "dateran"))
            .appendChild(document.createTextNode(Date()))
        .parentNode.parentNode
          .appendChild(document.createTextNode("\n "))
      .parentNode.parentNode
        .appendChild(document.createTextNode("\n "))
      .parentNode
        .appendChild(document.createElementNS(null, "tests"));

    for (var i = 0, il = this.mTests.length; i < il; ++i) {
      if (this.mTests[i].passes || this.mTests[i].fails) {
        tests.appendChild(document.createTextNode("\n  "));
        tests
          .appendChild(document.createElementNS(null, "test"))
            .appendChild(document.createTextNode("\n   "))
          .parentNode
            .appendChild(document.createElementNS(null, "uri"))
              .appendChild(document.createTextNode(this.mTests[i].url))
          .parentNode.parentNode
            .appendChild(document.createTextNode("\n   "))
          .parentNode
            .appendChild(document.createElementNS(null, "result"))
              .appendChild(document.createTextNode(
                !this.mTests[i].fails ? "Pass" : "Fail"))
          .parentNode.parentNode
            .appendChild(document.createTextNode("\n  "));
      }
    }
    container
      .firstChild
        .lastChild
          .appendChild(document.createTextNode("\n "))
      .parentNode.parentNode
        .appendChild(document.createTextNode("\n"));
    return container.innerHTML;
  },

  "finish": function Runner_finish() {
    this.mWrapper.removeChild(this.mIframe.parentNode);
    this.updateResults();
    var time = (((new Date()).getTime() - this.mStartTime) / 1000).toFixed(0);
    document.body.appendChild(document.createElement("p"))
                 .appendChild(document.createTextNode("Application ran for "
                                                      + time + " seconds."));
    document.body.appendChild(document.createElement("p"))
                 .appendChild(document.createTextNode(this.mTimeouts + " timeouts."));
    var button = document.body.appendChild(document.createElement("p"))
                              .appendChild(document.createElement("button"));
    button.appendChild(document.createTextNode("Run again"));
    button.value = this.mPath;
    button.onclick = startRunning;
    this.mMeter.onclick = function(e) {
      if (e.altKey) {
        document.open();
        document.write("<pre>");
        document.writeln("  &lt;dt>" + navigator.userAgent);
        document.writeln("  &lt;dd>Pass " + this.mPasses);
        document.writeln("  &lt;dd>Fail " + this.mFails);
        document.writeln("  &lt;dd>Score "
                         + (100 * this.mPasses / (this.mPasses + this.mFails)).toFixed(2) + "%");
        document.write("</pre>");
        document.close();
      }
    };
    document.body.appendChild(document.createElement("p"))
                 .appendChild(document.createElement("textarea"))
                 .appendChild(document.createTextNode(this.getXMLReport()));
    document.title = "Done \u2013 " + document.title;
    document.documentElement.className = "done";
  }
};


/* ***** Preparation ***** */
function parseOptions() {
  var optionstrings = location.search.substring(1).split("&");
  var options = {};
  for (var i = 0, il = optionstrings.length; i < il; ++i) {
    var opt = optionstrings[i];
    options[opt.substring(0, opt.indexOf("="))] =
      opt.substring(opt.indexOf("=") + 1);
  }
  return options;
}

function setup() {
  var options = parseOptions();
  if (options["autorun"] === "1") {
    runner = new Runner(options["path"] || "../html5/");
    runner.start();
    return;
  }

  if (options["path"]) {
    clearBody();
    var button = document.body.appendChild(document.createElement("p"))
                              .appendChild(document.createElement("button"));
    button.appendChild(document.createTextNode("Run tests"));
    button.value = options["path"];
    button.onclick = startRunning;
    return;
  }
    
  var buttons = document.getElementsByTagName("button");
  for (var i = 0, il = buttons.length; i < il; ++i) {
    buttons[i].onclick = startRunning;
  }
}

function startRunning() {
  runner = new Runner(this.value, this.name);
  runner.start();
}


function report(aPass, aMessage) {
  var nodes = [];
  if (!aPass)
    nodes.push(document.createTextNode(aMessage));
  runner._report(aPass, nodes);
}

function result_callback(aTest) {
  if (runner.currentTest().type === "manual" && aTest.status === aTest.TIMEOUT) {
    return;
  }
  var nodes = [];
  if (aTest.message) {
    if (typeof aTest.message === "string") {
      nodes = [document.createTextNode(aTest.message)];
    } else {
      var rendered = runner.mIframe.contentWindow.template.render(aTest.message);
      if (rendered.length) {
        nodes = nodes.concat(rendered);
      } else {
        nodes.push(rendered);
      }
    }
  } else if (aTest.nodes) {
    nodes = aTest.nodes;
  }
  runner._report(!aTest.status, nodes);
  !aTest.status ? runner.currentTest().passes++ : runner.currentTest().fails++;
}

function separate() {
}


function finishTest() {
  runner.currentTest().passes = runner.mIframe.contentWindow.Test.results.passes;
  runner.currentTest().fails = runner.mIframe.contentWindow.Test.results.fails;
  runner.finishTest();
}

function completion_callback(aTests, aStatus) {
  if (runner.currentTest().type === "manual") {
    for (var i = 0, il = aTests.length; i < il; ++i) {
      var test = aTests[i];
      if (test.status == test.TIMEOUT) {
        return;
      }
    }
  }
  runner.finishTest();
}

function clearBody() {
  var i = document.body.childNodes.length;
  while (i--) {
    document.body.removeChild(document.body.childNodes[i]);
  }
}

window.onload = setup;

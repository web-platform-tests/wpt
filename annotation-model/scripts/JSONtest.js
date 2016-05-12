/* globals Promise, done, assert_true, Ajv, on_event */

/**
 * Creates a JSONtest object.  If the parameters are supplied
 * it also loads a referenced testFile, processes that file, loads any
 * referenced external assertions, and sets up event listeners to process the
 * user's test data.  The loading is done asynchronously via Promises.  The test
 * button's text is changed to Loading while it is processing, and to "Check
 * JSON" once the data is loaded.
 *
 * @constructor
 * @param {object} params
 * @param {string} [params.test] - object containing JSON test definition
 * @param {string} [params.testFile] - URI of a file with JSON test definition
 * @param {string} params.runTest - IDREF of an element that when clicked will run the test
 * @param {string} params.testInput - IDREF of an element that contains the JSON(-LD) to evaluate against the assertions in the test / testFile
 * @event DOMContentLoaded Calls init once DOM is fully loaded
 * @returns {object} Reference to the new object
 */

function JSONtest(params) {
  'use strict';

  this.Assertions = [];     // object that will contain the assertions to process
  this.AssertionText = "";  // string that holds the titles of all the assertions in use
  this.Base = null;         // URI "base" for the tests being run
  this.Params = null;       // paramaters passed in
  this.Properties = null;   // testharness_properties from the opening window
  this.Test = null;         // test being run
  this.AssertionCounter = 0;// keeps track of which assertion is being processed

  this._assertionText = []; // Array of text or nested arrays of assertions
  this._assertionCache = [];// Array to put loaded assertions into
  this._loading = true;

  var pending = [] ;

  // set up in case DOM finishes loading early
  pending.push(new Promise(function(resolve) {
    on_event(document, "DOMContentLoaded", function() {
        resolve(true);
    }.bind(this));
  }.bind(this)));

  // create an ajv object that will stay around so that caching
  // of schema that are compiled just works
  this.ajv = new Ajv({allErrors: true, validateSchema: false}) ;

  // determine the base URI for the test collection.  This is
  // the top level folder in the test "document.location"

  var l = document.location;
  var p = l.pathname;
  this.Base = p.substr(0, 1+p.indexOf('/', 1));

  // if we are under runner, then there are props in the parent window
  //
  // if "output" is set in that, then pause at the end of running so the output
  // can be analyzed. @@@TODO@@@
  if (window && window.opener && window.opener.testharness_properties) {
    this.Properties = window.opener.testharness_properties;
  }

  this.Params = params;

  // start by loading the test (it might be inline, but
  // loadTest deals with that
  pending.push(this.loadTest(params)
    .then(function(test) {
      // if the test is NOT an object, turn it into one
      if (typeof test === 'string') {
        test = JSON.parse(test) ;
      }

      this.Test = test;
      return new Promise(function(resolve, reject) {
        if (test.assertions &&
            typeof test.assertions === "object" &&
            Array.isArray(test.assertions) &&
            test.assertions.length > 0) {
          // we have at least one assertion
          // get the inline contents and the references to external files
          var assertFiles = this._assertionRefs(test.assertions);

          var promisedAsserts = assertFiles.map(function(item) {
            return this.loadAssertion(item);
          }.bind(this));

          // Once all the loadAssertion promises resolve...
          Promise.all(promisedAsserts)
          .then(function (assertContents) {
            // assertContents has assertions in document order

            var assertIdx = 0;

            // buildList returns an array of expanded assertion objects
            var buildList = function(assertions, level) {
              // level
              if (level === undefined) {
                level = 1;
              }

              var list = [] ;
              if (assertions) {
                assertions.forEach( function(assert) {
                  // first - what is the type of the assert
                  if (typeof assert === "object" && Array.isArray(assert)) {
                    this.AssertionText += "<ol>";
                    // it is a nested list - recurse
                    list.push(buildList(assert, level+1)) ;
                    this.AssertionText += "</ol>\n";
                  } else {
                    this.AssertionText += "<li>" + assertContents[assertIdx].title + "</li>\n";
                    list.push(assertContents[assertIdx++]);
                  }
                }.bind(this));
              }
              return list;
            }.bind(this);

            // call a recursive function to populate a finalized
            // array of expanded assertions
            this.Assertions = buildList(test.assertions, 0);
            resolve(true);
          }.bind(this));
        } else {
          if (!test.assertions) {
            reject("Test has no assertion property");
          } else {
            reject("Test assertion property is not an Array");
          }
        }
      }.bind(this));
    }.bind(this)));

  // once the DOM and the test / assertions are loaded... set us up
  Promise.all(pending)
  .then(function() {
    this.loading = false;
    this.init();
  }.bind(this));

  return this;
}

JSONtest.prototype = {

  /**
   * @listens click
   */
  init: function() {
    'use strict';
    // set up a handler
    var button = document.getElementById(this.Params.runTest) ;
    var testInput  = document.getElementById(this.Params.testInput) ;
    var assertion  = document.getElementById("assertion") ;

    if (!this.loading) {
      button.disabled = false;
      button.value = "Check JSON";
      if (assertion) {
        assertion.innerHTML = "<ol>" + this.AssertionText + "</ol>\n";
      }
    } else {
      window.alert("Loading did not finish before init handler was called!");
    }

    on_event(button, "click", function() {
      // user clicked
      var content = testInput.value;
      button.disabled = true;

      // make sure content is an object
      if (typeof content === "string") {
        try {
          content = JSON.parse(content) ;
        } catch(err) {
          // if the parsing failed, create a special test and mark it failed
          test( function() {
            assert_true(false, "Parse of JSON failed: " + err) ;
          }, "Parsing submitted input");
          // and just give up
          done() ;
          return ;
        }
      }

      // iterate over all of the tests for this instance
      this.runTests(this.Assertions, content);

      // explicitly tell the test framework we are done
      done() ;
    }.bind(this));
  },

  // runTests - process tests
  /**
   * @param {object} assertions - List of assertions to process
   * @param {string} content - JSON(-LD) to be evaluated
   * @param {string} [testAction='continue'] - state of test processing (in parent when recursing)
   * @param {integer} [level=0] - depth of recursion since assertion lists can nest
   */
  runTests: function(assertions, content, testAction, level) {
    'use strict';

    // level
    if (level === undefined) {
      level = 1;
    }

    // testAction
    if (testAction === undefined) {
      testAction = 'continue';
    }

    // for each assertion (in order) load the external json schema if
    // one is referenced, or use the inline schema if supplied
    // validate content against the referenced schema

    if (assertions) {

      assertions.forEach( function(assert, num) {

        // first - what is the type of the assert
        if (typeof assert === "object" && Array.isArray(assert)) {
          // it is a nested list - recurse
          var subAction = this.runTests(assert, content, testAction, level+1) ;
          if (subAction === 'abort') {
            // we are bailing out
            testAction = 'abort';
          }
        }

        if (testAction === 'abort') {
          return 'abort';
        }

        var schemaName = "inline " + level + ":" + (num+1);

        if (assert.assertionFile) {
          schemaName = "external file " + assert.assertionFile + " " + level + ":" + (num+1);
        }

        var validate = null;

        try {
          validate = this.ajv.compile(assert);
        }
        catch(err) {
          test( function() {
            assert_true(false, "Compilation of schema " + level + ":" + (num+1) + " failed: " + err) ;
          }, "Compiling " + schemaName);
          return ;
        }

        var expected = assert.hasOwnProperty('expectedResult') ? assert.expectedResult : 'valid' ;
        var message = assert.hasOwnProperty('message') ? assert.message : "Result was not " + expected;

        if (testAction !== 'continue') {
          // a previous test told us to not run this test; skip it
          test(function() { }, "SKIPPED: " + assert.title);
        } else {
          // start an actual sub-test
          test(function() {
            var valid = validate(content) ;

            var result = this.determineResult(assert, valid) ;
            var newAction = this.determineAction(assert, result) ;
            // next time around we will use this action
            testAction = newAction;

            var err = ";";
            if (validate.errors !== null) {
              err = "; Errors: " + this.ajv.errorsText(validate.errors) + ";" ;
            }
            if (testAction === 'abort') {
              err += "; Aborting execution of remaining assertions;";
            } else if (testAction === 'skip') {
              err += "; Skipping execution of remaining assertions at level " + level + ";";
            }
            if (result === false) {
              // test result was unexpected; use message
              assert_true(result, message + err);
            } else {
              assert_true(result, err) ;
            }
          }.bind(this), assert.title);
        }
      }.bind(this));
    }

    return testAction;
  },

  determineResult: function(schema, valid) {
    'use strict';
    var r = 'valid' ;
    if (schema.hasOwnProperty('expectedResult')) {
      r = schema.expectedResult;
    }

    if (r === 'valid' && valid || r === 'invalid' && !valid) {
      return true;
    } else {
      return false;
    }
  },

  determineAction: function(schema, result) {
    'use strict';
    // mapping from results to actions
    var mapping = {
      'failAndContinue' : 'continue',
      'failAndSkip'    : 'skip',
      'failAndAbort'   : 'abort',
      'passAndContinue': 'continue',
      'passAndSkip'    : 'skip',
      'passAndAbort'   : 'abort'
    };

    // if the result was as expected, then just keep going
    if (result) {
      return 'continue';
    }

    var a = 'failAndContinue';

    if (schema.hasOwnProperty('onUnexpectedResult')) {
      a = schema.onUnexpectedResult;
    }

    if (mapping[a]) {
      return mapping[a];
    } else {
      return 'continue';
    }
  },

  // loadAssertion - load an Assertion from an external JSON file
  //
  // returns a promise that resolves with the contents of the assertion file

  loadAssertion: function(afile) {
    'use strict';
    if (typeof(afile) === 'string') {
      // it is a file reference - load it
      return new Promise(function(resolve, reject) {
        this._loadFile("GET", this._parseURI(afile), true)
          .then(function(data) {
            data.assertionFile = afile;
            resolve(data);
          }.bind(this))
          .catch(function(err) {
            reject(err);
          });
        }.bind(this));
      }
      else if (afile.hasOwnProperty("assertionFile")) {
      // this object is referecing an external assertion
      return new Promise(function(resolve, reject) {
        this._loadFile("GET", this._parseURI(afile.assertionFile), true)
        .then(function(external) {
          // okay - we have an external object
          Object.keys(afile).forEach(function(key) {
            if (key !== 'assertionFile') {
              external[key] = afile[key];
            }
          });
          resolve(external);
        }.bind(this))
        .catch(function(err) {
          reject(err);
        });
      }.bind(this));
    } else {
      // it is already a loaded assertion - just use it
      return new Promise(function(resolve) {
        resolve(afile);
      });
    }
  },

  // loadTest - load a test from an external JSON file
  //
  // returns a promise that resolves with the contents of the
  // test

  loadTest: function(params) {
    'use strict';

    if (params.hasOwnProperty('testFile')) {
      // the test is referred to by a file name
      return this._loadFile("GET", params.testFile);
    } // else
    return new Promise(function(resolve, reject) {
      if (params.hasOwnProperty('test')) {
        resolve(params.test);
      } else {
        reject("Must supply a 'test' or 'testFile' parameter");
      }
    });
  },

  _parseURI: function(theURI) {
    'use strict';
    // determine what the top level URI should be
    if (theURI.indexOf('/') === -1) {
      // no slash - it's relative to where we are
      // so just use it
      return theURI;
    } else if (theURI.indexOf('/') === 0 || theURI.indexOf('http:') === 0 || theURI.indexOf('https:') === 0) {
      // it is an absolute URI so just use it
      return theURI;
    } else {
      // it is relative and contains a slash.
      // make it relative to the current test root
      return this.Base + theURI;
    }
  },

  /**
   * return a list of all inline assertions or references
   *
   * @param {array} assertions list of assertions to examine
   */

  _assertionRefs: function(assertions) {
    'use strict';
    var ret = [] ;
    assertions.forEach( function(assert) {
      //
      // first - what is the type of the assert
      if (typeof assert === "object" && Array.isArray(assert)) {
        // it is a nested list - recurse
        this._assertionRefs(assert).forEach( function(item) {
          ret.push(item);
        }.bind(this));
      } else if (typeof assert === "object") {
        ret.push(assert) ;
      } else {
        // it is a file name
        ret.push(assert) ;
      }
    }.bind(this));
    return ret;
  },

  // _loadFile - return a promise loading a file
  //
  _loadFile: function(method, url, parse) {
    'use strict';
    if (parse === undefined) {
      parse = true;
    }

    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          var d = xhr.response;
          if (parse) {
            try {
              d = JSON.parse(d);
            }
            catch(err) {
              throw("Parsing of " + url + " failed: " + err);
            }
          }
          resolve(d);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      };
      xhr.send();
    });
  },

};

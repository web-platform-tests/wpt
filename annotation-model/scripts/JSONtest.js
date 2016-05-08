/**
 *
 *
 *
 */

'use strict';

/**
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

  this.Params = null;   // paramaters passed in
  this.Test = null;     // test being run
  this.Base = null;     // URI "base" for the tests being run

  // create an ajv object that will stay around so that caching
  // of schema that are compiled just works
  this.ajv = new Ajv({allErrors: true, validateSchema: false}) ;

  // determine the base URI for the test collection.  This is
  // the top level folder in the test "document.location"

  var l = document.location;
  var p = l.pathname;
  this.Base = p.substr(0, 1+p.indexOf('/', 1));

  if (params) {
    this.Params = params;

    if ( params.test ) {
      // we already loaded it
      this.Test = params.test;
    } else if (params.testFile !== null && params.testFile !== "") {
      var theTest = this.loadTest(params.testFile) ;
      if (theTest) {
        this.Test = theTest;
      }
    } else {
      throw("JSONtest: no test defined");
    }

    if (!this.Params.runTest) {
      throw("JSONtest: No runTest parameter");
    }

    if (!this.Params.testInput) {
      throw("JSONtest: no testInput parameter");
    }

    // we have the required parameters; set a listener

    on_event(document, "DOMContentLoaded", function() {
        this.init() ;
    }.bind(this));
  }
  return this;
}

JSONtest.prototype = {

  /**
   * @listens click
   */
  init: function() {
    // set up a handler
    var button = document.getElementById(this.Params.runTest) ;
    var testInput  = document.getElementById(this.Params.testInput) ;
    on_event(button, "click", function() {
      // user clicked
      var content = testInput.value;
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
      var action = this.runTests(this.Test.assertions, content);

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

    // level
    if (level === undefined) {
      level = 0;
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

        // okay, it isn't an
        var schema = assert ;
        var schemaName = "schema from assertion " + num;

        // if this is a string, then it is a URI.  Load it up
        if (typeof assert === "string") {
          schemaName = "schema from file " + assert + " for assertion " + num;
          schema = this._loadFile("GET", this._parseURI(assert)) ;
        } else if (schema.hasOwnProperty("assertionFile")) {
          // this obect is referecing an external assertion
          var external = this._loadFile("GET", this._parseURI(schema.assertionFile));
          if (typeof external === "string") {
            try {
              external = JSON.parse(external) ;
            }
            catch(e) {
              test( function() {
                assert_true(false, "Parse of external schema " + schema.assertionFile + " failed: " + e) ;
              }, "Parsing " + schemaName);
              return ;
            }
          }
          // okay - we have an external object
          Object.keys(schema).forEach(function(key) {
            if (key !== 'assertionFile') {
              external[key] = schema[key];
            }
          });
          schema = external;
        }

        if (typeof schema === "string") {
          try {
            schema = JSON.parse(schema) ;
          }
          catch(e) {
            test( function() {
              assert_true(false, "Parse of schema " + schemaName + " failed: " + e) ;
            }, "Parsing " + schemaName);
            return ;
          }
        }

        var validate = null;

        try {
          validate = this.ajv.compile(schema);
        }
        catch(err) {
          test( function() {
            assert_true(false, "Compilation of schema " + schemaName + " failed: " + e) ;
          }, "Compiling " + schemaName);
          return ;
        }

        var expected = schema.hasOwnProperty('expectedResult') ? schema.expectedResult : 'valid' ;
        var message = schema.hasOwnProperty('message') ? schema.message : "Result was not " + expected;

        if (testAction !== 'continue') {
          // a previous test told us to not run this test; skip it
          test(function() { }, "SKIPPED: " + schema.title);
        } else {
          // start an actual sub-test
          test(function() {
            var valid = validate(content) ;

            var result = this.determineResult(schema, valid) ;
            var newAction = this.determineAction(schema, result) ;
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
          }.bind(this), schema.title);
        }
      }.bind(this));
    }

    return testAction;
  },

  determineResult: function(schema, valid) {
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

  // _loadFile - synchronously load a file from a URI
  //
  _loadFile: function(method, url) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, false);
    xhr.send(null) ;
    if (xhr.status >= 200 && xhr.status < 300) {
      return(xhr.response);
    } else {
      throw("JSONtest: _loadFile: " + xhr.status + " " + xhr.statusText);
    }
  },

  // loadTest - load a test from an external JSON file

  loadTest: function(theTestFile) {
    // pull in the schema that defines the test
    // NOTE: the schema could already be pulled in...
    // Schema = testSchema;

    var testData = null;

    try {
      testData = this._loadFile('GET', theTestFile);
    } catch(err) {
      throw(err) ;
    }
    return testData;
  },

  _parseURI: function(theURI) {
    // determine what the top level URI should be
    if (theURI.indexOf('/') == -1) {
      // no slash - it's relative to where we are
      // so just use it
      return theURI;
    } else if (theURI.indexOf('/') === 0 || theURI.indexOf('http:') === 0 || theURI.indexOf('https:')) {
      // it is an absolute URI so just use it
      return theURI;
    } else {
      // it is relative and contains a slash.
      // make it relative to the current test root
      return this.suiteBase + theURI;
    }
  }
};

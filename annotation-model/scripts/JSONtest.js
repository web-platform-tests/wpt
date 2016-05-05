// object with methods to evaluate JSON against schema
//
// checks JSON against well defined shapes in JSON Schema
//
// expects as input either an already loaded "test" file or a reference to a
// "test" file.
//
// The format for the "test" file is still in development, but the test references
// are in a property called "assertions".
//
// init function takes a parameter object with the following keys:
//
// test: object containing the parsed contents of the JSON testFile content
// testFile: Name of a file with JSON test content to load
// runTest: A clickable element that could be selected by a user to start the test
// testInput: An element that contains the input to be tested (textarea)
//

'use strict';

function JSONtest(params) {

  // need this in closures from different contexts;
  var testObject = this;

  this.Params = null;
  this.Test = null;
  this.testHandle = null;

  // create an ajv object that will stay around so that caching
  // of schema that are compiled just works
  this.ajv = new Ajv({allErrors: true, validateSchema: false}) ;

  if (params) {
    this.Params = params;

    if ( params.test ) {
      // we already loaded it
      this.Test = params.test;
    } else if (params.testFile !== null && params.testFile !== "") {
      var test = this.loadTest(params.testFile) ;
      if (test) {
        this.Test = test;
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
        testObject.init() ;
    });
  }
  return this;
};

JSONtest.prototype = {

  init: function() {
    // set up a handler
    var button = document.getElementById(this.Params.runTest) ;
    var testInput  = document.getElementById(this.Params.testInput) ;
    var testObject = this ;
    on_event(button, "click", function() {
      // user clicked
      var content = testInput.value;
      testObject.testHandle = async_test(testObject.Test.name) ;
      testObject.runTests(content);
      testObject.testHandle.done() ;
    });
  },

  runTests: function(content) {
    // for each assertion (in order) load the external json schema if
    // one is referenced, or use the inline schema if supplied
    // validate content against
    var t = this ;

    if (t.Test.assertions) {
      t.Test.assertions.forEach( function(assert, num) {

        var schemaName = "schema from assertion " + num;
        if (typeof assert === "string") {
          schemaName = "schema from file " + assert + " for assertion " + num;
        }

        var schema = t.loadTest(assert) ; // embedded or from remote

        var validate = null;

        try {
          validate = t.ajv.compile(schema);
        }
        catch(err) {
          throw("JSONtest: Failed to compile " + schemaName + ": " + validate.errors);
        }

        var valid = validate(content) ;

        // were there errors validating
        if (validate.errors !== null) {
          var err = t.ajv.errorsText(validate.errors) ;
          t.testHandle.step(function() {
            assert_true(valid, schema.title + " Errors: " + err )
          });
        } else {
          t.testHandle.step(function() { assert_true(valid, t.Test.name) });
        }
      });
    }
    return;
  },

  // loadSchema - process schema from string or remote
  //
  // returns an object with the JSON Schema

  loadSchema: function(schema) {
    var ret = null;

    var p = null ; // will be a Promise

    if (typeof schema === "string") {
      // it is a name for a file - load it
      p = t.load_file('GET', assert);
    } else {
      p = new Promise() ;
      p.resolve(schema) ;
    }

    p.then(function(data) {
      if (typeof data === "string") {
        try {
          ret = JSON.parse(schema) ;
        }
        catch(e) {
          throw("JSONtest: Failed to parse schema " + schema + ":" + e);
        }
      } else {
        ret = data;
      }
      return ret;
    }.catch(function(err) {
      throw("JSONtest: loadSchema failed with " + err.statusText") ;
    }
  },


  // load_file - load a file from a URI
  //
  // Returns a Promise that resolves when the load completes or fails
  load_file: function(method, url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
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

  // loadTest - load a test from an external JSON file

  loadTest: function(theTestFile) {
    // pull in the schema that defines the test
    // NOTE: the schema could already be pulled in...
    // Schema = testSchema;

    var testData = null;

    this.load_file('GET', theTestFile)
      .then(function(data) {
        testData = data ;
      }).catch(function(err) {
        throw("JSONtest: Failed to load " + theTestFile + ":" + err.statusText);
      });

    return testData;
  }
}

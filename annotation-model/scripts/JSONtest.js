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

  this.Params = null;
  this.Test = null;

  // create an ajv object that will stay around so that caching
  // of schema that are compiled just works
  this.ajv = new Ajv({allErrors: true, validateSchema: false}) ;

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
};

JSONtest.prototype = {

  init: function() {
    // set up a handler
    var button = document.getElementById(this.Params.runTest) ;
    var testInput  = document.getElementById(this.Params.testInput) ;
    on_event(button, "click", function() {
      // user clicked
      var content = testInput.value;
      // iterate over all of the tests for this instance
      this.runTests(content);
      // explicitly tell the test framework we are done
      done() ;
    }.bind(this));
  },

  runTests: function(content) {
    // first make sure content is an object
    if (typeof content === "string") {
      try {
        content = JSON.parse(content) ;
      } catch(err) {
        // if the parsing failed, create a special test and mark it failed
        test( function() {
          assert_true(false, "Parse of JSON failed: " + err) ;
        }, "Parsing submitted input");
        return ;
      }
    }

    // for each assertion (in order) load the external json schema if
    // one is referenced, or use the inline schema if supplied
    // validate content against the referenced schema
    if (this.Test.assertions) {
      this.Test.assertions.forEach( function(assert, num) {

        var schema = assert ;
        var schemaName = "schema from assertion " + num;
        if (typeof assert === "string") {
          schemaName = "schema from file " + assert + " for assertion " + num;
          schema = this.load_file(assert) ;
        }

        if (typeof schema === "string") {
          try {
            schema = JSON.parse(schema) ;
          }
          catch(e) {
            test( function() {
              assert_true(false, "Parse of schema " + schemaName + " failed: " + e) ;
            }, "Parsing Schema");
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
          }, "Compiling Schema");
          return ;
        }

        test(function() {
          var valid = validate(content) ;

          // were there errors validating
          if (validate.errors !== null) {
            var err = this.ajv.errorsText(validate.errors) ;
            assert_true(valid, schema.title + " Errors: " + err );
          } else {
            assert_true(valid, schema.title);
          }
        }.bind(this));
      }.bind(this));
    }
    return;
  },

  // load_file - synchronously load a file from a URI
  //
  load_file: function(method, url) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, false);
    xhr.send(null) ;
    if (xhr.status >= 200 && xhr.status < 300) {
      return(xhr.response);
    } else {
      throw("JSONtest: load_file: " + xhr.status + " " + xhr.statusText);
    }
  },

  // loadTest - load a test from an external JSON file

  loadTest: function(theTestFile) {
    // pull in the schema that defines the test
    // NOTE: the schema could already be pulled in...
    // Schema = testSchema;

    var testData = null;

    try {
      testData = this.load_file('GET', theTestFile);
    } catch(err) {
      throw(err) ;
    }
    return testData;
  }
}

// object with methods to evaluate JSON against schema
//
// checks JSON against well defined shapes in JSON Schema
//
// expects as input either an alread loaded "test" file or a reference to a
// "test" file.
//
// The format for the "test" file is still in development, but the test portion of
// it is in an attribute with the key testSchema
//
// init function takes a parameter object with the following keys:
//
// test: object containing the parsed contents of the JSON testFile content
// testFile: Name of a file with JSON test content to load
// runTest: A clickable element that could be selected by a user to start the test
// testInput: An element that contains the input to be tested (textarea)
//

'use strict';

var jsonTest = {

  Params: null,
  Schema: null,
  Test:   null,

  // evaluate JSON against a schema in the object attribute theSchema

  checkJSON: function(theJSON) {
    if (!theJSON) {
      console.log("No JSON to test provided!") ;
      return false;
    }
    if (!theSchema) {
      console.log("No schema loaded!");
      return false;
    }

    var ajv = new Ajv({allErrors: true}) ;

    var validate = ajv.compile(theSchema) ;

    var valid = validate(theJSON) ;

    if (valid) {
      return true;
    } else {
      console.log("Errors: "+ajv.errorsText(validate.errors));
      return false;
    }
  },

  // loadTest - load a test from an external JSON file
  loadTest: function(theTestFile) {
    // pull in the schema that defines the test
    // NOTE: the schema could already be pulled in...
    theSchema = testSchema;
  },

  init: function( params ) {
    if (params) {
      Params = params;

      if ( Params.test ) {
        // we already loaded it
        Schema = Params.test.testSchema;
      } else if (Params.testFile !== "") {
        Test = loadTest(Params.testFile) ;
        if (Test) {
          Schema = Test.testSchema;
        }
      } else {
        console.log("No test defined");
      }

      if (Params.runTest && Params.testInput) {
        // we have an ID of an element that we need to watch for a click
      }
    }
    return;
  }
};

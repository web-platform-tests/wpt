/*
  Utility files for platform specific accessibility API tests for the
  Accessibility API Mappings (AAM) standards: Core-AAM and HTML-aam
*/

const AAMUtils = {
  APIS: ['Atspi', 'AXAPI', 'IAccessible2', 'UIA'],

  runAssertions: function(test_statements, results) {
    // If the test was not run, the API doesn't apply to backend OS,
    // pass with no asserts.
    if (!results) {
      return;
    }

    if (results.length !== test_statements.length)
      assert_unreached(`Recieved a different number of results than test statements: ${results}`)

    for (i = 0; i < results.length; i++) {
      assert_equals(results[i], "Pass", `${test_statements[i].join(' ')}`)
    }
  },


  /*
    Creates a subtest for each API. Runs no asserts for APIs not found.

    id:     id of element to test the accessibility node of
    map:    entry in role-map.js, or similar
    name:   name of the test
  */

  verifyAPI: function(test_name, id, map) {
    if (!map) {
      throw "Error: missing accessibility API test map";
    }

    for (const api of this.APIS) {
      if (map[api] && map[api].length) {
        promise_test(async t => {
          let results = await test_driver.test_accessibility_api(
            id,
            map,
            api
          );

          this.runAssertions(map[api], results);

        }, `api: ${api}, ${test_name}`);
      }
    }
  }
}

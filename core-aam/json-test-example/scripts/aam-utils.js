/*
  Utility files for platform specific accessibility API tests for the
  Accessibility API Mappings (AAM) standards: Core-AAM and HTML-aam
*/

const AAMUtils = {

  APIS: ['Atspi', 'AXAPI', 'IAccessible2', 'UIA'],

  /*
    Creates a subtest for each API. Runs no asserts for APIs not found.

    id:     id of element to test the accessibility node of
    map:    entry in role-map.js, or similar
    name:   name of the test
  */

  verifyAPI: function(id, map, test_name) {
    if (!map) {
      throw "Error: missing accessibility API test map";
    }

    for (const api of this.APIS) {
      if (map[api]) {
        promise_test(async t => {
          let result = await test_driver.test_accessibility_api(
            id,
            map,
            api
          );
          if (result) {
            assert_equals(result, "match");
          }
        }, `api: ${api}, ${test_name}`);
      }
    }
  },

  /*
    Creates a subtest for each API. Runs no asserts for APIs not found.

    id:         id of element to test the accessibility node of
    value:      value of the attribute being tested
    map:        entry in attr-map.js, or similar, with the string "<value>"
                to be replaced by the value argument
    test_name:  name of the test
  */

  verifyAttrAPI: function(id, value, map, test_name) {
    if (!map) {
      throw "Error: missing accessibility API test map";
    }

    let new_map = JSON.parse(
      JSON.stringify(map).replaceAll("<value>", value)
    );

    for (const api of this.APIS) {
      if (new_map[api]) {
        promise_test(async t => {
          let result = await test_driver.test_accessibility_api(
            id,
            new_map,
            api
          );
          if (result) {
            assert_equals(result, "match");
          }
        }, `api: ${api}, ${test_name}`);
      }
    }
  },

  /*
    Creates a subtest for each API. Runs no asserts for APIs not found.

    id:         id of element to test the accessibility node of
    relations:  list of ids of "related" elements
    map:        entry in attr-map.js, or similar
    test_name:  name of the test
  */

  verifyRelationAPI: function(id, relations, map, test_name) {
    if (!map) {
      throw "Error: missing accessibility API test map";
    }

    let new_map = JSON.parse(
      JSON.stringify(map).replaceAll("\"<id-list>\"", JSON.stringify(relations))
    );

    for (const api of this.APIS) {
      if (new_map[api]) {
        promise_test(async t => {
          let result = await test_driver.test_accessibility_api(
            id,
            new_map,
            api
          );
          if (result) {
            assert_equals(result, "match");
          }
        }, `api: ${api}, ${test_name}`);
      }
    }
  }
}

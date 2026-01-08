/**
 Browsers currently exhibit non-standard behaviour for what they assume to be a layout table;

 - Calling get_computed_role(aLayoutTable) in Chrome will return "LayoutTable" except in
   Windows/ChromeOS, where it will instead be "table".
 - Calling get_computed_role(aLayoutTable) in Firefox will return "table" in all cases, as the
   determination of layout is driven via an attribute.
 - Calling get_computed_role(aLayoutTable) in WebKit will return "".

 This is obviously far from ideal, and we should standardise a computed role that browsers can use
 to demonstrate that a table is being used for layout, and html-aam can map this to the table role
 as needed. Until that happens, this test will get the computed role from the first layout table,
 and use that to assses the role for all subsequent tests. This function will return a string of
 either "LayoutTable", "", or "table" depending on the combination of Operating System and Browser.

 When this function returns "table" this means that the test suite isn't really testing much, as
 there is no role distinction between a layout table and data table. Those platforms (Chrome on
 Windows/ChromeOS, Firefox) could be manually tested instead, until such a time that ARIA includes
 an explicit "layout-table" role, which can then be consistently tested.
**/
function runTests({ expectedTables, expectedLayoutTables }) {
  let table = document.createElement("table");
  document.body.append(table);
  const computedRoleForLayoutTable = test_driver.get_computed_role(table);
  computedRoleForLayoutTable.then(() => table.remove());

  // promise_test(async () => {
  //   assert_equals(await computedRoleForLayoutTable, "html-layout-table");
  // }, "A table with a layout role should have the role of `html-layout-table`");

  promise_test(async () => {
    assert_in_array(await computedRoleForLayoutTable, [
      "table",
      "LayoutTable",
      "",
      "html-layout-table",
    ]);
  }, "Table with a non-standard role should still be a sensible value");

  const tables = document.body.querySelectorAll(
    "table[data-testname]:not([data-layout]):not([data-nested])",
  );
  const layoutTables = document.body.querySelectorAll(
    "table[data-testname][data-layout]:not([data-nested])",
  );

  test(() => {
    assert_equals(tables.length, expectedTables);
    assert_equals(layoutTables.length, expectedLayoutTables);
  }, "Ensure the right number of tests are running");

  for (const table of tables) {
    create_test_expecting_role(table, "table");
  }
  for (const table of layoutTables) {
    create_test_expecting_role(table, computedRoleForLayoutTable);
  }

  return {
    computedRoleForLayoutTable,
    tables,
    layoutTables,
  };
}

function create_test_expecting_role(table, role) {
  const type = table.hasAttribute("data-layout") ? "layout table" : "table";
  promise_test(
    async () => {
      if (table.hasAttribute("data-nest")) {
        const nest = document.getElementById(table.getAttribute("data-nest"));
        assert_not_equals(
          nest,
          null,
          "table wanted to nest another table but couldn't",
        );
        table.append(nest);
        assert_equals(
          nest.closest("[data-nest]"),
          table,
          "table wanted to nest another table but couldn't",
        );
      }
      assert_equals(
        await test_driver.get_computed_role(table),
        await role,
        table.outerHTML,
      );
    },
    `"${table.getAttribute("data-testname")}" must have a computed role ${type}`,
  );
}

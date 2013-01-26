function assert_data_propdesc(pd, Writable, Enumerable, Configurable) {
  assert_equals(typeof pd, "object");
  assert_equals(pd.writable, Writable);
  assert_equals(pd.enumerable, Enumerable);
  assert_equals(pd.configurable, Configurable);
}

function assert_accessor_propdesc(pd, hasSetter, Enumerable, Configurable) {
  assert_equals(typeof pd, "object");
  assert_equals(typeof pd.get, "function");
  assert_equals("set" in pd, hasSetter,
                "Should have a setter for writable and replaceable attributes");
  assert_equals(typeof pd.set, hasSetter ? "function" : "undefined");
  assert_equals(pd.enumerable, Enumerable);
  assert_equals(pd.configurable, Configurable);
}

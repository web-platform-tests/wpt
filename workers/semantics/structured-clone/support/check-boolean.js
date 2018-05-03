function compare_Boolean(actual, input, test_obj) {
  if (typeof actual === 'string')
    assert_unreached(actual);
  assert_true(actual instanceof Boolean, 'instanceof Boolean');
  assert_equals(String(actual), String(input), 'converted to primitive');
  assert_not_equals(actual, input);
  if (test_obj)
    test_obj.done();
}

check('Boolean true', new Boolean(true), compare_Boolean);
check('Boolean false', new Boolean(false), compare_Boolean);
check('Array Boolean objects', [new Boolean(true), new Boolean(false)], compare_Array(enumerate_props(compare_Boolean)));
check('Object Boolean objects', {'true':new Boolean(true), 'false':new Boolean(false)}, compare_Object(enumerate_props(compare_Boolean)));

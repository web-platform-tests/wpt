function assert_has_property(obj, name, desc) {
  assert_true(undefined != obj[name], desc);
};

function assert_is_method(obj, name, desc) {
  assert_true("function" === typeof obj[name], desc);
};

function assert_defined(obj, desc) {
  assert_true(undefined != obj, desc);
};

function assert_array_approx_equals(actual, expected, epsilon, description)
{
  assert_true(actual.length === expected.length,
              (description + ": lengths differ, expected " + expected.length + " got " + actual.length))

  for (var i=0; i < actual.length; i++) {
    assert_approx_equals(actual[i], expected[i], epsilon, (description + ": element " + i))
  }
}

function assert_array_approx_equals(actual, expected, epsilon, description)
{
  assert_true(actual.length === expected.length,
              (description + ": lengths differ, expected " + expected.length + " got " + actual.length))

  for (var i=0; i < actual.length; i++) {
    assert_approx_equals(actual[i], expected[i], epsilon, (description + ": element " + i))
  }
}

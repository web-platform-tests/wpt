// We override only the things we need to -- the rest we'll just inherit from
// original-harness.js.  Polymorphism, kind of.
ReflectionHarness.conformanceTesting = true;

ReflectionHarness.test = function(fun, description) {
  test(fun, this.getTypeDescription() + ": " + description);
}

ReflectionHarness.assertEquals = assert_equals;

ReflectionHarness.assertInArray = assert_in_array;

ReflectionHarness.assertArrayEquals = assert_array_equals;

ReflectionHarness.assertThrows = assert_throws_dom;

ReflectionHarness.stringRep = format_value


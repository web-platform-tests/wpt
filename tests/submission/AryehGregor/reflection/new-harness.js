// We override only the things we need to -- the rest we'll just inherit from
// original-harness.js.  Polymorphism, kind of.
ReflectionHarness.catchUnexpectedExceptions = false;

ReflectionHarness.test = function(expected, actual, description) {
	test(function() {
		assert_equals(expected, actual);
	}, this.getTypeDescription() + ": " + description);
	return expected === actual;
}

ReflectionHarness.testException = function(exceptionName, fn, description) {
	test(function() {
		assert_throws(exceptionName, fn);
	}, this.getTypeDescription() + ": " + description);
}

  test(function () {
    const type = [
        'resource',
        'mark',
        'feature',
        'paint',
    ];
    type.forEach(function(name) {
      assert_equals(typeof self.performance, "object");
      assert_equals(typeof self.performance.getEntriesByType, "function");
      var nameUppercased = name.toUpperCase();
      var nameCapitalized = name[0].toUpperCase() + name.substring(1);
      var lowerList = self.performance.getEntriesByType(name);
      var upperList = self.performance.getEntriesByType(nameUpperCased);
      var mixedList = self.performance.getEntriesByType(nameCapitalized);

      assert_not_equals(lowerList.length, 0, "Resource entries exist");
      assert_equals(upperList.length, 0, "getEntriesByType('" + nameCapitalized + "').length");
      assert_equals(mixedList.length, 0, "getEntriesByType('" + nameCapitalized + "').length");
    });

  }, "getEntriesByType values are case sensitive");

  test(function () {
    assert_equals(typeof self.performance, "object");
    assert_equals(typeof self.performance.getEntriesByName, "function");
    var origin = self.location.protocol + "//" + self.location.host;
    var location1 = origin.toUpperCase() + "/resources/testharness.js";
    var location2 = self.location.protocol + "//"
     + self.location.host.toUpperCase() + "/resources/testharness.js";
    var lowerList = self.performance.getEntriesByName(origin + "/resources/testharness.js");
    var upperList = self.performance.getEntriesByName(location1);
    var mixedList = self.performance.getEntriesByName(location2);

    assert_equals(lowerList.length, 1, "Resource entry exist");
    assert_equals(upperList.length, 0, "getEntriesByName('" + location1 + "').length");
    assert_equals(mixedList.length, 0, "getEntriesByName('" + location2 + "').length");

  }, "getEntriesByName values are case sensitive");

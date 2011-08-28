function testConstants(objects, constants, msg) {
  objects.forEach(function(o) {
    test(function() {
      constants.forEach(function(d) {
        assert_equals(o[d[0]], d[1], "Object " + o)
      })
    }, "Constants for " + msg + " on " + o + ".")
  })
}

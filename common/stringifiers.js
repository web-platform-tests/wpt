// Tests <http://dev.w3.org/2006/webapi/WebIDL/#es-stringifier>.
function test_stringifier_attribute(aObject, aAttribute) {
  // Step 1.
  test(function() {
    [null, undefined].forEach(function(v) {
      assert_throws(new TypeError(), function() {
        aObject.toString.call(v);
      });
    });
  });

  // Step 2.
  test(function() {
    assert_false("Window" in window && aObject instanceof window.Window);
    [{}, window].forEach(function(v) {
      assert_throws(new TypeError(), function() {
        aObject.toString.call(v)
      });
    });
  });

  // Step 3.
  var test_error = { name: "test" };
  test(function() {
    Object.defineProperty(aObject, aAttribute, {
      configurable: true,
      get: function() { throw test_error; }
    });
    assert_throws(test_error, function() {
      aObject.toString();
    });
  });

  // Step 4.
  test(function() {
    Object.defineProperty(aObject, aAttribute, {
      configurable: true,
      value: { toString: function() { throw test_error; } }
    });
    assert_throws(test_error, function() {
      aObject.toString();
    });
  });
}

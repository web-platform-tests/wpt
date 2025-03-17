// META: global=shadowrealm

// The non-ShadowRealm version of this test is in Event-type.html.

test(function() {
  var e = new Event("bar")
  assert_equals(e.type, "bar")
}, "Event.type should be initialized by the constructor");

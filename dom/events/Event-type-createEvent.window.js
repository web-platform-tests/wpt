// META: title=Event.type (document.createEvent)

// Author: Ms2ger <Ms2ger@gmail.com>
// https://dom.spec.whatwg.org/#dom-event-type

test(function() {
  var e = document.createEvent("Event")
  assert_equals(e.type, "");
}, "Event.type should initially be the empty string");

test(function() {
  var e = document.createEvent("Event")
  e.initEvent("foo", false, false)
  assert_equals(e.type, "foo")
}, "Event.type should be initialized by initEvent");

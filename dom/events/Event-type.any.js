// META: title=Event.type (document.createEvent)

// Author: Ms2ger <Ms2ger@gmail.com>
// https://dom.spec.whatwg.org/#dom-event-type

// There is another version of this test depending on document.createEvent(), in
// Event-type-createEvent.window.js.

test(function() {
  var e = new Event("bar")
  assert_equals(e.type, "bar")
}, "Event.type should be initialized by the constructor");

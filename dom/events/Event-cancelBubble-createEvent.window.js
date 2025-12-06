// META: title=Event.cancelBubble (document.createEvent)

// Author: Chris Rebert <http://chrisrebert.com>

test(function () {
  // See https://dom.spec.whatwg.org/#stop-propagation-flag
  var e = document.createEvent('Event');
  assert_false(e.cancelBubble, "cancelBubble must be false after event creation.");
}, "cancelBubble must be false when an event is initially created.");

test(function () {
  // See https://dom.spec.whatwg.org/#concept-event-initialize

  // Event which bubbles.
  var one = document.createEvent('Event');
  one.cancelBubble = true;
  one.initEvent('foo', true/*bubbles*/, false/*cancelable*/);
  assert_false(one.cancelBubble, "initEvent() must set cancelBubble to false. [bubbles=true]");
  // Re-initialization.
  one.cancelBubble = true;
  one.initEvent('foo', true/*bubbles*/, false/*cancelable*/);
  assert_false(one.cancelBubble, "2nd initEvent() call must set cancelBubble to false. [bubbles=true]");

  // Event which doesn't bubble.
  var two = document.createEvent('Event');
  two.cancelBubble = true;
  two.initEvent('foo', false/*bubbles*/, false/*cancelable*/);
  assert_false(two.cancelBubble, "initEvent() must set cancelBubble to false. [bubbles=false]");
  // Re-initialization.
  two.cancelBubble = true;
  two.initEvent('foo', false/*bubbles*/, false/*cancelable*/);
  assert_false(two.cancelBubble, "2nd initEvent() call must set cancelBubble to false. [bubbles=false]");
}, "Initializing an event must set cancelBubble to false.");

test(function () {
  // See https://dom.spec.whatwg.org/#dom-event-stoppropagation
  var e = document.createEvent('Event');
  e.stopPropagation();
  assert_true(e.cancelBubble, "stopPropagation() must set cancelBubble to true.");
}, "stopPropagation() must set cancelBubble to true.");

test(function () {
  // See https://dom.spec.whatwg.org/#dom-event-stopimmediatepropagation
  var e = document.createEvent('Event');
  e.stopImmediatePropagation();
  assert_true(e.cancelBubble, "stopImmediatePropagation() must set cancelBubble to true.");
}, "stopImmediatePropagation() must set cancelBubble to true.");

test(function () {
  var one = document.createEvent('Event');
  one.stopPropagation();
  one.cancelBubble = false;
  assert_true(one.cancelBubble, "cancelBubble must still be true after attempting to set it to false.");
}, "Event.cancelBubble=false must have no effect.");

test(function () {
  // See https://dom.spec.whatwg.org/#concept-event-dispatch
  // "14. Unset event’s [...] stop propagation flag,"
  var e = document.createEvent('Event');
  e.initEvent('foobar', true/*bubbles*/, true/*cancelable*/);
  document.body.addEventListener('foobar', function listener(e) {
    e.stopPropagation();
  });
  document.body.dispatchEvent(e);
  assert_false(e.cancelBubble, "cancelBubble must be false after an event has been dispatched.");
}, "cancelBubble must be false after an event has been dispatched.");

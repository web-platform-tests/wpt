test(() => {
  const target = new EventTarget();
  assert_true(
    typeof target.on === "function",
    "EventTarget should have the on method"
  );

  const testEvents = target.on("test");
  assert_true(
    testEvents instanceof Observable,
    "EventTarget.on should return an Observable"
  );

  const results = [];
  testEvents.subscribe({
    next: (value) => results.push(value),
    error: () => assert_unreached("should not error"),
    complete: () => assert_unreached("should not complete"),
  });

  assert_array_equals(results, [], "should not emit until the event fires");

  const event = new Event("test");
  target.dispatchEvent(event);
  assert_array_equals(results, [event], "should emit the event");

  target.dispatchEvent(event);
  assert_array_equals(results, [event, event], "should emit the event");
}, "EventTarget should have the on method");

test(() => {
  const target = new EventTarget();
  const testEvents = target.on("test");
  const ac = new AbortController();
  const results = [];
  testEvents.subscribe({
    next: (value) => results.push(value),
    error: () => assert_unreached("should not error"),
    complete: () => assert_unreached("should not complete"),
    signal: ac.signal,
  });

  assert_array_equals(results, [], "should not emit until the event fires");

  const event1 = new Event("test");
  const event2 = new Event("test");
  const event3 = new Event("test");
  target.dispatchEvent(event1);
  target.dispatchEvent(event2);

  assert_array_equals(results, [event1, event2], "should emit the events");

  ac.abort();
  target.dispatchEvent(event3);

  assert_array_equals(
    results,
    [event1, event2],
    "aborting the subscription should stop the emission of events"
  );
}, "aborting the subscriptoin should stop the emission of events");

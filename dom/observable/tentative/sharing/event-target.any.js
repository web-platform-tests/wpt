// META: title=Observable sharing proposal: EventTarget integration
// META: global=window,dedicatedworker
// META: spec=https://github.com/WICG/observable/issues/221

test(t => {
  const target = new EventTarget();
  const events = target.when("message");
  const stop = new AbortController();
  t.add_cleanup(() => stop.abort());
  const log = [];
  assert_not_equals(events.share(), events);
  events.subscribe(() => log.push("A"), {signal: stop.signal});
  target.addEventListener("message", () => log.push("between"), {signal: stop.signal});
  events.subscribe(() => log.push("B"), {signal: stop.signal});
  target.dispatchEvent(new Event("message"));
  assert_array_equals(log, ["A", "between", "B"]);
}, "EventTarget.when() installs a separate event listener for each observation");

test(() => {
  const target = new EventTarget();
  const once = target.when("message").take(1);
  const a = [];
  const b = [];
  once.subscribe(event => a.push(event));
  const first = new Event("message");
  target.dispatchEvent(first);
  once.subscribe(event => b.push(event));
  const second = new Event("message");
  target.dispatchEvent(second);
  assert_array_equals(a, [first]);
  assert_array_equals(b, [second]);
  assert_not_equals(once.share(), once);
}, "EventTarget.when() composition is ordinary and can independently observe a later event");

test(() => {
  const target = new EventTarget();
  const events = target.when("message");
  const stop = new AbortController();
  const log = [];
  events.subscribe(() => stop.abort(), {signal: stop.signal});
  events.subscribe(() => log.push("second"), {signal: stop.signal});
  target.dispatchEvent(new Event("message"));
  target.dispatchEvent(new Event("message"));
  assert_array_equals(log, []);
}, "Cancellation during event delivery synchronously removes independent observations");

test(() => {
  const target = new EventTarget();
  let effects = 0;
  const shared = target.when("submit", {passive: false}).inspect(() => ++effects).share();
  const stop = new AbortController();
  const values = [];
  assert_equals(effects, 0);
  shared.subscribe(event => event.preventDefault(), {signal: stop.signal});
  shared.subscribe(event => values.push(event), {signal: stop.signal});
  const event = new Event("submit", {cancelable: true});
  assert_false(target.dispatchEvent(event));
  assert_true(event.defaultPrevented);
  assert_equals(effects, 1);
  assert_array_equals(values, [event]);
  stop.abort();
  target.dispatchEvent(new Event("submit"));
  assert_equals(effects, 1);
}, "Explicitly shared event work runs once and retains synchronous preventDefault");

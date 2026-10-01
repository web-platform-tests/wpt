// META: title=window.event and the realm of an event handler's callback

// DOM sets window.event on listenerGlobal, the event listener callback's
// associated realm's global object. For an event handler the event listener
// callback is the one HTML creates in "activate an event handler", and HTML
// says nothing about which realm that is created in, so which global observes
// window.event is unspecified. These tests check that an event handler behaves
// like addEventListener(), i.e. that it is the realm of the function the event
// handler is set to.
//
// https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke
// https://html.spec.whatwg.org/multipage/webappapis.html#activate-an-event-handler

// Microtasks queued from a listener run before inner invoke restores the
// current event, so window.event is still set in a promise continuation chained
// off one. Get out to a fresh task before dispatching anything.
async function leaveEventDispatch(t) {
  await new Promise(resolve => t.step_timeout(resolve, 0));
  assert_equals(window.event, undefined, "precondition: no current event in this realm");
}

async function setUpFrame(t) {
  const frame = document.createElement("iframe");
  frame.srcdoc = `<script>
    parent.makeCallback = () => function () {
      parent.record = { inFrame: window.event, inTop: parent.event };
    };
  </script>`;
  const loaded = new Promise(resolve => {
    frame.addEventListener("load", resolve, { once: true });
  });
  t.add_cleanup(() => frame.remove());
  document.body.append(frame);
  await loaded;

  await leaveEventDispatch(t);
  window.record = null;
}

promise_test(async t => {
  await setUpFrame(t);
  const element = document.createElement("div");
  element.addEventListener("click", window.makeCallback());

  const event = new Event("click");
  element.dispatchEvent(event);

  assert_equals(window.record.inFrame, event, "window.event in the callback's realm");
  assert_equals(window.record.inTop, undefined, "window.event in this realm");
}, "window.event for an addEventListener() callback from another global");

promise_test(async t => {
  await setUpFrame(t);
  const element = document.createElement("div");
  element.onclick = window.makeCallback();

  const event = new Event("click");
  element.dispatchEvent(event);

  assert_equals(window.record.inFrame, event, "window.event in the callback's realm");
  assert_equals(window.record.inTop, undefined, "window.event in this realm");
}, "window.event for an event handler set to a function from another global");

// An event handler content attribute is compiled lazily, in the element's node
// document's realm as of the time it is compiled, which is during the first
// dispatch. That is after inner invoke has already determined listenerGlobal,
// so an implementation that determines it when the handler is activated rather
// than when it is invoked would observe a different global for the first
// dispatch than for the second.
promise_test(async t => {
  const frames = [document.createElement("iframe"), document.createElement("iframe")];
  const loaded = frames.map(frame => new Promise(resolve => {
    frame.addEventListener("load", resolve, { once: true });
  }));
  t.add_cleanup(() => frames.forEach(frame => frame.remove()));
  document.body.append(...frames);
  await Promise.all(loaded);
  await leaveEventDispatch(t);

  const [zero, one] = frames.map(frame => frame.contentWindow);
  const seen = [];
  t.add_cleanup(() => {
    delete window.recordRealms;
    delete window.candidateZero;
    delete window.candidateOne;
  });
  window.candidateZero = zero;
  window.candidateOne = one;
  window.recordRealms = (own, ownEvent, zeroEvent, oneEvent, topEvent) => {
    seen.push([
      own === zero ? "zero" : own === one ? "one" : own === window ? "top" : "other",
      ownEvent !== undefined,
      zeroEvent !== undefined,
      oneEvent !== undefined,
      topEvent !== undefined,
    ].join(" "));
  };

  // The handler is activated while the element is in the second frame's
  // document, but it is compiled in the first frame's document's realm.
  const element = one.document.createElement("div");
  element.setAttribute("onclick",
      "top.recordRealms(window, window.event, top.candidateZero.event, " +
      "top.candidateOne.event, top.event)");
  zero.document.body.append(element);

  element.dispatchEvent(new Event("click"));
  element.dispatchEvent(new Event("click"));

  assert_equals(seen.length, 2, "the handler ran twice");
  assert_equals(seen[0], seen[1], "the first and second dispatch agree");
  assert_equals(seen[0], "zero true true false false",
                "window.event is set only in the realm the handler was compiled in");
}, "window.event for an event handler content attribute compiled in another global");

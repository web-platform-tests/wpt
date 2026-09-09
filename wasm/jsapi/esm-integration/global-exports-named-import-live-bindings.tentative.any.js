// META: global=window,dedicatedworker,jsshell

promise_test(async () => {
  const m = await import("./resources/named-import-mutable-value.js");
  m.setGlobal(111);
  assert_equals(m.getGlobal(), 111);
  assert_equals(m.readNamed(), 111);

  m.setGlobal(222);
  assert_equals(m.getGlobal(), 222);
  assert_equals(m.readNamed(), 222);
}, "Named imports of wasm mutable globals should be live");

promise_test(async () => {
  const ns = await import("./resources/js-reexport-mutable-value.js");
  ns.setGlobal(333);
  assert_equals(ns.getGlobal(), 333);
  assert_equals(ns.mutableValue, 333);

  ns.setGlobal(444);
  assert_equals(ns.getGlobal(), 444);
  assert_equals(ns.mutableValue, 444);
}, "JS re-export of a wasm mutable global should stay live");

promise_test(async () => {
  const ns = await import("./resources/js-reexport-mutable-value.js");
  assert_throws_js(TypeError, () => {
    ns.mutableValue = 1;
  });
}, "JS re-export of a wasm mutable global is not assignable");

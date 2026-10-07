// META: global=window,dedicatedworker,jsshell

promise_test(async () => {
  const ns = await import("./resources/string-constant-reserved-name.wasm");
  assert_equals(ns.s, "wasm:hello");
}, "A string constant named wasm:hello is exported");

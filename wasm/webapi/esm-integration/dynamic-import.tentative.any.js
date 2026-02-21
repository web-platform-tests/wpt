// META: title=WebAssembly ESM integration with dynamic import
// META: global=window,dedicatedworker,shadowrealm-in-window,shadowrealm-in-shadowrealm,shadowrealm-in-dedicatedworker,shadowrealm-in-sharedworker

// Tests the same things as the *.tentative.html tests in this folder (excluding
// CSP and source phase imports), but with dynamic import and in multiple
// globals

"use strict";

promise_test(async () => {
  globalThis.log = [];
  await import("./resources/execute-start.wasm");
  assert_array_equals(globalThis.log, ["executed"],
    "Imported array should be written to");
}, "Check execution of WebAssembly start function");

promise_test(async () => {
  const mod = await import("./resources/exported-names.wasm");
  assert_array_equals(Object.getOwnPropertyNames(mod).sort(),
    ["func", "glob", "mem", "tab"],
    "Exports should be correct");
  assert_true(mod.func instanceof Function, "func export should be a Function");
  assert_true(mod.mem instanceof WebAssembly.Memory,
    "mem export should be a WebAssembly.Memory");
  assert_true(mod.glob instanceof WebAssembly.Global,
    "glob export should be a WebAssembly.Global");
  assert_true(mod.tab instanceof WebAssembly.Table,
    "tab export should be a WebAssembly.Table");
  assert_throws_js(TypeError, () => { mod.func = 2; },
    "Export should be non-writable (throws in strict mode)");
}, "Exported names from a WebAssembly module");

promise_test(async t => {
  await promise_rejects_js(t, WebAssembly.CompileError,
    import("./resources/invalid-bytecode.wasm"),
    "Importing module with invalid bytecode should throw CompileError");
}, "Handling of importing a WebAssembly module with invalid bytecode");

promise_test(async t => {
  await promise_rejects_js(t, WebAssembly.LinkError,
    import("./resources/js-wasm-cycle-value.js"),
    "value");
  await promise_rejects_js(t, WebAssembly.LinkError,
    import("./resources/js-wasm-cycle-global.js"),
    "global");
  await promise_rejects_js(t, WebAssembly.LinkError,
    import("./resources/js-wasm-cycle-memory.js"),
    "memory");
  await promise_rejects_js(t, WebAssembly.LinkError,
    import("./resources/js-wasm-cycle-table.js"),
    "table");
  await promise_rejects_js(t, WebAssembly.LinkError,
    import("./resources/js-wasm-cycle-function-error.js"),
    "function error");
}, "Cyclic linking between JavaScript and WebAssembly (JS higher)");

promise_test(async () => {
  const { f } = await import("./resources/js-wasm-cycle.js");
  assert_equals(f(), 24, "exported function f");
}, "Check bindings in JavaScript and WebAssembly cycle (JS higher)");

promise_test(async t => {
  await promise_rejects_js(t, WebAssembly.CompileError,
    import("./resources/invalid-module.wasm"),
    "Importing invalid module should throw CompileError");
}, "Handling of importing an invalid WebAssembly module");

promise_test(async t => {
  await promise_rejects_js(t, SyntaxError,
    import("./resolve-export.js"),
    "Re-export of missing Wasm export should result in SyntaxError.");
}, "Check ResolveExport on invalid re-export from WebAssembly");

promise_test(async () => {
  globalThis.log = [];
  const { logExec } = await import("./resources/wasm-import-from-wasm.wasm");
  logExec();
  assert_array_equals(globalThis.log, ["executed"],
    "Imported array should be written to");
}, "Check import and export between WebAssembly modules");

promise_test(async t => {
  await promise_rejects_js(t, WebAssembly.LinkError,
    import("./resources/wasm-import-func.wasm"),
    "func");
  await promise_rejects_js(t, WebAssembly.LinkError,
    import("./resources/wasm-import-memory.wasm"),
    "memory");
  await promise_rejects_js(t, WebAssembly.LinkError,
    import("./resources/wasm-import-table.wasm"),
    "table");
  await promise_rejects_js(t, WebAssembly.LinkError,
    import("./resources/wasm-import-global.wasm"),
    "global");
}, "Errors for imports of WebAssembly modules");

promise_test(async () => {
  const wasm = await import("./resources/wasm-js-cycle.wasm");
  const js = await import("./resources/wasm-js-cycle.js");

  js.mutateBindings();

  assert_true(wasm.wasmGlob instanceof WebAssembly.Global,
    "wasmGlob should be a WebAssembly.Global");
  assert_equals(wasm.wasmGlob.valueOf(), 24, "wasmGlob valueOf()");

  assert_true(wasm.wasmFunc instanceof Function,
    "wasmFunc should be a Function");
  assert_equals(wasm.wasmFunc(), 43, "wasmFunc return value");

  assert_equals(wasm.incrementGlob(), 43, "incrementGlob return value");

  const buf = new Int32Array(wasm.wasmMem.buffer);
  assert_equals(buf[0], 0, "wasmMem buffer first element");
  assert_equals(wasm.mutateMem(), 42, "mutateMem return value");
  assert_equals(buf[0], 42, "wasmMem buffer mutated first element");

  assert_equals(wasm.wasmTab.get(0), null, "wasmTab 0");
  const ref = wasm.mutateTab();
  assert_true(ref instanceof Function,
    "mutateTab return value should be a Function");
  assert_equals(wasm.wasmTab.get(0), ref, "wasmTab mutated 0");
}, "Check bindings in JavaScript and WebAssembly cycle (Wasm higher)");

promise_test(async t => {
  await promise_rejects_js(t, WebAssembly.LinkError,
    import("./resources/wasm-import-error-from-wasm.wasm"),
    "should throw LinkError");
}, "Errors for linking WebAssembly module scripts");

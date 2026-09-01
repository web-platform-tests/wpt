// META: global=window,dedicatedworker,jsshell

promise_test(async () => {
  const exporterModule = await import("./resources/exnref-export.wasm");
  const reexporterModule = await import("./resources/exnref-reexport.wasm");

  assert_throws_js(ReferenceError, () => exporterModule.exnrefExport);
  assert_throws_js(ReferenceError, () => reexporterModule.reexportedExnrefExport);
}, "exnref global exports should cause TDZ errors");

// META: global=window,worker
// META: script=/wasm/jsapi/wasm-module-builder.js

["compileStreaming", "instantiateStreaming"].forEach(method => {
  promise_test(async t => {
    const buffer = new WasmModuleBuilder().toBuffer();
    const argument = new Response(buffer, { headers: { "Content-Type": "test/test" } });
    argument.headers.set("Content-Type", "application/wasm");
    const wasm = await WebAssembly[method](argument);
    // Ensure body can only be read once
    return promise_rejects_js(t, TypeError, argument.blob());
  }, `${method} with Content-Type set late`);
});

// META: global=jsshell
// META: script=/wasm/jsapi/wasm-constants.js
// META: script=/wasm/jsapi/wasm-module-builder.js
// META: timeout=long

const kJSEmbeddingMaxTypes = 1000000;
const kJSEmbeddingMaxFunctions = 1000000;
const kJSEmbeddingMaxImports = 100000;
const kJSEmbeddingMaxExports = 100000;
const kJSEmbeddingMaxGlobals = 1000000;
const kJSEmbeddingMaxDataSegments = 100000;

const kJSEmbeddingMaxMemoryPages = 65536;
const kJSEmbeddingMaxModuleSize = 1024 * 1024 * 1024;  // = 1 GiB
const kJSEmbeddingMaxFunctionSize = 7654321;
const kJSEmbeddingMaxFunctionLocals = 50000;
const kJSEmbeddingMaxFunctionParams = 1000;
const kJSEmbeddingMaxFunctionReturns = 1;
const kJSEmbeddingMaxTableSize = 10000000;
const kJSEmbeddingMaxElementSegments = 10000000;
const kJSEmbeddingMaxTables = 1;
const kJSEmbeddingMaxMemories = 1;

// This function runs the {gen} function with the values {min}, {limit}, and
// {limit+1}, assuming that values below and including the limit should
// pass. {name} is used for test names.
function testLimit(name, min, limit, gen) {
  function get_buffer(count) {
    const builder = new WasmModuleBuilder();
    gen(builder, count);
    return builder.toBuffer();
  }

  const buffer_with_min = get_buffer(min);
  const buffer_with_limit = get_buffer(limit);
  const buffer_with_limit_plus_1 = get_buffer(limit + 1);

  test(() => {
    assert_true(WebAssembly.validate(buffer_with_min));
  }, `Validate ${name} mininum`);
  test(() => {
    assert_true(WebAssembly.validate(buffer_with_limit));
  }, `Validate ${name} limit`);
  test(() => {
    assert_false(WebAssembly.validate(buffer_with_limit_plus_1));
  }, `Validate ${name} over limit`);

  test(() => {
    new WebAssembly.Module(buffer_with_min);
  }, `Compile ${name} mininum`);
  test(() => {
    new WebAssembly.Module(buffer_with_limit);
  }, `Compile ${name} limit`);
  test(() => {
    assert_throws(new WebAssembly.CompileError(), () => new WebAssembly.Module(buffer_with_limit_plus_1));
  }, `Compile ${name} over limit`);

  promise_test(t => {
    return WebAssembly.compile(buffer_with_min);
  }, `Async compile ${name} mininum`);
  promise_test(t => {
    return WebAssembly.compile(buffer_with_limit);
  }, `Async compile ${name} limit`);
  promise_test(t => {
    return promise_rejects(t, new WebAssembly.CompileError(), WebAssembly.compile(buffer_with_limit_plus_1));
  }, `Async compile ${name} over limit`);
}

testLimit("types", 1, kJSEmbeddingMaxTypes, (builder, count) => {
        for (let i = 0; i < count; i++) {
            builder.addType(kSig_i_i);
        }
    });

testLimit("functions", 1, kJSEmbeddingMaxFunctions, (builder, count) => {
        const type = builder.addType(kSig_v_v);
        const body = [];
        for (let i = 0; i < count; i++) {
            builder.addFunction(/*name=*/ undefined, type).addBody(body);
        }
    });

testLimit("imports", 1, kJSEmbeddingMaxImports, (builder, count) => {
        const type = builder.addType(kSig_v_v);
        for (let i = 0; i < count; i++) {
            builder.addImport("", "", type);
        }
    });

testLimit("exports", 1, kJSEmbeddingMaxExports, (builder, count) => {
        const type = builder.addType(kSig_v_v);
        const f = builder.addFunction(/*name=*/ undefined, type);
        f.addBody([]);
        for (let i = 0; i < count; i++) {
            builder.addExport("f" + i, f.index);
        }
    });

testLimit("globals", 1, kJSEmbeddingMaxGlobals, (builder, count) => {
        for (let i = 0; i < count; i++) {
            builder.addGlobal(kWasmI32, true);
        }
    });

testLimit("data segments", 1, kJSEmbeddingMaxDataSegments, (builder, count) => {
        const data = [];
        builder.addMemory(1, 1, false, false);
        for (let i = 0; i < count; i++) {
            builder.addDataSegment(0, data);
        }
    });

testLimit("initial declared memory pages", 1, kJSEmbeddingMaxMemoryPages,
          (builder, count) => {
            builder.addMemory(count, undefined, false, false);
          });

testLimit("maximum declared memory pages", 1, kJSEmbeddingMaxMemoryPages,
          (builder, count) => {
            builder.addMemory(1, count, false, false);
          });

testLimit("initial imported memory pages", 1, kJSEmbeddingMaxMemoryPages,
          (builder, count) => {
            builder.addImportedMemory("mod", "mem", count, undefined);
          });

testLimit("maximum imported memory pages", 1, kJSEmbeddingMaxMemoryPages,
          (builder, count) => {
            builder.addImportedMemory("mod", "mem", 1, count);
          });

testLimit("function size", 2, kJSEmbeddingMaxFunctionSize, (builder, count) => {
        const type = builder.addType(kSig_v_v);
        const nops = count - 2;
        const array = new Array(nops);
        for (let i = 0; i < nops; i++) array[i] = kExprNop;
        builder.addFunction(undefined, type).addBody(array);
    });

testLimit("function locals", 1, kJSEmbeddingMaxFunctionLocals, (builder, count) => {
        const type = builder.addType(kSig_v_v);
        builder.addFunction(undefined, type)
          .addLocals({i32_count: count})
          .addBody([]);
    });

testLimit("function params", 1, kJSEmbeddingMaxFunctionParams, (builder, count) => {
        const array = new Array(count);
        for (let i = 0; i < count; i++) {
            array[i] = kWasmI32;
        }
        const type = builder.addType({params: array, results: []});
    });

testLimit("function params+locals", 1, kJSEmbeddingMaxFunctionLocals - 2, (builder, count) => {
        const type = builder.addType(kSig_i_ii);
        builder.addFunction(undefined, type)
          .addLocals({i32_count: count})
          .addBody([kExprUnreachable]);
    });

testLimit("function returns", 0, kJSEmbeddingMaxFunctionReturns, (builder, count) => {
        const array = new Array(count);
        for (let i = 0; i < count; i++) {
            array[i] = kWasmI32;
        }
        const type = builder.addType({params: [], results: array});
    });

testLimit("initial table size", 1, kJSEmbeddingMaxTableSize, (builder, count) => {
        builder.setTableBounds(count, undefined);
    });

testLimit("maximum table size", 1, kJSEmbeddingMaxTableSize, (builder, count) => {
        builder.setTableBounds(1, count);
    });

testLimit("element segments", 1, kJSEmbeddingMaxElementSegments, (builder, count) => {
        builder.setTableBounds(1, 1);
        const array = [];
        for (let i = 0; i < count; i++) {
            builder.addElementSegment(0, false, array, false);
        }
    });

testLimit("tables", 0, kJSEmbeddingMaxTables, (builder, count) => {
        for (let i = 0; i < count; i++) {
            builder.addImportedTable("", "", 1, 1);
        }
    });

testLimit("memories", 0, kJSEmbeddingMaxMemories, (builder, count) => {
        for (let i = 0; i < count; i++) {
            builder.addImportedMemory("", "", 1, 1, false);
        }
    });

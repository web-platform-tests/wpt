// META: global=jsshell
// META: script=/wasm/jsapi/wasm-module-builder.js
// META: script=/wasm/jsapi/assertions.js

async function run_with_result(argument) {
  const type_if_fi = makeSig([kWasmF64, kWasmI32], [kWasmI32, kWasmF64]);

  const builder = new WasmModuleBuilder();

  const fnIndex = builder.addImport("module", "fn", type_if_fi);
  builder
    .addFunction("callfn", kSig_i_v)
    .addBody([
        ...wasmF64Const(4.2),
        ...wasmI32Const(7),
        kExprCallFunction, fnIndex,
        kExprDrop,
        kExprReturn,
    ])
    .exportFunc();

  const buffer = builder.toBuffer();

  const imports = {
    "module": {
      fn(f32, i32) {
        return argument;
      }
    }
  };
  const { instance } = await WebAssembly.instantiate(buffer, imports);
  return instance.exports.callfn();
};

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result(undefined));
}, "Return undefined");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result(null));
}, "Return null");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({}));
}, "@@iterator omitted");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({
    [Symbol.iterator]: undefined,
  }));
}, "@@iterator undefined");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({
    [Symbol.iterator]: null,
  }));
}, "@@iterator null");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({
    [Symbol.iterator]: 7,
  }));
}, "@@iterator number");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({
    [Symbol.iterator]: "iterator",
  }));
}, "@@iterator string");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({
    [Symbol.iterator]: {},
  }));
}, "@@iterator not callable");

promise_test(async t => {
  const exception = {};
  return promise_rejects_exactly(t, exception, run_with_result({
    get [Symbol.iterator]() {
      throw exception;
    }
  }));
}, "Throw from @@iterator getter");

promise_test(async t => {
  const exception = {};
  return promise_rejects_exactly(t, exception, run_with_result({
    [Symbol.iterator]() {
      throw exception;
    }
  }));
}, "Throw from @@iterator");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({
    [Symbol.iterator]() {
      return undefined;
    }
  }));
}, "Return undefined from @@iterator");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({
    [Symbol.iterator]() {
      return null;
    }
  }));
}, "Return null from @@iterator");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({
    [Symbol.iterator]() {
      return 7;
    }
  }));
}, "Return Number from @@iterator");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({
    [Symbol.iterator]() {
      return {
        next: undefined
      }
    }
  }));
}, "@@iterator.next undefined");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({
    [Symbol.iterator]() {
      return {
        next: null
      }
    }
  }));
}, "@@iterator.next null");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({
    [Symbol.iterator]() {
      return {
        next: {}
      }
    }
  }));
}, "@@iterator.next not callable");

promise_test(async t => {
  const exception = {};
  return promise_rejects_exactly(t, exception, run_with_result({
    [Symbol.iterator]() {
      return {
        get next() {
          throw exception;
        }
      };
    }
  }));
}, "Throw from @@iterator.next getter");

promise_test(async t => {
  const exception = {};
  return promise_rejects_exactly(t, exception, run_with_result({
    [Symbol.iterator]() {
      return {
        next() {
          throw exception;
        }
      };
    }
  }));
}, "Throw from @@iterator.next");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({
    [Symbol.iterator]() {
      return {
        next() {
          return undefined;
        }
      }
    }
  }));
}, "Return undefined from @@iterator.next");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({
    [Symbol.iterator]() {
      return {
        next() {
          return null;
        }
      }
    }
  }));
}, "Return null from @@iterator.next");

promise_test(async t => {
  return promise_rejects_js(t, TypeError, run_with_result({
    [Symbol.iterator]() {
      return {
        next() {
          return 7;
        }
      }
    }
  }));
}, "Return Number from @@iterator.next");

promise_test(async t => {
  const exception = {};
  return promise_rejects_exactly(t, exception, run_with_result({
    [Symbol.iterator]() {
      return {
        next() {
          return {
            get done() { throw exception },
            get value() { assert_unreached("Should not call value getter"); }
          }
        }
      }
    }
  }));
}, "Throw from @@iterator.next().done");

promise_test(async t => {
  const exception = {};
  return promise_rejects_exactly(t, exception, run_with_result({
    [Symbol.iterator]() {
      return {
        next() {
          return {
            done: false,
            get value() { throw exception },
          }
        }
      }
    }
  }));
}, "Throw from @@iterator.next().value");

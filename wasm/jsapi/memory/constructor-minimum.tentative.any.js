// META: global=window,dedicatedworker,jsshell
// META: script=/wasm/jsapi/assertions.js
// META: script=/wasm/jsapi/memory/assertions.js

test(() => {
  const order = [];

  assert_throws_js(TypeError, () => {
    new WebAssembly.Memory({
      get maximum() {
        order.push("maximum");
        return {
          valueOf() {
            order.push("maximum valueOf");
            return 1;
          },
        };
      },

      get initial() {
        order.push("initial");
        return undefined;
      },

      get minimum() {
        order.push("minimum");
        return undefined;
      },
    });
  });

  assert_array_equals(order, [
    "initial",
    "maximum",
    "maximum valueOf",
    "minimum",
  ]);
}, "Order of evaluation for descriptor (initial=undefined)");

test(() => {
  const order = [];

  assert_throws_js(TypeError, () => {
    new WebAssembly.Memory({
      get maximum() {
        order.push("maximum");
        return {
          valueOf() {
            order.push("maximum valueOf");
            return 1;
          },
        };
      },

      get minimum() {
        order.push("minimum");
        return {
          valueOf() {
            order.push("minimum valueOf");
            return 0x100000000;
          },
        };
      },
    });
  });

  assert_array_equals(order, [
    "maximum",
    "maximum valueOf",
    "minimum",
    "minimum valueOf",
  ]);
}, "Order of evaluation for descriptor (minimum out of range)");

test(() => {
  const order = [];

  assert_throws_js(RangeError, () => {
    new WebAssembly.Memory({
      get maximum() {
        order.push("maximum");
        return {
          valueOf() {
            order.push("maximum valueOf");
            return 1;
          },
        };
      },

      get minimum() {
        order.push("minimum");
        return {
          valueOf() {
            order.push("minimum valueOf");
            return 0x10001;
          },
        };
      },
    });
  });

  assert_array_equals(order, [
    "maximum",
    "maximum valueOf",
    "minimum",
    "minimum valueOf",
  ]);
}, "Order of evaluation for descriptor (minimum too large)");

test(() => {
  const order = [];

  new WebAssembly.Memory({
    get maximum() {
      order.push("maximum");
      return {
        valueOf() {
          order.push("maximum valueOf");
          return 1;
        },
      };
    },

    get initial() {
      order.push("initial");
      return {
        valueOf() {
          order.push("initial valueOf");
          return 1;
        },
      };
    },

    get minimum() {
      order.push("minimum");
      return undefined;
    },
  });

  assert_array_equals(order, [
    "initial",
    "initial valueOf",
    "maximum",
    "maximum valueOf",
    "minimum",
  ]);
}, "Order of evaluation for descriptor (minimum=undefined)");

test(() => {
  const order = [];

  new WebAssembly.Memory({
    get maximum() {
      order.push("maximum");
      return {
        valueOf() {
          order.push("maximum valueOf");
          return 1;
        },
      };
    },

    get initial() {
      order.push("initial");
      return undefined;
    },

    get minimum() {
      order.push("minimum");
      return {
        valueOf() {
          order.push("minimum valueOf");
          return 1;
        },
      };
    },
  });

  assert_array_equals(order, [
    "initial",
    "maximum",
    "maximum valueOf",
    "minimum",
    "minimum valueOf",
  ]);
}, "Order of evaluation for descriptor (initial=undefined)");

test(() => {
  const order = [];

  assert_throws_js(TypeError, () => {
    new WebAssembly.Memory({
      get maximum() {
        order.push("maximum");
        return {
          valueOf() {
            order.push("maximum valueOf");
            return 1;
          },
        };
      },

      get initial() {
        order.push("initial");
        return {
          valueOf() {
            order.push("initial valueOf");
            return 1;
          },
        };
      },

      get minimum() {
        order.push("minimum");
        return {
          valueOf() {
            order.push("minimum valueOf");
            return 1;
          },
        };
      },
    });
  });

  assert_array_equals(order, [
    "initial",
    "initial valueOf",
    "maximum",
    "maximum valueOf",
    "minimum",
    "minimum valueOf",
  ]);
}, "Order of evaluation for descriptor (both minimum and initial)");

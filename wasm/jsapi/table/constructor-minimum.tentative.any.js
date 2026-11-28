// META: global=window,dedicatedworker,jsshell
// META: script=/wasm/jsapi/assertions.js

test(() => {
  const order = [];

  assert_throws_js(TypeError, () => {
    new WebAssembly.Table({
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

      get element() {
        order.push("element");
        return {
          toString() {
            order.push("element toString");
            return "anyfunc";
          },
        };
      },
    });
  });

  assert_array_equals(order, [
    "element",
    "element toString",
    "initial",
    "maximum",
    "maximum valueOf",
    "minimum",
  ]);
}, "Order of evaluation for descriptor (minimum=initial=undefined)");

test(() => {
  const order = [];

  new WebAssembly.Table({
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

    get element() {
      order.push("element");
      return {
        toString() {
          order.push("element toString");
          return "anyfunc";
        },
      };
    },
  });

  assert_array_equals(order, [
    "element",
    "element toString",
    "initial",
    "initial valueOf",
    "maximum",
    "maximum valueOf",
    "minimum",
  ]);
}, "Order of evaluation for descriptor (minimum=undefined)");

test(() => {
  const order = [];

  new WebAssembly.Table({
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

    get element() {
      order.push("element");
      return {
        toString() {
          order.push("element toString");
          return "anyfunc";
        },
      };
    },
  });

  assert_array_equals(order, [
    "element",
    "element toString",
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
    new WebAssembly.Table({
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

      get element() {
        order.push("element");
        return {
          toString() {
            order.push("element toString");
            return "anyfunc";
          },
        };
      },
    });
  });

  assert_array_equals(order, [
    "element",
    "element toString",
    "initial",
    "initial valueOf",
    "maximum",
    "maximum valueOf",
    "minimum",
    "minimum valueOf",
  ]);
}, "Order of evaluation for descriptor (initial, minimum present)");

test(() => {
  const order = [];

  assert_throws_js(TypeError, () => {
    new WebAssembly.Table({
      get maximum() {
        order.push("maximum");
        return {
          valueOf() {
            order.push("maximum valueOf");
            return 0x100000000;
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

      get element() {
        order.push("element");
        return {
          toString() {
            order.push("element toString");
            return "anyfunc";
          },
        };
      },
    });
  });

  assert_array_equals(order, [
    "element",
    "element toString",
    "initial",
    "initial valueOf",
    "maximum",
    "maximum valueOf",
  ]);
}, "Order of evaluation for descriptor (maximum out of range)");

test(() => {
  const order = [];

  assert_throws_js(RangeError, () => {
    new WebAssembly.Table({
      get maximum() {
        order.push("maximum");
        return {
          valueOf() {
            order.push("maximum valueOf");
            return 10_000_001;
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

      get element() {
        order.push("element");
        return {
          toString() {
            order.push("element toString");
            return "anyfunc";
          },
        };
      },
    });
  });

  assert_array_equals(order, [
    "element",
    "element toString",
    "initial",
    "maximum",
    "maximum valueOf",
    "minimum",
    "minimum valueOf",
  ]);
}, "Order of evaluation for descriptor (maximum too large)");

test(() => {
  const order = [];

  assert_throws_js(TypeError, () => {
    new WebAssembly.Table({
      get maximum() {
        order.push("maximum");
        return {
          valueOf() {
            order.push("maximum valueOf");
            return 10_000_001;
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

      get element() {
        order.push("element");
        return {
          toString() {
            order.push("element toString");
            return "anyfunc";
          },
        };
      },
    });
  });

  assert_array_equals(order, [
    "element",
    "element toString",
    "initial",
    "initial valueOf",
    "maximum",
    "maximum valueOf",
    "minimum",
    "minimum valueOf",
  ]);
}, "Order of evaluation for descriptor (maximum too large; initial and minimum present)");

test(() => {
  const order = [];

  assert_throws_js(TypeError, () => {
    new WebAssembly.Table({
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
            return 0x100000000;
          },
        };
      },

      get element() {
        order.push("element");
        return {
          toString() {
            order.push("element toString");
            return "anyfunc";
          },
        };
      },
    });
  });

  assert_array_equals(order, [
    "element",
    "element toString",
    "initial",
    "maximum",
    "maximum valueOf",
    "minimum",
    "minimum valueOf",
  ]);
}, "Order of evaluation for descriptor (minimum out of range)");

test(() => {
  const order = [];

  assert_throws_js(TypeError, () => {
    new WebAssembly.Table({
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
            return 0x100000000;
          },
        };
      },

      get element() {
        order.push("element");
        return {
          toString() {
            order.push("element toString");
            return "anyfunc";
          },
        };
      },
    });
  });

  assert_array_equals(order, [
    "element",
    "element toString",
    "initial",
    "initial valueOf",
    "maximum",
    "maximum valueOf",
    "minimum",
    "minimum valueOf",
  ]);
}, "Order of evaluation for descriptor (minimum out of range; initial present)");

test(() => {
  const order = [];

  assert_throws_js(RangeError, () => {
    new WebAssembly.Table({
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
            return 10_000_001;
          },
        };
      },

      get element() {
        order.push("element");
        return {
          toString() {
            order.push("element toString");
            return "anyfunc";
          },
        };
      },
    });
  });

  assert_array_equals(order, [
    "element",
    "element toString",
    "initial",
    "maximum",
    "maximum valueOf",
    "minimum",
    "minimum valueOf"
  ]);
}, "Order of evaluation for descriptor (minimum too large)");

test(() => {
  const order = [];

  assert_throws_js(TypeError, () => {
    new WebAssembly.Table({
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
            return 10_000_001;
          },
        };
      },

      get element() {
        order.push("element");
        return {
          toString() {
            order.push("element toString");
            return "anyfunc";
          },
        };
      },
    });
  });

  assert_array_equals(order, [
    "element",
    "element toString",
    "initial",
    "initial valueOf",
    "maximum",
    "maximum valueOf",
    "minimum",
    "minimum valueOf"
  ]);
}, "Order of evaluation for descriptor (minimum too large; initial present)");

test(() => {
  const order = [];

  assert_throws_js(TypeError, () => {
    new WebAssembly.Table({
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

      get element() {
        order.push("element");
        return {
          toString() {
            order.push("element toString");
            return "invalid";
          },
        };
      },
    });
  });

  assert_array_equals(order, [
    "element",
    "element toString",
  ]);
}, "Order of evaluation for descriptor (element invalid)");

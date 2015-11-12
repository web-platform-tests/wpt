var obj = {};

obj.exists = (performance !== undefined) &&
             (typeof performance.now === "function");

if (obj.exists) {
  obj.now1 = performance.now();
  obj.now2 = performance.now();
}

postMessage(obj);

self.garbageCollect = () => {
  // https://testutils.spec.whatwg.org/#the-testutils-namespace
  if (self.TestUtils?.gc) {
    return TestUtils.gc();
  }

  // Use --expose_gc for V8 (and Node.js)
  // to pass this flag at chrome launch use: --js-flags="--expose-gc"
  // Exposed in SpiderMonkey shell as well
  if (self.gc) {
    return self.gc();
  }

  // Present in some WebKit development environments
  if (self.GCController) {
    return GCController.collect();
  }

  /* eslint-disable no-console */
  console.warn('Tests are running without the ability to do manual garbage collection. They will still work, but ' +
  'coverage will be suboptimal.');
  /* eslint-enable no-console */

  for (var i = 0; i < 1000; i++) {
    gcRec(10);
  }

  function gcRec(n) {
    if (n < 1) {
      return {};
    }

    let temp = { i: "ab" + i + i / 100000 };
    temp += "foo";

    gcRec(n - 1);
  }
};

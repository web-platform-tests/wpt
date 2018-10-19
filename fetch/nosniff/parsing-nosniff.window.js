promise_test(() => fetch("resources/x-content-type-options.json").then(res => res.json()).then(runTests), "Loading JSON…");

function runTests(allTestData) {
  for (let i = 0; i < allTestData.length; i++) {
    const testData = allTestData[i],
          input = encodeURIComponent(testData.input);
    async_test(t => {
      const script = document.createElement("script");
      t.add_cleanup(() => script.remove());
      if (testData.nosniff) {
        script.onerror = t.step_func_done();
        script.onload = t.unreached_func("Script should not have loaded");
      } else {
        script.onerror = t.unreached_func("Script should have loaded");
        script.onload = t.step_func_done();
      }
      script.src = "resources/nosniff.py?nosniff=" + input;
      document.body.appendChild(script);
    }, input);
  }
}

promise_test(() => fetch("resources/percent-encoding.json").then(res => res.json()).then(runTests), "Loading data…");

function runTests(testUnits) {
  for (const testUnit of testUnits) {
    // Ignore comments
    if (typeof testUnit === "string") {
      continue;
    }
    for (const encoding of Object.keys(testUnit.output)) {
      // Test UTF-8 in a special way
      if (encoding === "utf-8") {
        continue;
      }
      async_test(t => {
        const frame = document.body.appendChild(document.createElement("iframe"));
        t.add_cleanup(() => frame.remove());
        frame.onload = t.step_func_done(() => {
          const output = frame.contentDocument.querySelector("a");
          assert_equals(output.hash, `#${testUnit.output["utf-8"]}`, "fragment");
          assert_equals(output.search, `?${testUnit.output[encoding]}`, "query");
        });
        frame.src = `resources/percent-encoding.py?encoding=${encoding}&value=${testUnit.input}`;
      }, `Input ${testUnit.input} with encoding ${encoding}`);
    }
  }
}

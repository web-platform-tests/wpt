promise_test(() => {
  return fetch("resources/mime-types.json").then(res => res.json().then(runTests));
}, "Loading data…");

function runTests(tests) {
  tests.forEach(val => {
    if(typeof val === "string") {
      return;
    }
    const output = val.output === null ? "" : val.output
    test(() => {
      assert_equals(new Blob([], { type: val.input}).type, output, "Blob");
      assert_equals(new File([], "noname", { type: val.input}).type, output, "File");
    }, val.input + " (Blob/File)");

    promise_test(() => {
      return Promise.all([
        new Request("about:blank", { headers: [["Content-Type", val.input]] }).blob().then(blob => assert_equals(blob.type, output)),
        new Response(null, { headers: [["Content-Type", val.input]] }).blob().then(blob => assert_equals(blob.type, output))
      ]);
    }, val.input + " (Request/Response)");
  });
}

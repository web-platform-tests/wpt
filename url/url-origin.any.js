promise_test(() => fetch("resources/urltestdata.json").then(res => res.json()).then(runURLTests), "Loading data…");

function bURL(url, base) {
  return base !== null ? new URL(url, base) : new URL(url);
}

function runURLTests(urlTests) {
  for (const expected of urlTests) {
    // Skip comments and tests without "origin" expectation
    if (typeof expected === "string" || !("origin" in expected))
      continue;

    test(() => {
      const url = bURL(expected.input, expected.base);
      assert_equals(url.origin, expected.origin, "origin");
    }, "Origin parsing: <" + expected.input + "> against <" + expected.base + ">");
  }
}

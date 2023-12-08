// META: global=window,dedicatedworker,shadowrealm
promise_test(() => fetch_json("resources/toascii.json").then(runTests), "Loading data…");

function makeURL(input) {
  input = "https://" + input + "/x"
  return new URL(input)
}

function runTests(tests) {
  for(var i = 0, l = tests.length; i < l; i++) {
    let hostTest = tests[i]
    if (typeof hostTest === "string") {
      continue // skip comments
    }
    test(() => {
      if(hostTest.output !== null) {
        const url = makeURL(hostTest.input)
        assert_equals(url.host, hostTest.output)
        assert_equals(url.hostname, hostTest.output)
        assert_equals(url.pathname, "/x")
        assert_equals(url.href, "https://" + hostTest.output + "/x")
      } else {
        assert_throws_js(TypeError, () => makeURL(hostTest.input))
      }
    }, hostTest.input + " (using URL)")
    ;["host", "hostname"].forEach((val) => {
      test(() => {
        const url = makeURL("x")
        url[val] = hostTest.input
        if(hostTest.output !== null) {
          assert_equals(url[val], hostTest.output)
        } else {
          assert_equals(url[val], "x")
        }
      }, hostTest.input + " (using URL." + val + ")")
    })
  }
}

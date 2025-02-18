promise_test(() => fetch_json("resources/toascii.json").then(runTests), "Loading data…");

function makeURL(type, input) {
  input = "https://" + input + "/x"
  const url = document.createElement(type)
  url.href = input
  return url
}

function runTests(tests) {
  for(var i = 0, l = tests.length; i < l; i++) {
    let hostTest = tests[i]
    if (typeof hostTest === "string") {
      continue // skip comments
    }
    const typeName = { "a": "<a>", "area": "<area>" }
    ;["a", "area"].forEach((type) => {
      test(() => {
        if(hostTest.output !== null) {
          // Tested in toascii.any.js
          return
        }
        const url = makeURL(type, hostTest.input)
        assert_equals(url.host, "")
        assert_equals(url.hostname, "")
        assert_equals(url.pathname, "")
        assert_equals(url.href, "https://" + hostTest.input + "/x")
      }, hostTest.input + " (using " + typeName[type] + ")")
      ;["host", "hostname"].forEach((val) => {
        test(() => {
          const url = makeURL(type, "x")
          url[val] = hostTest.input
          if(hostTest.output !== null) {
            assert_equals(url[val], hostTest.output)
          } else {
            assert_equals(url[val], "x")
          }
        }, hostTest.input + " (using " + typeName[type] + "." + val + ")")
      })
    })
  }
}

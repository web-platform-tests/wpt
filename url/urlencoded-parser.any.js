// META: global=window,dedicatedworker,shadowrealm
promise_test(() => fetch_json("resources/urlencoded-parser-data.json").then(runTests), "Loading data…");

// See urlencoded-parser-request-response.any.js for more tests with
// urlencoded-parser-data.js that don't apply to ShadowRealm

function runTests(testData) {
  testData.forEach((val) => {
    test(() => {
      let sp = new URLSearchParams(val.input),
          i = 0
      for (let item of sp) {
        assert_array_equals(item, val.output[i])
        i++
      }
    }, "URLSearchParams constructed with: " + val.input)
  });
}

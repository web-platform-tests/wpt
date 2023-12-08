// META: global=window,dedicatedworker
promise_test(() => fetch_json("resources/urlencoded-parser-data.json").then(runTests), "Loading data…");

// Request and Response are not present in ShadowRealm

function runTests(testData) {
  testData.forEach((val) => {
    promise_test(() => {
      let init = new Request("about:blank", { body: val.input, method: "LADIDA", headers: {"Content-Type": "application/x-www-form-urlencoded;charset=windows-1252"} }).formData()
      return init.then((fd) => {
        let i = 0
        for (let item of fd) {
          assert_array_equals(item, val.output[i])
          i++
        }
      })
    }, "request.formData() with input: " + val.input)

    promise_test(() => {
      let init = new Response(val.input, { headers: {"Content-Type": "application/x-www-form-urlencoded;charset=shift_jis"} }).formData()
      return init.then((fd) => {
        let i = 0
        for (let item of fd) {
          assert_array_equals(item, val.output[i])
          i++
        }
      })
    }, "response.formData() with input: " + val.input)
  });
}

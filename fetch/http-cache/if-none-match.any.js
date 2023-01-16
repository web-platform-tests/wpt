// META: global=window,worker
// META: title=HTTP Cache - If-None-Match

promise_test(async t => {
  const resp = await fetch("/common/echo_headers.py", {
    headers: {
      "If-None-Match": "abc"
    }
  });
  const headers = await resp.json();
  console.log(headers);
  assert_equals(headers["cache-control"], "no-cache");
  assert_equals(headers["pragma"], "no-cache");
}, "Setting If-None-Match results in Cache-Control: no-cache and Pragma: no-cache");

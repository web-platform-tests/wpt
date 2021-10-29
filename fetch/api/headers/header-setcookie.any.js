// META: title=Headers set-cookie special cases
// META: global=window,worker

const headerList = [
  ["set-cookie", "foo=bar"],
  ["set-cookie", "fizz=buzz; domain=example.com"],
];

test(function () {
  new Headers({ "Set-Cookie": "foo=bar" });
}, "Create headers with a single set-cookie header in object");

test(function () {
  new Headers([headerList[0]]);
}, "Create headers with a single set-cookie header in list");

test(function () {
  new Headers(headerList);
}, "Create headers with multiple set-cookie header in list");

test(function () {
  const headers = new Headers(headerList);
  assert_equals(headers.get("set-cookie"), "foo=bar, fizz=buzz; domain=example.com");
}, "Headers.prototype.get combines set-cookie headers in order");

test(function () {
  const headers = new Headers(headerList);
  const list = [];
  for (const [name, value] of headers) {
    list.push([name, value]);
  }
  assert_array_equals(list, headerList);
}, "Headers iterator does not combine set-cookie headers");

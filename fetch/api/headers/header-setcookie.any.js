// META: title=Headers set-cookie special cases
// META: global=window,worker

const headerList = [
  ["set-cookie", "foo=bar"],
  ["Set-Cookie", "fizz=buzz; domain=example.com"],
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

test(function () {
  const headers = new Headers();
  assert_equals(headers.getSetCookie(), []);
}, "Headers.prototype.getSetCookie with no headers present")

test(function () {
  const headers = new Headers([headerList[0]]);
  assert_equals(headers.getSetCookie(), ["foo=bar"]);
}, "Headers.prototype.getSetCookie with one header")

test(function () {
  const headers = new Headers(headerList);
  assert_equals(headers.getSetCookie(), ["foo=bar", "fizz=buzz; domain=example.com"]);
}, "Headers.prototype.getSetCookie with multiple headers")

test(function () {
  const headers = new Headers(["set-cookie", ""]);
  assert_equals(headers.getSetCookie(), [""]);
}, "Headers.prototype.getSetCookie with an empty header")

test(function () {
  const headers = new Headers(["set-cookie", "x"], ["set-cookie", "x"]);
  assert_equals(headers.getSetCookie(), ["x", "x"]);
}, "Headers.prototype.getSetCookie with two equal headers")

// META: title=Headers set-cookie special cases
// META: global=window,worker

const headerList = [
  ["set-cookie", "foo=bar"],
  ["Set-Cookie", "fizz=buzz; domain=example.com"],
];

const setCookie2HeaderList = [
  ["set-cookie2", "foo2=bar2"],
  ["Set-Cookie2", "fizz2=buzz2; domain=example2.com"],
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
  assert_equals(
    headers.get("set-cookie"),
    "foo=bar, fizz=buzz; domain=example.com",
  );
}, "Headers.prototype.get combines set-cookie headers in order");

test(function () {
  const headers = new Headers(headerList);
  const list = [...headers];
  assert_array_equals(list, [
    ["set-cookie", "foo=bar"],
    ["set-cookie", "fizz=buzz; domain=example.com"],
  ]);
}, "Headers iterator does not combine set-cookie headers");

test(function () {
  const headers = new Headers(setCookie2HeaderList);
  const list = [...headers];
  assert_array_equals(list, [
    ["set-cookie2", "foo2=bar2, fizz2=buzz2; domain=example2.com"],
  ]);
}, "Headers iterator does not special case set-cookie2 headers");

test(function () {
  const headers = new Headers([...headerList, ...setCookie2HeaderList]);
  const list = [...headers];
  assert_array_equals(list, [
    ["set-cookie", "foo=bar"],
    ["set-cookie", "fizz=buzz; domain=example.com"],
    ["set-cookie2", "foo2=bar2, fizz2=buzz2; domain=example2.com"],
  ]);
}, "Headers iterator does not combine set-cookie & set-cookie2 headers");

test(function () {
  // This is non alphabetic order, and the iterator should yield in this non
  // alphabetic order.
  const headers = new Headers([
    ["set-cookie", "z=z"],
    ["set-cookie", "a=a"],
    ["set-cookie", "n=n"],
  ]);
  const list = [...headers];
  assert_array_equals(list, [
    ["set-cookie", "z=z"],
    ["set-cookie", "a=a"],
    ["set-cookie", "n=n"],
  ]);
}, "Headers iterator preserves set-cookie ordering");

test(function () {
  const headers = new Headers(headerList);
  headers.set("set-cookie", "foo2=bar2");
  const list = [...headers];
  assert_array_equals(list, [
    ["set-cookie", "foo2=bar2"],
  ]);
}, "Headers.prototype.set works for set-cookie");

test(function () {
  const headers = new Headers();
  assert_equals(headers.getSetCookie(), []);
}, "Headers.prototype.getSetCookie with no headers present");

test(function () {
  const headers = new Headers([headerList[0]]);
  assert_equals(headers.getSetCookie(), ["foo=bar"]);
}, "Headers.prototype.getSetCookie with one header");

test(function () {
  const headers = new Headers(headerList);
  assert_equals(headers.getSetCookie(), [
    "foo=bar",
    "fizz=buzz; domain=example.com",
  ]);
}, "Headers.prototype.getSetCookie with multiple headers");

test(function () {
  const headers = new Headers(["set-cookie", ""]);
  assert_equals(headers.getSetCookie(), [""]);
}, "Headers.prototype.getSetCookie with an empty header");

test(function () {
  const headers = new Headers(["set-cookie", "x"], ["set-cookie", "x"]);
  assert_equals(headers.getSetCookie(), ["x", "x"]);
}, "Headers.prototype.getSetCookie with two equal headers");

test(function () {
  const headers = new Headers(["set-cookie2", "x"], ["set-cookie", "y"], ["set-cookie2", "z"]);
  assert_equals(headers.getSetCookie(), ["y"]);
}, "Headers.prototype.getSetCookie ignores set-cookie2 headers");

test(function () {
  // This is non alphabetic order, and getSetCookie should return the values in
  // non alphabetic order.
  const headers = new Headers([
    ["set-cookie", "z=z"],
    ["set-cookie", "a=a"],
    ["set-cookie", "n=n"],
  ]);
  assert_equals(headers.getSetCookie(), ["z=z", "a=a", "n=n"]);
}, "Headers.prototype.getSetCookie preserves header ordering");


// META: global=worker
//
// Tests for https://github.com/whatwg/html/issues/8869
// Targeting Workers only because ServiceWorkers don't
// have access to URL.createObjectURL

importScripts("/resources/testharness.js");

let test_cases = [
  // Supported mimetypes:
  ["text/javascript", true],
  ["application/javascript", true],
  ["text/ecmascript", true],

  // Blocked mimetpyes:
  ["image/png", false],
  ["text/csv", false],
  ["video/mpeg", false],

  // Legacy mimetypes:
  ["text/html", false],
  ["text/plain", false],
  ["application/xml", false],
  ["application/octet-stream", false],

  // Potato mimetypes:
  ["text/potato", false],
  ["potato/text", false],
  ["aaa/aaa", false],
  ["zzz/zzz", false],

  // Parameterized mime types:
  ["text/javascript; charset=utf-8", true],
  ["text/javascript;charset=utf-8", true],
  ["text/javascript;bla;bla", true],
  ["text/csv; charset=utf-8", false],
  ["text/csv;charset=utf-8", false],
  ["text/csv;bla;bla", false],

  // Funky capitalization:
  ["Text/html", false],
  ["text/Html", false],
  ["TeXt/HtMl", false],
  ["TEXT/HTML", false],
];

for (var test_case of test_cases) {
  test(t => {
    let import_url = `data:${ test_case[0] },`;
    if (test_case[1]) {
      assert_equals(undefined, importScripts(import_url));
    } else {
      assert_throws_dom("NetworkError", _ => { importScripts(import_url) })
    }
  }, "importScripts() requires scripty MIME types for data: URLs: " + test_case[0] + " is " + (test_case[1] ? "allowed" : "blocked") + ".");
}

for (var test_case of test_cases) {
  test(t => {
    let import_url = URL.createObjectURL(new Blob([""], { type: test_case[0] }));
    if (test_case[1]) {
      assert_equals(undefined, importScripts(import_url));
    } else {
      assert_throws_dom("NetworkError", _ => { importScripts(import_url) })
    }
  }, "importScripts() requires scripty MIME types for blob: URLs: " + test_case[0] + " is " + (test_case[1] ? "allowed" : "blocked") + ".");
}
done();

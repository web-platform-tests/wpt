// META: title=Url sources of different forms of URL strings
// META: variant=?source=hash
// META: script=support/util.js

url_string_test({
  name: "url sources should allow script with a relative URL string by its URL string",
  url_string: "externalScript.js",
  allowed: "externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should allow script with a relative URL string with a directory by its URL string",
  url_string: "child_dir/externalScript.js",
  allowed: "child_dir/externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should not allow script with a relative URL string by the URL string with a single-dot segment",
  url_string: "externalScript.js",
  allowed: "./externalScript.js",
  expected: 'CSP_VIOLATION',
});

url_string_test({
  name: "url sources should allow script with a relative URL string in a document in another directory by its URL string",
  frame: "child_dir/iframe",
  url_string: "externalScript.js",
  allowed: "externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should allow script with a double-dot segment in its URL string in a document in another directory by its URL string",
  frame: "child_dir/iframe",
  url_string: "../externalScript.js",
  allowed: "../externalScript.js",
  expected: 'SCRIPT_RAN',
});

// META: title=Url sources of the URL strings of worker scripts
// META: variant=?source=hash
// META: timeout=long
// META: script=/common/get-host-info.sub.js
// META: script=support/util.js

// Which URL strings a url source matches is tested for <script> elements in
// forms.https.window.js. These tests only check that the URL string is matched
// for each way of requesting a worker script: url sources apply at all, the
// URL string is matched as written, and not the URL relative to the document
// that it resolves to.

const { ORIGIN } = get_host_info();
// The path of the support directory, ending with "/".
const DIR = new URL("support/", location.href).pathname;

for (const worker_type of ["dedicated", "shared", "service"]) {
  url_string_worker_test({
    name: `url sources should allow ${worker_type} worker with an absolute URL string by its URL string`,
    worker_type,
    url_string: `${ORIGIN}${DIR}workerScript.js`,
    allowed: `${ORIGIN}${DIR}workerScript.js`,
    expected: 'SCRIPT_RAN',
  });

  url_string_worker_test({
    name: `url sources should allow ${worker_type} worker with a single-dot segment in its URL string by its URL string`,
    worker_type,
    url_string: "./workerScript.js",
    allowed: "./workerScript.js",
    expected: 'SCRIPT_RAN',
  });

  url_string_worker_test({
    name: `url sources should not allow ${worker_type} worker with a single-dot segment in its URL string by the URL string without it`,
    worker_type,
    url_string: "./workerScript.js",
    allowed: "workerScript.js",
    expected: 'CSP_VIOLATION',
  });

  // Workers are checked against worker-src, which falls back to script-src
  // above.
  url_string_worker_test({
    name: `worker-src should allow ${worker_type} worker with an absolute URL string by its URL string`,
    worker_type,
    directive: "worker-src",
    url_string: `${ORIGIN}${DIR}workerScript.js`,
    allowed: `${ORIGIN}${DIR}workerScript.js`,
    expected: 'SCRIPT_RAN',
  });
}
// META: title=Url sources of the URL strings of module scripts
// META: variant=?source=hash
// META: timeout=long
// META: script=/common/get-host-info.sub.js
// META: script=support/util.js

// Which URL strings a url source matches is tested for <script> elements in
// forms.https.window.js. Like workers.https.window.js for workers, these tests
// only check that the URL string is matched for each way of requesting a
// module script in a document: url sources apply at all, the URL string is
// matched as written, and not the URL relative to the document that it
// resolves to. Module scripts in workers are tested in workers.https.window.js.
//
// Unlike other URL strings, module specifiers which aren't absolute URLs must
// start with "/", "./" or "../", and are resolved against the URL of the
// importing module.

const { ORIGIN } = get_host_info();
// The path of the support directory, ending with "/".
const DIR = new URL("support/", location.href).pathname;

const document_contexts = [
  {what: "module script", script_type: "module"},
  {what: "script imported by a module script", imported_with: "import"},
  {
    what: "script imported with import() by a module script",
    imported_with: "import()",
  },
];

for (const {what, ...context} of document_contexts) {
  url_string_test({
    name: `url sources should allow ${what} with an absolute URL string by its URL string`,
    ...context,
    url_string: `${ORIGIN}${DIR}externalScript.js`,
    allowed: `${ORIGIN}${DIR}externalScript.js`,
    expected: 'SCRIPT_RAN',
  });

  url_string_test({
    name: `url sources should allow ${what} with a single-dot segment in its URL string by its URL string`,
    ...context,
    url_string: "./externalScript.js",
    allowed: "./externalScript.js",
    expected: 'SCRIPT_RAN',
  });

  url_string_test({
    name: `url sources should not allow ${what} with a single-dot segment in its URL string by the URL string without it`,
    ...context,
    url_string: "./externalScript.js",
    allowed: "externalScript.js",
    expected: 'CSP_VIOLATION',
  });
}

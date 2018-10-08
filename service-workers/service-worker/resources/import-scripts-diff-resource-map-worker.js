importScripts('/resources/testharness.js');

let version = null,
    echo_output = null;
importScripts('import-scripts-version.py');
// Once imported, the stored script should be loaded for subsequent importScripts.
const expected_version = version;

version = null;
importScripts('import-scripts-version.py', 'import-scripts-echo.py?msg=test');
assert_equals(expected_version, version, 'import version');
assert_equals(echo_output, 'test', 'import echo');

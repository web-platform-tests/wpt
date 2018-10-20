importScripts('/resources/testharness.js');

let echo1 = null;
    echo2 = null;

importScripts('import-scripts-echo.py?output=echo1&msg=test1', 'import-scripts-echo.py?output=echo2&msg=test2');
assert_equals(echo1, 'test1');
assert_equals(echo2, 'test2');

// META: title=Test testdriver BiDi is not available if not included
// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js

'use strict';

promise_test(async () => {
    assert_equals(test_driver.bidi, undefined);
}, "Assert testdriver BiDi API is not available");

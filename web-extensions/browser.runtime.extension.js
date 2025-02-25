// META: script=/resources/testdriver.js?feature=bidi
// META: script=/resources/testdriver-vendor.js

setup({ explicit_done: true });
const test = async_test("testA");
test_driver.bidi.webExtension.install().finally(() => {
    test.done();
    done();
});
'use strict';

function webextension_test(extension_path) {
  setup({ explicit_done: true });

  test_driver.bidi.webExtension.install({
    extensionData: {
      type: 'path',
      path: extension_path,
    }
  })
  .then((result) => {
    let test;
    browser.test.onMessage.addListener((message, data) => {
      switch(message) {
        case "assert":
          test.step(() => {
            assert_true(data.result, data.message)
          })
          break
        case "assert-equality":
          test.step(() => {
            assert_true(data.result, `Expected: ${data.expectedValue}; Actual: ${data.actualValue}; Description: ${data.message}`)
          })
          break
        case "test-started":
          test = async_test(data.testName)
          break
        case "test-finished":
          test.done()
          if (!data.remainingTests)
              test_driver.bidi.webExtension.uninstall(result)
                  .then(() => {
                      done()
                  })
          break
      }
    })
  });
}

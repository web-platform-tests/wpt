// testharness file with WebExtensions utilities

/**
 * Loads the WebExtension at the path specified and runs the tests defined in the extension's resources.
 * Listens to messages sent from the user agent and converts the `browser.test` assertions
 * into testharness.js assertions.
 *
 * @param {string} extensionPath - a path to the extension's resources.
 */

setup({ explicit_done: true })

  globalThis.runTestsWithWebExtension = function(extensionPath) {
    test_driver.install_web_extension({
        type: "path",
        path: extensionPath
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

            if (data.result === false)
              test.set_status(test.FAIL)

            if (!data.remainingTests)
                test_driver.uninstall_web_extension(result.extension)
                    .then(() => {
                        done()
                    })

            break
        }
      })
    })
  }
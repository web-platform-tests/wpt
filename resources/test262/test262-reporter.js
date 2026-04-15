/**
 * @fileoverview Test262-specific reporter for WPT.
 * This script runs inside the test iframe. It captures errors and completion
 * signals and communicates them to the parent window.
 *
 * This implementation strictly follows the TC39 Test262 INTERPRETING.md:
 * https://github.com/tc39/test262/blob/main/INTERPRETING.md
 */
(function() {
    /**
     * Minimalistic Test262 error constructor.
     * Often overwritten by the real one from third_party/test262/harness/assert.js.
     */
    function Test262Error(message) {
        this.message = message || "";
    }
    Test262Error.prototype.name = "Test262Error";
    self.Test262Error = Test262Error;

    const parentWindow = window.parent;

    let expectedType;
    let expectedPhase;
    let isAsync = false;
    let test_finished = false;
    let status = 0;
    let message = "OK";

    window.test262Setup = function() {
    };

    window.test262IsAsync = function(isAsyncTest) {
        isAsync = isAsyncTest;
        window.test262Async = isAsyncTest; // For synchronization with server-injected scripts
    };

    window.test262NegativeType = function(type) {
        expectedType = type;
        // Default message for negative tests
        message = "Expected " + type;
        // Negative tests fail if they complete without throwing
        status = 1;
    };

    window.test262NegativePhase = function(phase) {
        expectedPhase = phase;
    };

    /**
     * TC39 INTERPRETING.md: Async tests use the print function.
     * print('Test262:AsyncTestComplete') -> PASS
     * print('Test262:AsyncTestFailure: ' + reason) -> FAIL
     *
     * This override is mandatory for the Test262 specification to capture
     * output and prevent the browser's native print dialog.
     */
    // Overriding window.print is mandatory for the Test262 specification to capture
    // async results and prevent the browser's native print dialog.
    window.print = function(output) {
        if (output === 'Test262:AsyncTestComplete') {
            status = 0;
            message = "OK";
            done();
        } else if (typeof output === 'string' && output.indexOf('Test262:AsyncTestFailure:') === 0) {
            status = 1;
            message = output;
            done();
        }
    };

    function done() {
        if (test_finished) {
            return;
        }

        // If we expected an error but didn't get one (and haven't reported success yet)
        if (status === 1 && expectedType && message === "Expected " + expectedType) {
            message = "Expected " + expectedType + " but test completed without error.";
        }

        test_finished = true;
        parentWindow.test262HarnessDone(status, message);
    }
    window.test262Done = done;

    window.addEventListener("load", function() {
        if (!isAsync && !window.__test262IsModule) {
            done();
        }
    });

    function on_error(event) {
        // Capture errors thrown synchronously inside $262.evalScript so they
        // can be rethrown in the correct execution context (see test262-provider.js).
        if (window.__test262_evalScript_active_ && event.error) {
            window.__test262_evalScript_error_ = event.error;
            return;
        }

        if (test_finished) {
            return;
        }

        /**
         * INTERPRETING.md Handling Errors and Negative Test Cases:
         * A test is passing if it throws an uncaught exception of the expected type.
         */
        let errorMatches = false;
        if (expectedType && event.error) {
            // Test262 INTERPRETING.md: A test fails if "the name of the thrown
            // exception's constructor does not match the specified constructor name".
            const constructorName = event.error.constructor && event.error.constructor.name;
            if (constructorName === expectedType) {
                errorMatches = true;
            }
        } else if (expectedType && event.message && event.message.indexOf(expectedType) === 0) {
            errorMatches = true;
        }

        if (errorMatches) {
            status = 0; // OK
            message = "OK";
        } else if (event.error && (event.error instanceof self.Test262Error)) {
            status = 1; // FAIL
            message = event.error.message || "Test262Error";
        } else {
            // Other error (or type mismatch for negative test)
            status = 2; // ERROR
            message = event.message || (event.error ? event.error.toString() : "Unknown Error");
            if (expectedType) {
                message = "Expected " + expectedType + " but got " + message;
            }
        }
        done();
    }

    window.addEventListener("error", on_error);
    window.addEventListener("unhandledrejection", function(event) {
        on_error({
            message: "Unhandled promise rejection: " + event.reason,
            error: event.reason
        });
    });

    // Special runner alias
    window.$DONTEVALUATE = function() {};
})();

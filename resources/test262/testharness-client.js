/*
 * Minimalistic testharness-client tailored to run Test262
 *
 * Expects parent document to listen for messages using
 * test262/testharness.js.
 *
 */


(function() {
    // We stash these in case the test overrides them
    var Object_prototype_toString = Object.prototype.toString;
    var Error_prototype_toString = Error.prototype.toString;
    var String_prototype_indexOf = String.prototype.indexOf;
    var parentWindow = window.parent;

    var expectedError;
    var test_finished = false;
    var status = 0;
    var message = "OK";

    window.test262Setup = function() {
    }

    function done() {
        if (test_finished) { return; }
        test_finished = true;
        parentWindow.postMessage(message, '*');
        parentWindow.postMessage(status, '*');
    }
    window.test262Done = done;

    function on_error(event) {
        // This hack ensures that errors thrown inside of a $262.evalScript get
        // rethrown in the correct place.
        if (String_prototype_indexOf.call(event.error.message, "Failed to execute 'appendChild' on 'Node'") === 0) {
            window.__test262_evalScript_error_ = event.error;
            return;
        }
        if (expectedError &&
            (String_prototype_indexOf.call(event.error.toString(), expectedError) === 0 ||
             String_prototype_indexOf.call(Error_prototype_toString.call(event.error), expectedError) === 0 ||
             String_prototype_indexOf.call(event.message, expectedError) === 0)) {
          status = 0;
          message = "OK";
        } else {
          status = 1;
          message = event.message;
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

    window.test262Negative = function(err) {
      expectedError = err;
      status = 1;
      message = "Expected "+err;
      window.$DONTEVALUATE = function() {};
    };
})();

/*
 * Minimalistic testharness tailored to run Test262
 * Can be used with or without testharnessreport.js.
 *
 * Expects actual test to be run in iframe and using
 * test262/testharness-client.js.
 *
 */
(function() {
    var test_finished = false;
    var callback;

    var harness_status = {
        status: 0,
        message: "OK"
    };

    function log(msg) {
        document.getElementById('log').innerHTML += ""+msg+"<br>";
    }

    function report_result() {
        log('done');
        log(JSON.stringify(harness_status));

        if (callback || window.opener) {
            var tests = [{
                name: document.title,
                status: harness_status.status
            }];
            var stat = {
                status: harness_status.status,
                message: harness_status.message,
                stack: harness_status.stack
            };
            var message = {
                type: "complete",
                tests: tests,
                status: stat
            };
            if (callback) {
                log("callback");
                callback(tests, stat);
            } else if (window.opener) {
                log("postMessage");
                window.opener.postMessage(message, "*");
            }
            return;
        }

        // Fall-back support for running without testharnessreport.js included.
        var retry = 0;
        var result_payload = ["url", "complete", [
            0, document.title, "", []
        ]];
        function raw_report() {
            result_payload[0] = window.__wptrunner_url;
            result_payload[2][0] = harness_status.status;
            result_payload[2][2] = harness_status.message;
            window.__wptrunner_testdriver_callback(result_payload);
            window.__wptrunner_process_next_event();
        }
        function call_raw_report() {
          if (window.__wptrunner_testdriver_callback) {
            return raw_report();
          }
          retry += 1;
          if (retry < 10) {
            setTimeout(call_raw_report, 10);
          } else {
            log("could not communicate result");
          }
        }
        setTimeout(call_raw_report, 0);
        log("raw fallback");
    }

   function done() {
        if (test_finished) { return; }
        test_finished = true;
        report_result();
    }

    window.add_completion_callback = function(cb) {
        callback = cb;
    };
    window.setup = function() {
    };

    window.addEventListener('message', (event) => {
        const iframe = document.getElementById('test262-iframe');
        // Communication protocol is to first receive a string message and then a
        // result number. On purpose no objects since test262 mucks with the
        // environment a lot (e.g., polluting Object.prototype and such).
        if (iframe.contentWindow === event.source) {
            if (typeof event.data === 'string') {
                harness_status.message = event.data;
            }
            if (typeof event.data === 'number') {
                harness_status.status = event.data;
                done();
            }
        }
    });
})();

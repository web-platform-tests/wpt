var SAME_ORIGIN = true;
var CROSS_ORIGIN = false;

var EXPECT_BLOCK = true;
var EXPECT_LOAD = false;

var SAMEORIGIN_ORIGIN = "{{location[scheme]}}://{{location[host]}}";
var CROSSORIGIN_ORIGIN = "http://{{domains[www1]}}:{{ports[http][1]}}";

function csp_parsing_test(policy, hexbyte, expectBlock, message) {
    var test = async_test(message);
    injectIFrame(policy, hexbyte, SAME_ORIGIN, expectBlock, message);

    function endTest(failed, message) {
        if (typeof test === 'undefined') return;

        if (failed) {
            test.step(function() {
                assert_unreached(message);
                test.done();
            });
        }
        else test.done({message: message});
    }

    window.addEventListener("message", function (e) {
        if (window.parent != window)
            window.parent.postMessage(e.data, "*");
        else
            if (e.data.type === 'test_result')
                endTest(e.data.failed, "Inner IFrame msg: " + e.data.message);
    });

    var timer;
    function pollForLoadCompletion({iframe, expectBlock}) {
        let fn = iframeLoaded({expectBlock, isPoll: true});
        timer = test.step_timeout(() => fn({target: iframe}), 10);
    }

    function injectIFrame(policy, hexbyte, sameOrigin, expectBlock) {
        var iframe = document.createElement("iframe");
        iframe.addEventListener("load", iframeLoaded({expectBlock, isPoll: false}));
        iframe.addEventListener("error", iframeLoaded({expectBlock, isPoll: false}));

        var url = "/content-security-policy/parsing/support/csp.py?policy=" + policy + "&hexbyte=" + hexbyte;
        if (sameOrigin)
            url = SAMEORIGIN_ORIGIN + url;
        else
            url = CROSSORIGIN_ORIGIN + url;

        iframe.src = url;
        document.body.appendChild(iframe);
        pollForLoadCompletion({iframe, expectBlock});
    }

    function iframeLoaded({isPoll, expectBlock}) {
        return function(ev) {
            clearTimeout(timer);
            var failed = true;
            var message = "";
            try {
                let url = ev.target.contentWindow.location.href;
                if (isPoll && (url === "about:blank" || ev.target.contentDocument.readyState !== "complete")) {
                //if (isPoll && (ev.target.contentDocument.readyState !== "complete")) {
                    pollForLoadCompletion({iframe: ev.target, expectBlock});
                    return;
                }
                if (expectBlock) {
                    message = "The IFrame should have been blocked (or cross-origin). It wasn't.";
                    failed = true;
                } else {
                    message = "The IFrame should not have been blocked. It wasn't.";
                    failed = false;
                }
            } catch (ex) {
                if (expectBlock) {
                    message = "The IFrame should have been blocked (or cross-origin). It was.";
                    failed = false;
                } else {
                    message = "The IFrame should not have been blocked. It was.";
                    failed = true;
                }
            }
            if (window.parent != window)
                window.parent.postMessage({type: 'test_result', failed: failed, message: message}, '*');
            else
                endTest(failed, message);
        };
    }
}

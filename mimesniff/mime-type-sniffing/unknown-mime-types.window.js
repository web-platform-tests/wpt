// META: timeout=long
// META: script=/common/subset-tests.js

setup({
  "explicit_timeout": true,
});

promise_test(() => {
  return fetch("resources/unknown-mime-types.json").then(res => res.json().then(runTests));
}, "Loading data…");

function runTests(tests) {
  tests.forEach((test_data, test_id) => {
    subsetTest(async_test, (t) => {
      const iframe = document.createElement("iframe");

      iframe.sandbox = "allow-same-origin";

      let onload = t.step_func(() => {
        assert_implements_optional(iframe.contentDocument !== null, "Resource can be inspected");

        if ("download_expectation" in test_data && test_data.download_expectation !== null) {
          if (test_data.download_expectation) {
            assert_true(iframe.contentDocument.URL === "about:blank", "Resource prompted download");
            t.done();
          } else {
            assert_true(iframe.contentDocument.URL !== "about:blank", "Resource did not prompt download");
          }
        } else {
          assert_implements_optional(iframe.contentDocument.URL !== "about:blank", "Resource did not prompt download");
        }

        assert_equals(iframe.contentDocument.contentType, test_data.expected_mime_type, "Resource has expected MIME type");
        t.done();
      });

      iframe.addEventListener("load", onload);

      iframe.src = "resources/mime-type-sniffing.py?test_set=unknown-mime-types&test_id=" + test_id;

      t.add_cleanup(() => { iframe.remove(); });

      // XXX: Chrome caps the number of iframes at 1000.
      document.body.appendChild(iframe);

      // XXX: Chrome doesn't fire a load event when a download is blocked.
      t.step_timeout(() => { onload(); }, 10000);
      // t.step_timeout(() => { t.timeout(); }, 60000);
    }, test_data.description);
  });
}

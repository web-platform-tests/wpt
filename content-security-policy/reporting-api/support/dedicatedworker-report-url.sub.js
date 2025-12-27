importScripts("{{location[server]}}/resources/testharness.js");

const workerLocation = self.location.href;

async_test(function(t) {
  const observer = new ReportingObserver(t.step_func_done((reports) => {
    assert_equals(reports[0].url, workerLocation);
  }));
  observer.observe();

  const url = new URL("{{location[server]}}/content-security-policy/support/ping.js").toString();
  const w = new Worker(url);
  w.onmessage = t.unreached_func("Ping should not be sent.");
}, "URL in report should point to worker where violation occurs{{GET[test-name]}}");

done();

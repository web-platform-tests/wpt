function runDelayEventTest(description) {
  const t = async_test(description);
  const start_time = performance.now();
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);

  window.onload = t.step_func_done(() => {
    // The `#to-be-moved` script should delay the load event until it is loaded
    // (i.e. 3 seconds), not just until it is moved out to another Document
    // (i.e. 1 second). Here we expect the delay should be at least 2 seconds,
    // as the latency can be slightly less than 3 seconds due to preloading.
    assert_greater_than(performance.now() - start_time, 2000,
        'Load event should be delayed until script is loaded');
  });

  t.step_timeout(() => {
    const script = document.querySelector('#to-be-moved');
    iframe.contentDocument.body.appendChild(script);
  }, 1000);
}

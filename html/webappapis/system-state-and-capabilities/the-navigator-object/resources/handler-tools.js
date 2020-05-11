// These can be used in an environment that has these variables defined:
// * type
// * handler

function register() {
  navigator.registerProtocolHandler(`web+wpt${type}`, `resources/handler/${type}/${handler}`, `WPT ${type} handler`);
}

function runTest({ includeNull = false } = {}) {
  promise_test(async t => {
    const bc = new BroadcastChannel(`protocol-handler-${type}`);
    const reg = await service_worker_unregister_and_register(t, "resources/handler-sw.js", "resources/handler/");
    t.add_cleanup(async () => await reg.unregister());
    await wait_for_state(t, reg.installing, 'activated');
    const a = document.body.appendChild(document.createElement("a"));
    const codePoints = [];
    let i = includeNull ? 0 : 1;
    for (; i < 0x82; i++) {
      codePoints.push(String.fromCharCode(i));
    }
    a.href = `web+wpt${type}:${codePoints.join("")}`;
    a.target = "_blank";
    a.click();
    await new Promise(resolve => {
      bc.onmessage = t.step_func(e => {
        resultingURL = e.data;
        assert_equals(stringBetweenMarkers(resultingURL, "QES", "QEE"), "%86", "query baseline");
        assert_equals(stringBetweenMarkers(resultingURL, "FES", "FEE"), "%E2%80%A0", "fragment baseline");
        assert_equals(stringBetweenMarkers(resultingURL, "PSS", "PSE"), `web%2Bwpt${type}%3A${includeNull ? "%25%00" : ""}%2501%2502%2503%2504%2505%2506%2507%2508%250B%250C%250E%250F%2510%2511%2512%2513%2514%2515%2516%2517%2518%2519%251A%251B%251C%251D%251E%251F%20!%22%23%24%25%26'()*%2B%2C-.%2F0123456789%3A%3B%3C%3D%3E%3F%40ABCDEFGHIJKLMNOPQRSTUVWXYZ%5B%5C%5D%5E_%60abcdefghijklmnopqrstuvwxyz%7B%7C%7D~%257F%25C2%2580%25C2%2581`, "actual test");
        resolve();
      });
    });
  });
}

function stringBetweenMarkers(string, start, end) {
  return string.substring(string.indexOf(start) + start.length, string.indexOf(end));
}

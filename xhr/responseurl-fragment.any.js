// META global=window,dedicatedworker,sharedworker

async_test(t => {
  const client = new XMLHttpRequest(),
        url = new URL("resources/base.xml#test", location).href;
  client.open("GET", url);
  client.send();
  client.onload = t.step_func_done(() => {
    assert_equals(client.responseURL, url);
  });
}, "responseURL should preserve the fragment");

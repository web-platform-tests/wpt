// META: script=constants.js?pipe=sub

async_test(t => {
  const ws = new WebSocket(SCHEME_DOMAIN_PORT + "/referrer");
  ws.onmessage = t.step_func_done(e => {
    assert_equals(e.data, "MISSING AS PER FETCH");
    ws.close();
  });
}, "Ensure no Referer header is included");

//META: script=/service-workers/service-worker/resources/test-helpers.sub.js
//META: script=resources/util.js
//META: script=/common/utils.js

promise_test(async (t) => {
  const key = token();
  // 1. `initialUrl` is redirected to `finalUrl`.
  // 2. `finalUrl` is intercepted by SW, then falls back to the network, and
  //    receives Critical-CH header.
  //    This should restart the redirect chain from the beginning, i.e. from
  //    `initialUrl`, so `initialUrl` should be requested twice.
  const finalUrl = new URL('critical-ch/echo-hint-in-html.py', location.href);
  const initialUrl = `resources/redirect.py?key=${key}&action=redirect&location=${encodeURIComponent(finalUrl.href)}`;
  await ch_sw_test(t,
    'critical-ch/fallback-request.js',
    finalUrl,
    initialUrl,
    'PASS');
  const count = await (await fetch(`resources/redirect.py?key=${key}&action=get`)).text();
  assert_equals(count, "2");
}, "Critical-CH restarts the redirect chain from the beginning (intercepted by SW)");

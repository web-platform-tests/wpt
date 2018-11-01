// META: script=support.js?pipe=sub
// META: script=/common/utils.js

// This is based on simple-requests.htm, with modifications to make the code more modern and test
// more esoteric cases of header value parsing.

function safelist(headers, expectPreflight = false) {
  promise_test(async t => {
    const uuid = token(),
          url = CROSSDOMAIN + "resources/preflight.py?token=" + uuid,
          checkURL = "resources/preflight.py?check&token=" + uuid,
          request = () => fetch(url, { method: "POST", headers, body: "data" });
    if (expectPreflight) {
      await promise_rejects(t, TypeError(), request());
    } else {
      const response = await fetch(url, { method: "POST", headers, body: "data" });
      assert_equals(response.headers.get("content-type"), "text/plain");
      const body = await response.text();
      assert_equals(body, "NO");
    }
    const checkResponse = await fetch(checkURL, { method: "POST", body: "data" });
    const checkResponseBody = await checkResponse.text();
    assert_equals(checkResponseBody, (expectPreflight ? "1" : "0"));
  }, (expectPreflight ? "Preflight" : "No preflight") + " for " + JSON.stringify(headers));
}

safelist({"content-type": "text/plain;"});
safelist({"content-type": "text/plain;garbage"});
safelist({"content-type": "text/plain;garbage\u0001\u0002"});
safelist({"content-type": "text/plain,"}, true);
safelist({"content-type": ",text/plain"}, true);
safelist({"content-type": "text/plain,text/plain"}, true);
safelist({"content-type": "text/plain,x/x"}, true);
safelist({"content-type": "text/plain\u000B"}, true);
safelist({"content-type": "text/plain\u000C"}, true);

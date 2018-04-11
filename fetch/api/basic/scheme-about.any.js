// META: script=../resources/utils.js

function checkKoUrl(url, method) {
  method = method || "GET";
  const desc = "Fetching " + url.substring(0, 45) + " with method " + method + " is KO"
  promise_test(function(test) {
    var promise = fetch(url, { method: method });
    return promise_rejects(test, new TypeError(), promise);
  }, desc);
}

checkKoUrl("about:blank", "GET");
checkKoUrl("about:blank", "PUT");
checkKoUrl("about:blank", "POST");
checkKoUrl("about:invalid.com");
checkKoUrl("about:config");
checkKoUrl("about:unicorn");

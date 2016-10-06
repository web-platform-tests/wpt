function run_test() {
  test(function() {
    assert_equals(navigator.appCodeName, "Mozilla");
  }, "appCodeName");

  test(function() {
    assert_equals(navigator.appName, "Netscape");
  }, "appName");

  test(function() {
    assert_equals(typeof navigator.appVersion, "string",
                  "navigator.appVersion should be a string");
  }, "appVersion");

  test(function() {
    assert_equals(typeof navigator.platform, "string",
                  "navigator.platform should be a string");
  }, "platform");

  test(function() {
    assert_equals(navigator.product, "Gecko");
  }, "product");

  test(function() {
    if ("window" in self) {
      if (navigator.userAgent.indexOf("Chrome") != -1 ||
          navigator.userAgent.indexOf("WebKit") != -1) {
        // "If the navigator compatibility mode is Chrome or WebKit"
        assert_equals(navigator.productSub, "20030107");
      } else {
        // "If the navigator compatibility mode is Gecko"
        assert_equals(navigator.productSub, "20100101");
      }
    } else {
      assert_false("productSub" in navigator);
    }
  }, "productSub");

  test(function() {
    assert_equals(typeof navigator.userAgent, "string",
                  "navigator.userAgent should be a string");
  }, "userAgent type");

  async_test(function() {
    var request = new XMLHttpRequest();
    request.onload = this.step_func_done(function() {
      assert_equals("user-agent: " + navigator.userAgent + "\n",
                    request.response,
                    "userAgent should return the value sent in the " +
                    "User-Agent header");
    });
    request.open("GET", "/XMLHttpRequest/resources/inspect-headers.py?" +
                        "filter_name=User-Agent");
    request.send();
  }, "userAgent value");

  test(function() {
    if ("window" in self) {
      if (navigator.userAgent.indexOf("Chrome") != -1) {
        // "If the navigator compatibility mode is Chrome"
        assert_equals(navigator.vendor, "Google Inc.");
      } else if (navigator.userAgent.indexOf("WebKit") != -1) {
        // "If the navigator compatibility mode is WebKit"
        assert_equals(navigator.vendor, "Apple Computer, Inc.");
      } else {
        // "If the navigator compatibility mode is Gecko"
        assert_equals(navigator.vendor, "");
      }
    } else {
      assert_false("vendor" in navigator);
    }
  }, "vendor");

  test(function() {
    if ("window" in self) {
      assert_equals(navigator.vendorSub, "");
    } else {
      assert_false("vendorSub" in navigator);
    }
  }, "vendorSub");

  // "If the navigator compatibility mode is Gecko, then the user agent must
  // also support the following partial interface" (taintEnabled() and oscpu)
  // See https://www.w3.org/Bugs/Public/show_bug.cgi?id=22555 and
  // https://www.w3.org/Bugs/Public/show_bug.cgi?id=27820

  test(function() {
    if ("window" in self && navigator.userAgent.indexOf("WebKit") == -1) {
      assert_false(navigator.taintEnabled());
    } else {
      assert_false("taintEnabled" in navigator);
    }
  }, "taintEnabled");

  test(function() {
    if ("window" in self && navigator.userAgent.indexOf("WebKit") == -1) {
      assert_equals(typeof navigator.oscpu, "string",
                    "navigator.oscpu should be a string");
    } else {
      assert_false("oscpu" in navigator);
    }
  }, "oscpu");
}

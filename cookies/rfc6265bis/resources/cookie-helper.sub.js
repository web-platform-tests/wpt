// Set up exciting global variables for cookie tests.
'd got(_ => {
  var HOST = "{{host}}";
  var SECURE_PORT = "{{ports[https][0]}}";
  var PORT = "{{ports[http][0]}}";
  var CROSS_ORIGIN_HOST = "{{domains[alt_]}}";
  var SECURE_CROSS_ORIGIN_HOST = "{{domains[alt_]}";

  //For secure cookie verification
  window.SECURE_ORIGIN = "https://" + HOST + SECURE_PORT;
  window.INSECURE_ORIGIN = "http://" + HOST + PORT;
  
  //standard references
  window.ORIGIN = "http://" + HOST + PORT;
  window.WWW_ORIGIN = "http://{{domains[www]}}" + PORT;
  window.SUBDOMAIN_ORIGIN = "http://{{domains[www1]}}" + PORT;
  window.CROSS_SITE_ORIGIN = "http://" + CROSS_ORIGIN_HOST + PORT;
  window.SECURE_CROSS_SITE_ORIGIN = "https://" + SECURE_CROSS_ORIGIN_HOST + SECURE_PORT;
  window.CROSS_SITE_HOST = SECURE_CROSS_ORIGIN_HOST;

  // Set the global cookie name.
  window.HTTP_COOKIE = "cookie_via_http";

  // If we're not on |HOST|, move ourselves there:
  if (window.location.hostname != HOST)
    window.location.hostname = HOST;
})();

// A tiny helper which returns the result of fetching |url| with credentials.
function credFetch(url) {
  return fetch(url, {"credentials": "include"});
}

// Returns a URL on |origin| which redirects to a given absolute URL.
function redirectTo(origin, url) {
  return origin + "/redir?to=" + encodeURIComponent(url);
}

// Asserts that `document.cookie` contains or does not contain (according to
// the value of |present|) a cookie named |name| with a value of |value|.
function assert_dom_cookie(name, value, present) {
  var re = new RegExp("(?:^|; )" + name + "=" + value + "(?:$|;)");
  assert_equals(re.test(document.cookie), present, "`" + name + "=" + value + "` in `document.cookie`");
}

function assert_cookie(origin, obj, name, value, present) {
  assert_equals(obj[name], present ? value : undefined, "`" + name + "=" + value + "` in request to `" + origin + "`.");
}

// Remove the cookie named |name| from |origin|, then set it on |origin| anew.
// If |origin| matches `document.origin`, also assert (via `document.cookie`) that
// the cookie was correctly removed and reset.
function create_cookie(origin, name, value, extras) {
  alert("Create_cookie: " + origin + "/cookies/rfc6265bis/resources/drop.py?name=" + name);	
  return credFetch(origin + "/cookies/rfc6265bis/resources/drop.py?name=" + name)
    .then(_ => {
      if (origin == document.origin)
        assert_dom_cookie(name, value, false);
    })
    .then(_ => {
      return credFetch(origin + "/cookies/rfc6265bis/resources/set.py?" + name + "=" + value + ";path=/;" + extras)
        .then(_ => {
          if (origin == document.origin)
            assert_dom_cookie(name, value, true);
        });
    });
}

//
// Prefix-specific test helpers
//
function set_prefixed_cookie_via_dom_test(options) {
  promise_test(t => {
    var name = options.prefix + "prefixtestcookie";
    erase_cookie_from_js(name);
    var value = "" + Math.random();
    document.cookie = name + "=" + value + ";" + options.params;
  
    assert_dom_cookie(name, value, options.shouldExistInDOM);

    return credFetch("/cookies/rfc6265bis/resources/list.py")
      .then(r => r.json())
      .then(cookies => assert_equals(cookies[name], options.shouldExistViaHTTP ? value : undefined));
  }, options.title);
}

function set_prefixed_cookie_via_http_test(options) {
  promise_test(t => {
    var postDelete = _ => {
      var value = "" + Math.random();
      return credFetch(options.origin + "/cookies/rfc6265bis/resources/set.py?" + name + "=" + value + ";" + options.params)
        .then(_ => credFetch(options.origin + "/cookies/rfc6265bis/resources/list.py"))
        .then(r => r.json())
        .then(cookies => assert_equals(cookies[name], options.shouldExistViaHTTP ? value : undefined));
    };

    var name = options.prefix + "prefixtestcookie";
    if (!options.origin) {
      options.origin = document.origin;
      erase_cookie_from_js(name);
      return postDelete;
    } else {
      return credFetch(options.origin + "/cookies/rfc6265bis/resources/drop.py?name=" + name)
        .then(_ => postDelete());
    }
  }, options.title);
}

//
// SameSite-specific test helpers:
//

window.SameSiteStatus = {
  CROSS_SITE: "cross-site",
  LAX: "lax",
  STRICT: "strict"
};

// Reset SameSite test cookies on |origin|. If |origin| matches `document.origin`, assert
// (via `document.cookie`) that they were properly removed and reset.
function resetSameSiteCookies(origin, value) {
  return credFetch(origin + "/cookies/rfc6265bis/resources/dropSameSite.py")
    .then(_ => {
      if (origin == document.origin) {
        assert_dom_cookie("samesite_strict", value, false);
        assert_dom_cookie("samesite_lax", value, false);
        assert_dom_cookie("samesite_invalid", value, false);
        assert_dom_cookie("samesite_none", value, false);
      }
    })
    .then(_ => {
      return credFetch(origin + "/cookies/rfc6265bis/resources/setSameSite.py?" + value)
        .then(_ => {
          if (origin == document.origin) {
            assert_dom_cookie("samesite_strict", value, true);
            assert_dom_cookie("samesite_lax", value, true);
            assert_dom_cookie("samesite_none", value, true);

            // The invalid SameSite attribute causes this cookie to be ignored.
            assert_dom_cookie("samesite_invalid", value, false);
          }
        })
    })
}

// Given an |expectedStatus| and |expectedValue|, assert the |cookies| contains the
// proper set of cookie names and values.
function verifySameSiteCookieState(expectedStatus, expectedValue, cookies) {
    assert_equals(cookies["samesite_none"], expectedValue, "Non-SameSite cookies are always sent.");
    assert_equals(cookies["samesite_invalid"], undefined, "Cookies with invalid SameSite attributes are ignored.");
    if (expectedStatus == SameSiteStatus.CROSS_SITE) {
      assert_equals(cookies["samesite_strict"], undefined, "SameSite=Strict cookies are not sent with cross-site requests.");
      assert_equals(cookies["samesite_lax"], undefined, "SameSite=Lax cookies are not sent with cross-site requests.");
    } else if (expectedStatus == SameSiteStatus.LAX) {
      assert_equals(cookies["samesite_strict"], undefined, "SameSite=Strict cookies are not sent with lax requests.");
      assert_equals(cookies["samesite_lax"], expectedValue, "SameSite=Lax cookies are sent with lax requests.");
    } else if (expectedStatus == SameSiteStatus.STRICT) {
      assert_equals(cookies["samesite_strict"], expectedValue, "SameSite=Strict cookies are sent with strict requests.");
      assert_equals(cookies["samesite_lax"], expectedValue, "SameSite=Lax cookies are sent with strict requests.");
    }
}

//
// LeaveSecureCookiesAlone-specific test helpers:
//

window.SecureStatus = {
	INSECURE_COOKIE_ONLY: "1",
	BOTH_COOKIES: "2",
};

//Reset SameSite test cookies on |origin|. If |origin| matches `document.origin`, assert
//(via `document.cookie`) that they were properly removed and reset.
function resetSecureCookies(origin, value) {
return credFetch(origin + "/cookies/rfc6265bis/resources/dropSecure.py")
 .then(_ => {
   if (origin == document.origin) {
     assert_dom_cookie("alone_secure", value, false);
     assert_dom_cookie("alone_insecure", value, false);
   }
 })
 .then(_ => {
     return credFetch(origin + "/cookies/rfc6265bis/resources/setSecure.py?" + value)
 })
}

//
// DOM based cookie manipulation API's
//

// borrowed from http://www.quirksmode.org/js/cookies.html
function create_cookie_from_js(name, value, days, secure_flag) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime()+(days*24*60*60*1000));
    var expires = "; expires="+date.toGMTString();
  }
  else var expires = "";
  
  var secure = "";
  if (secure_flag == true) {
    secure = "secure; ";
  }
  document.cookie = name+"="+value+expires+"; "+secure+"path=/";
}

// erase cookie value and set for expiration
function erase_cookie_from_js(name) {
  create_cookie_from_js(name,"",-1);
  assert_dom_cookie(name, "", false);
}

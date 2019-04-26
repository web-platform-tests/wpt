// TODO: This function is currently placed and duplicated at:
// - mixed-content/generic/mixed-content-test-case.js
// - referrer-policy/generic/referrer-policy-test-case.js
// but should be moved to /common/security-features/resources/common.js.
function getSubresourceOrigin(originType) {
  const httpProtocol = "http";
  const httpsProtocol = "https";
  const wsProtocol = "ws";
  const wssProtocol = "wss";

  const sameOriginHost = "{{host}}";
  const crossOriginHost = "{{domains[www1]}}";

  // These values can evaluate to either empty strings or a ":port" string.
  const httpPort = getNormalizedPort(parseInt("{{ports[http][0]}}", 10));
  const httpsPort = getNormalizedPort(parseInt("{{ports[https][0]}}", 10));
  const wsPort = getNormalizedPort(parseInt("{{ports[ws][0]}}", 10));
  const wssPort = getNormalizedPort(parseInt("{{ports[wss][0]}}", 10));

  /**
    @typedef OriginType
    @type {string}

    Represents the origin of the subresource request URL.
    The keys of `originMap` below are the valid values.

    Note that there can be redirects from the specified origin
    (see RedirectionType), and thus the origin of the subresource
    response URL might be different from what is specified by OriginType.
  */
  const originMap = {
    "same-https": httpsProtocol + "://" + sameOriginHost + httpsPort,
    "same-http": httpProtocol + "://" + sameOriginHost + httpPort,
    "cross-https": httpsProtocol + "://" + crossOriginHost + httpsPort,
    "cross-http": httpProtocol + "://" + crossOriginHost + httpPort,
    "same-wss": wssProtocol + "://" + sameOriginHost + wssPort,
    "same-ws": wsProtocol + "://" + sameOriginHost + wsPort,
    "cross-wss": wssProtocol + "://" + crossOriginHost + wssPort,
    "cross-ws": wsProtocol + "://" + crossOriginHost + wsPort,
  };

  return originMap[originType];
}

// NOTE: This method only strips the fragment and is not in accordance to the
// recommended draft specification:
// https://w3c.github.io/webappsec/specs/referrer-policy/#null
// TODO(kristijanburnik): Implement this helper as defined by spec once added
// scenarios for URLs containing username/password/etc.
function stripUrlForUseAsReferrer(url) {
  return url.replace(/#.*$/, "");
}

function TestCase(scenario, testDescription) {
  // Pass and skip rest of the test if browser does not support fetch.
  if (scenario.subresource == "fetch-request" && !window.fetch) {
    // TODO(kristijanburnik): This should be refactored.
    return {
      start: function() {
        test(function() { assert_true(true); },
             "[ReferrerPolicyTestCase] Skipping test: Fetch is not supported.");
      }
    };
  }

  const redirectionTypeConversion = {
    "no-redirect": "no-redirect",
    "keep-scheme": "keep-scheme-redirect",
    "swap-scheme": "swap-scheme-redirect",
    "keep-origin": "keep-origin-redirect",
    "swap-origin": "swap-origin-redirect"
  };

  const urls = getRequestURLs(
      scenario.subresource,
      scenario.origin,
      redirectionTypeConversion[scenario.redirection]);

  const referrerUrlResolver = {
    "omitted": function(sourceUrl) {
      return undefined;
    },
    "origin": function(sourceUrl) {
      return new URL(sourceUrl).origin + "/";
    },
    "stripped-referrer": function(sourceUrl) {
      return stripUrlForUseAsReferrer(sourceUrl);
    }
  };

  const checkResult = (expectedReferrerUrl, result) => {
    // Check the reported URL.
    assert_equals(result.referrer,
                  expectedReferrerUrl,
                  "Reported Referrer URL is '" +
                  scenario.referrer_url + "'.");
    assert_equals(result.headers.referer,
                  expectedReferrerUrl,
                  "Reported Referrer URL from HTTP header is '" +
                  expectedReferrerUrl + "'");
  };

  function runTest() {
    /** @type {Subresource} */
    const subresource = {
      subresourceType: scenario.subresource,
      url: urls.testUrl,
      policyDeliveries: scenario.subresource_policy_deliveries,
    };

    const expectedReferrer =
      referrerUrlResolver[scenario.referrer_url](location.toString());

    // Request in the top-level document.
    promise_test(_ => {
        return invokeRequest(subresource, scenario.source_context_list)
          .then(result => checkResult(expectedReferrer, result));
      }, testDescription);
  }

  return {start: runTest};
}

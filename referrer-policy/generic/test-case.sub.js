// TODO: This function is currently placed here and duplicated,
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

function invokeScenario(scenario) {
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
  /** @type {Subresource} */
  const subresource = {
    subresourceType: scenario.subresource,
    url: urls.testUrl,
    policyDeliveries: scenario.subresource_policy_deliveries,
  };

  return invokeRequest(subresource, scenario.source_context_list);
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

  const sentFromSrcdoc = scenario.source_context_list.length > 0 &&
      scenario.source_context_list[scenario.source_context_list.length - 1]
      .sourceContextType === 'srcdoc';

  const checkResult = (expectation, result) => {
    // https://w3c.github.io/webappsec-referrer-policy/#determine-requests-referrer
    let referrerSource = result.sourceContextUrl;
    if (sentFromSrcdoc) {
      // Step 3. While document is an iframe srcdoc document, let document be
      // document's browsing context's browsing context container's node
      // document. [spec text]

      // Workaround for srcdoc cases. Currently we only test <iframe srcdoc>
      // inside the top-level Document, so |document| in the spec here is
      // the top-level Document.
      // This doesn't work if e.g. we test <iframe srcdoc> inside another
      // external <iframe>.
      referrerSource = location.toString();
    }

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
    const expectedReferrerUrl =
      referrerUrlResolver[expectation](referrerSource);

    // Check the reported URL.
    assert_equals(result.referrer,
                  expectedReferrerUrl,
                  "Reported Referrer URL is '" +
                  expectation + "'.");
    assert_equals(result.headers.referer,
                  expectedReferrerUrl,
                  "Reported Referrer URL from HTTP header is '" +
                  expectedReferrerUrl + "'");
  };

  function runTest() {
    promise_test(_ => {
        return invokeScenario(scenario)
          .then(result => checkResult(scenario.expectation, result));
      }, testDescription);

    // `Referer` headers with length over 4k are culled down to an origin, so,
    // let's test around that boundary for tests that would otherwise return
    // the complete URL.
    // The following tests run only on top-level Documents, because they rely
    // on navigations using `history`.
    // Different subresource URLs are used because getRequestURLs() is called
    // for each sub test which returns a unique URL.
    if (scenario.expectation == "stripped-referrer" &&
        scenario.source_context_list.length == 0) {
      promise_test(_ => {
        history.pushState(null, null, "/");
        history.replaceState(null, null, "A".repeat(4096 - location.href.length - 1));
        return invokeScenario(scenario)
          .then(result => checkResult(scenario.expectation, result))
          .finally(_ => {
              history.back();
              return new Promise(resolve => {
                  window.addEventListener('popstate', resolve, {once: true});
                });
            });
      }, "`Referer` header with length < 4k is not stripped to an origin.");

      promise_test(_ => {
        history.pushState(null, null, "/");
        history.replaceState(null, null, "B".repeat(4096 - location.href.length));
        return invokeScenario(scenario)
          .then(result => checkResult(scenario.expectation, result))
          .finally(_ => {
              history.back();
              return new Promise(resolve => {
                  window.addEventListener('popstate', resolve, {once: true});
                });
            });
      }, "`Referer` header with length == 4k is not stripped to an origin.");
      promise_test(_ => {
        history.pushState(null, null, "/");
        history.replaceState(null, null, "C".repeat(4096 - location.href.length + 1));
        return invokeScenario(scenario)
          .then(result => checkResult('origin', result))
          .finally(_ => {
              history.back();
              return new Promise(resolve => {
                  window.addEventListener('popstate', resolve, {once: true});
                });
            });
      }, "`Referer` header with length > 4k is stripped to an origin.");
    }
  }

  return {start: runTest};
}

var ReferrerPolicyTestCase = function(scenario, testDescription) {
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

  // Check if scenario is valid.
  // TODO(kristijanburnik): Move to a sanity-checks.js for debug mode only.
  test(function() {

    // We extend the exsiting test_expansion_schema not to kill performance by
    // copying.
    var expectedFields = SPEC_JSON["test_expansion_schema"];
    expectedFields["referrer_policy"] = SPEC_JSON["referrer_policy_schema"];

    for (var field in expectedFields) {
      assert_own_property(scenario, field,
                          "The scenario contains field " + field)
      assert_in_array(scenario[field], expectedFields[field],
                      "Scenario's " + field + " is one of: " +
                      expectedFields[field].join(", ")) + "."
    }

    // Check if the protocol is matched.
    assert_equals(scenario["source_protocol"] + ":", location.protocol,
                  "Protocol of the test page should match the scenario.")

  }, "[ReferrerPolicyTestCase] The test scenario is valid.");

  var subresourceInvoker = {
    "a-tag": queryLink,
    "area-tag": queryAreaLink,
    "fetch-request": queryFetch,
    "iframe-tag": queryIframe,
    "img-tag":  queryImage,
    "script-tag": queryScript,
    "worker-request": queryWorker,
    "xhr-request": queryXhr
  };

  var pathForSubresource = SPEC_JSON["subresource_path"];

  var referrerUrlResolver = {
    "omitted": function() {
      return undefined;
    },
    "origin": function() {
      // TODO(kristijanburnik): Reconsider using the trailing slash as the spec
      // evolves.
      return document.origin + "/";
    },
    "stripped-referrer": function() {
      return stripUrlForUseAsReferrer(location.toString());
    }
  };

  var t = {
    _scenario: scenario,
    _testDescription: testDescription,
    _subresourceUrl: null,
    _expectedReferrerUrl: null,
    _constructSubresourceUrl: function() {
      // TODO(kristijanburnik): We should assert that these two domains are
      // different. E.g. If someone runs the tets over www, this would fail.
      var domainForOrigin = {
        "cross-origin":"{{domains[www1]}}",
        "same-origin": location.hostname
      };

      // Values obtained and replaced by the wptserve pipeline:
      // http://wptserve.readthedocs.org/en/latest/pipes.html#built-in-pipes
      var portForProtocol = {
        "http": parseInt("{{ports[http][0]}}"),
        "https": parseInt("{{ports[https][0]}}")
      }

      var targetPort = portForProtocol[t._scenario.target_protocol];

      t._subresourceUrl = t._scenario.target_protocol + "://" +
                          domainForOrigin[t._scenario.origin] +
                          normalizePort(targetPort) +
                          pathForSubresource[t._scenario.subresource];
    },

    _constructExpectedReferrerUrl: function() {
      t._expectedReferrerUrl = referrerUrlResolver[t._scenario.referrer_url]();
    },

    _invokeSubresource: function(callback) {
      var invoker = subresourceInvoker[t._scenario.subresource];

      // Depending on the delivery method, extend the subresource element with
      // these attributes.
      var elementAttributesForDeliveryMethod = {
        "attr-referrer":  {referrer: t._scenario.referrer_policy},
        "rel-noreferrer": {rel: "noreferrer"}
      };

      var delivery_method = t._scenario.delivery_method;

      if (delivery_method in elementAttributesForDeliveryMethod) {
        invoker(t._subresourceUrl,
                callback,
                elementAttributesForDeliveryMethod[delivery_method]);
      } else {
        invoker(t._subresourceUrl, callback);
      }

    },

    start: function() {
      t._constructSubresourceUrl();
      t._constructExpectedReferrerUrl();

      var test = async_test(t._testDescription);

      t._invokeSubresource(function(result) {
        // Check if the result is in valid format.
        test.step(function() {
          assert_equals(Object.keys(result).length, 3);
          assert_own_property(result, "location");
          assert_own_property(result, "referrer");
          assert_own_property(result, "headers");

          // Skip location check for scripts.
          if (t._scenario.subresource == "script-tag")
            return;

          // Sanity check: location of sub-resource matches reported location.
          assert_equals(result.location, t._subresourceUrl,
                        "Subresource reported location.");
        }, "Running a valid test scenario.");

        // Check the reported URL.
        test.step(function() {
          assert_equals(result.referrer,
                        t._expectedReferrerUrl,
                        "Reported Referrer URL is '" +
                        t._scenario.referrer_url +
                        "'.");
          assert_equals(result.headers.referer,
                        t._expectedReferrerUrl,
                        "Reported Referrer URL from HTTP header is '" +
                        t._expectedReferrerUrl + "'");
        }, "Reported Referrer URL is as expected: " + t._scenario.referrer_url);

        test.done();
      })

    }
  }

  return t;
}

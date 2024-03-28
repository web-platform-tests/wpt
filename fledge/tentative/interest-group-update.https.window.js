// META: script=/resources/testdriver.js
// META: script=/common/utils.js
// META: script=resources/fledge-util.sub.js
// META: script=/common/subset-tests.js
// META: timeout=long
// META: variant=?1-4
// META: variant=?5-9
// META: variant=?10-14
// META: variant=?15-19
// META: variant=?20-last






"use strict;"

// This test repeatedly runs auctions to verify an update. A modified bidding script
// continuously throws errors until it detects the expected change in the interest group
// field. This update then stops the auction cycle.
const makeTestForUpdate = ({
  // Test name
  name,
  // fieldname that is getting updated
  interestGroupFieldName,
  // This is used to check if update has happened.
  expectedValue,
  // This is used to create the update response, by default it will always send
  // back the `expectedValue`. Extra steps to make a deep copy.
  responseOverride = expectedValue,
  // Overrides to the interest group.
  interestGroupOverrides = {},
  // Overrides to the auction config.
  auctionConfigOverrides = {},
}) => {
  subsetTest(promise_test, async test => {
    const uuid = generateUuid(test);
    extraBiddingLogic = "";

    // Testing 'ads' and 'adComponents' requires some additional setup due to their reliance
    // on createRenderURL. We use a renderURL with a placeholder 'UUID-PLACEHOLDER' and make
    // sure to replace it before moving on to the test. When checking the render URL,
    // both the old and new versions might exist in the interest group, so this test deletes
    // the old one to ensure a clean comparison with deepEquals.
    if (interestGroupFieldName == "ads" || interestGroupFieldName == "adComponents") {
      interestGroupOverrides[interestGroupFieldName].forEach(element => {
        element.renderURL = element.renderURL.replace("UUID-PLACEHOLDER", uuid);
      });
      // If the expected value is the same object as the response, we need to make sure we
      // replace the placeholder, if they are the same, changing the responseOverride will
      // change both.
      if (expectedValue != responseOverride) {
        expectedValue.forEach(element => {
          element.renderURL = element.renderURL.replace("UUID-PLACEHOLDER", uuid);
        });
      }
      responseOverride.forEach(element => {
        element.renderURL = element.renderURL.replace("UUID-PLACEHOLDER", uuid);
      });

      extraBiddingLogic = `
      interestGroup.${interestGroupFieldName}.forEach(element => {
        delete element.renderUrl;
      });
        `
    }

    let expectedValueJSON = JSON.stringify(expectedValue);
    // When the update has not yet been seen, throw an error which will cause the auction not to have a result.
    interestGroupOverrides.biddingLogicURL = createBiddingScriptURL({
      generateBid: `
      ${extraBiddingLogic}
      if (!deepEquals(interestGroup.${interestGroupFieldName}, ${expectedValueJSON})) {
        throw "${interestGroupFieldName} is " + JSON.stringify(interestGroup.${interestGroupFieldName})+ " instead of "+'${expectedValueJSON}'
      }`
    });

    let responseBody = {};
    responseBody[interestGroupFieldName] = responseOverride;
    params = {
      body: JSON.stringify(responseBody),
      uuid: uuid
    }
    interestGroupOverrides.updateURL = createUpdateURL(params);
    await joinInterestGroup(test, uuid, interestGroupOverrides);

    // Run an auction until there's a winner, which means update occurred.
    let auctionResult = null
    while (!auctionResult) {
      auctionResult = await runBasicFledgeAuction(test, uuid, auctionConfigOverrides);
    }
  }, name);
};

// In order to test the update process does not update certain fields, this test uses two interest groups:

// * `groupWithUpdate`: Receives the update and will signal the change by throwing an error.
// * `groupWithoutUpdate`: Remains un-updated and will continue to throw errors until the change reaches it (which shouldn't happen).

// By tracking render URLs, this test guarantees that only the URL associated with the correct update
// (`goodUpdateRenderURL`) is used, and the incorrect URL (`badUpdateRenderURL`) isn't. The test runs
// auctions repeatedly until the update in `groupWithUpdate` stops an auction from producing a winner.
// It then will run one final auction. If there's still no winner, it can infer that `groupWithoutUpdate` would have
// received the update if it were propagating correctly.
const makeTestForNoUpdate = ({
  // Test name
  name,
  // fieldname that is getting updated
  fieldNameWithUpdate,
  // fieldname that is should not be getting updated
  fieldNameWithoutUpdate,
  // this is used to create the update response and check if it happened.
  fieldWithUpdateExpectedValue,
  // this is used to create the update response and check if it did not happen.
  fieldWithoutUpdateTestValue,
  // Overrides to the auction config.
  auctionConfigOverrides = {},
  // Overrides to the interest group.
  groupWithUpdate = {},
  groupWithoutUpdate = {},
}) => {
  subsetTest(promise_test, async test => {
    const uuid = generateUuid(test);
    let fieldWithUpdateExpectedValueJSON = JSON.stringify(fieldWithUpdateExpectedValue);

    // groupWithUpdate
    const goodUpdateRenderURL = createTrackerURL(window.location.origin, uuid, "track_get", "good_update");
    // Name needed so we don't have two IGs with same name
    groupWithUpdate.ads = [{ "renderURL": goodUpdateRenderURL }]
    groupWithUpdate.biddingLogicURL = createBiddingScriptURL({
      generateBid: `
      if (deepEquals(interestGroup.${fieldNameWithUpdate}, ${fieldWithUpdateExpectedValueJSON})){
        throw "${fieldNameWithUpdate} has updated and is " +
        '${JSON.stringify(fieldWithUpdateExpectedValue)}.'
      }
      `
    });

    let responseBody1 = {};
    responseBody1[fieldNameWithUpdate] = fieldWithUpdateExpectedValue;
    let params1 = {
      body: JSON.stringify(responseBody1),
      uuid: uuid
    }
    groupWithUpdate.updateURL = createUpdateURL(params1);
    await joinInterestGroup(test, uuid, groupWithUpdate);
    ///////////////////////// groupWithUpdate

    // groupWithoutUpdate
    const badUpdateRenderURL = createTrackerURL(window.location.origin, uuid, "track_get", "bad_update");
    groupWithoutUpdate.name = groupWithoutUpdate.name ? groupWithoutUpdate.name : "IG name"
    groupWithoutUpdate.ads = [{ "renderURL": badUpdateRenderURL }]
    groupWithoutUpdate.biddingLogicURL = createBiddingScriptURL({
      generateBid: `
      if (!deepEquals(interestGroup.${fieldNameWithoutUpdate}, ${JSON.stringify(fieldWithoutUpdateTestValue)})){
        throw "${fieldNameWithoutUpdate} is as expected: "+ JSON.stringify(interestGroup.${fieldNameWithoutUpdate});
      }`
    });
    let responseBody2 = {};
    responseBody2[fieldNameWithoutUpdate] = fieldWithoutUpdateTestValue;

    let params2 = {
      body: JSON.stringify(responseBody2),
      uuid: uuid
    };

    groupWithoutUpdate.updateURL = createUpdateURL(params2);
    await joinInterestGroup(test, uuid, groupWithoutUpdate);
    ///////////////////////// groupWithoutUpdate

    // First result should be not be null, `groupWithUpdate` throws when update is detected so until then,
    // run and observe the requests to ensure only `goodUpdateRenderURL` is fetched.
    let auctionResult = await runBasicFledgeTestExpectingWinner(test, uuid, auctionConfigOverrides);
    while (auctionResult) {
      createAndNavigateFencedFrame(test, auctionResult);
      await waitForObservedRequests(
        uuid,
        [goodUpdateRenderURL, createSellerReportURL(uuid)]);
      await fetch(createCleanupURL(uuid));
      auctionResult = await runBasicFledgeAuction(test, uuid, auctionConfigOverrides);
    }
    // Re-run to ensure null because:
    // `groupWithUpdate` should be throwing since update occurred.
    // `groupWithoutUpdate` should be throwing since update did not occur.
    auctionResult = await runBasicFledgeAuction(test, uuid, auctionConfigOverrides);
    assert_true(auctionResult == null);

  }, name);
};

// Helper to eliminate rewriting a long call to createRenderURL().
// Only thing to change would be signalParams to differentiate between URLs.
const createTempRenderURL = (signalsParams = null) => {
  return createRenderURL("UUID-PLACEHOLDER", null, signalsParams, null);
};

makeTestForUpdate({
  name: "userBiddingSignals update overwrites everything in the field.",
  interestGroupFieldName: "userBiddingSignals",
  expectedValue: { "test": 20 },
  interestGroupOverrides: {
    userBiddingSignals: { "test": 10, "extra_value": true },
  }
});

makeTestForUpdate({
  name: "userBiddingSignals updated multi-type",
  interestGroupFieldName: "userBiddingSignals",
  expectedValue: { "test": 20, 5: [1, [false, false, true], 3, "Hello"] },
  interestGroupOverrides: {
    userBiddingSignals: { "test": 10 },
  }
});

makeTestForUpdate({
  name: "userBiddingSignals updated to non object",
  interestGroupFieldName: "userBiddingSignals",
  expectedValue: 5,
  interestGroupOverrides: {
    userBiddingSignals: { "test": 10 },
  }
});

makeTestForUpdate({
  name: "userBiddingSignals updated to null",
  interestGroupFieldName: "userBiddingSignals",
  expectedValue: null,
  interestGroupOverrides: {
    userBiddingSignals: { "test": 10 },
  }
});

makeTestForUpdate({
  name: "trustedBiddingSignalsKeys updated correctly",
  interestGroupFieldName: "trustedBiddingSignalsKeys",
  expectedValue: ["new_key", "old_key"],
  interestGroupOverrides: {
    trustedBiddingSignalsKeys: ["old_key"],
  }
});

makeTestForUpdate({
  name: "trustedBiddingSignalsKeys updated to empty array.",
  interestGroupFieldName: "trustedBiddingSignalsKeys",
  expectedValue: [],
  interestGroupOverrides: {
    trustedBiddingSignalsKeys: ["old_key"],
  }
});


makeTestForUpdate({
  name: "trustedBiddingSignalsSlotSizeMode updated to slot-size",
  interestGroupFieldName: "trustedBiddingSignalsSlotSizeMode",
  expectedValue: "slot-size",
  interestGroupOverrides: {
    trustedBiddingSignalsKeys: ["key"],
    trustedBiddingSignalsSlotSizeMode: "none",
  }
});

makeTestForUpdate({
  name: "trustedBiddingSignalsSlotSizeMode updated to all-slots-requested-sizes",
  interestGroupFieldName: "trustedBiddingSignalsSlotSizeMode",
  expectedValue: "all-slots-requested-sizes",
  interestGroupOverrides: {
    trustedBiddingSignalsKeys: ["key"],
    trustedBiddingSignalsSlotSizeMode: "slot-size",
  }
});

makeTestForUpdate({
  name: "trustedBiddingSignalsSlotSizeMode updated to none",
  interestGroupFieldName: "trustedBiddingSignalsSlotSizeMode",
  expectedValue: "none",
  interestGroupOverrides: {
    trustedBiddingSignalsKeys: ["key"],
    trustedBiddingSignalsSlotSizeMode: "slot-size",
  }
});

makeTestForUpdate({
  name: "trustedBiddingSignalsSlotSizeMode updated to unknown, defaults to 'none'",
  interestGroupFieldName: "trustedBiddingSignalsSlotSizeMode",
  expectedValue: "none",
  responseOverride: "unknown-type",
  interestGroupOverrides: {
    trustedBiddingSignalsKeys: ["key"],
    trustedBiddingSignalsSlotSizeMode: "slot-size",
  }
});

makeTestForUpdate({
  name: "ads updated from 2 ads to 1.",
  interestGroupFieldName: "ads",
  expectedValue: [
    { renderURL: createTempRenderURL("new_url1"), metadata: "test1-new" },
  ],
  interestGroupOverrides: {
    ads: [{ renderURL: createTempRenderURL() },
    { renderURL: createTempRenderURL() }]
  }
});

makeTestForUpdate({
  name: "ads updated from 1 ad to 2.",
  interestGroupFieldName: "ads",
  expectedValue: [
    { renderURL: createTempRenderURL("new_url1"), metadata: "test1-new" },
    { renderURL: createTempRenderURL("new_url2"), metadata: "test2-new" },
  ],
  interestGroupOverrides: {
    ads: [{ renderURL: createTempRenderURL() }]
  }
});

makeTestForUpdate({
  name: "adComponents updated from 1 adComponent to 2.",
  interestGroupFieldName: "adComponents",
  expectedValue: [{ renderURL: createTempRenderURL("new_url1"), metadata: "test1-new" },
  { renderURL: createTempRenderURL("new_url2"), metadata: "test2" }],
  interestGroupOverrides: {
    adComponents: [{ renderURL: createTempRenderURL(), metadata: "test1" }]
  },
});

makeTestForUpdate({
  name: "adComponents updated from 2 adComponents to 1.",
  interestGroupFieldName: "adComponents",
  expectedValue: [{ renderURL: createTempRenderURL("new_url1"), metadata: "test1-new" }],
  interestGroupOverrides: {
    adComponents: [{ renderURL: createTempRenderURL() },
    { renderURL: createTempRenderURL() }]
  },
});

makeTestForUpdate({
  name: "executionMode updated to frozen context",
  interestGroupFieldName: "executionMode",
  expectedValue: "frozen-context",
  interestGroupOverrides: {
    executionMode: "compatibility",
  }
});

makeTestForUpdate({
  name: "executionMode updated to compatibility",
  interestGroupFieldName: "executionMode",
  expectedValue: "compatibility",
  interestGroupOverrides: {
    executionMode: "frozen-context",
  }
});

makeTestForUpdate({
  name: "executionMode updated to group by origin",
  interestGroupFieldName: "executionMode",
  expectedValue: "group-by-origin",
  interestGroupOverrides: {
    executionMode: "compatibility",
  }
});

makeTestForUpdate({
  name: "executionMode updated with invalid input",
  interestGroupFieldName: "executionMode",
  expectedValue: "compatibility",
  responseOverride: "unknown-type",
  interestGroupOverrides: {
    executionMode: "compatibility",
  }
});

makeTestForNoUpdate({
  name: "owner cannot be updated.",
  fieldNameWithUpdate: "userBiddingSignals",
  fieldNameWithoutUpdate: "owner",
  fieldWithoutUpdateTestValue: OTHER_ORIGIN1,
  fieldWithUpdateExpectedValue: { "test": 20 },
});

makeTestForNoUpdate({
  name: "name cannot be updated.",
  fieldNameWithUpdate: "executionMode",
  fieldNameWithoutUpdate: "name",
  fieldWithoutUpdateTestValue: "new_name",
  fieldWithUpdateExpectedValue: "frozen-context",
  groupWithoutUpdate: { name: "name2" },

});

makeTestForNoUpdate({
  name: "executionMode not updated when unknown type.",
  fieldNameWithUpdate: "userBiddingSignals",
  fieldNameWithoutUpdate: "executionMode",
  fieldWithoutUpdateTestValue: "unkown-type",
  fieldWithUpdateExpectedValue: { "test": 20 },
  groupWithoutUpdate: { executionMode: "compatibility" },
});

makeTestForNoUpdate({
  name: "trustedBiddingSignalsKeys not updated when bad value.",
  fieldNameWithUpdate: "userBiddingSignals",
  fieldNameWithoutUpdate: "trustedBiddingSignalsKeys",
  fieldWithoutUpdateTestValue: 5,
  fieldWithUpdateExpectedValue: { "test": 20 },
  groupWithoutUpdate: {
    trustedBiddingSignalsKeys: ["key"],
  },
});


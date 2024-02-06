// META: script=/resources/testdriver.js
// META: script=/common/utils.js
// META: script=resources/fledge-util.sub.js
// META: script=/common/subset-tests.js
// META: timeout=long
// META: variant=?1-5
// META: variant=?6-10
// META: variant=?11-15
// META: variant=?16-20
// META: variant=?21-last

"use strict;"

// The auction is run with the seller being the same as the document origin.
// Additional bids must come from the same origin as the seller.
const SINGLE_SELLER_AUCTION_SELLER = window.location.origin;

const ADDITIONAL_BID_SECRET_KEY = "nWGxne/9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A=";
const ADDITIONAL_BID_PUBLIC_KEY = "11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=";

// Single-seller auction with a single buyer who places a single additional
// bid. As the only bid, this wins.
subsetTest(promise_test, async test => {
  const uuid = generateUuid(test);
  const auctionNonce = await navigator.createAuctionNonce();
  const seller = SINGLE_SELLER_AUCTION_SELLER;

  const buyer = OTHER_ORIGIN1;
  const additionalBid = createAdditionalBid(uuid, auctionNonce, seller, buyer, "horses", 1.99);

  await runBasicFledgeAuctionAndNavigate(test, uuid, {
    interestGroupBuyers: [buyer],
    auctionNonce: auctionNonce,
    additionalBids: fetchAdditionalBids(seller, auctionNonce, [{ additionalBid: additionalBid }])
  });

  await waitForObservedRequests(uuid, [createSellerReportURL(uuid), createBidderReportURL(uuid, "horses")]);
});

// Single-seller auction with a two buyers competing with additional bids.
subsetTest(promise_test, async test => {
  const uuid = generateUuid(test);
  const auctionNonce = await navigator.createAuctionNonce();
  const seller = SINGLE_SELLER_AUCTION_SELLER;

  const buyer1 = OTHER_ORIGIN1;
  const additionalBid1 = createAdditionalBid(uuid, auctionNonce, seller, buyer1, "horses", 1.99);

  const buyer2 = OTHER_ORIGIN2;
  const additionalBid2 = createAdditionalBid(uuid, auctionNonce, seller, buyer2, "planes", 2.99);

  await runBasicFledgeAuctionAndNavigate(test, uuid, {
    interestGroupBuyers: [buyer1, buyer2],
    auctionNonce: auctionNonce,
    additionalBids: fetchAdditionalBids(seller, auctionNonce,
      [{ additionalBid: additionalBid1 }, { additionalBid: additionalBid2 }])
  });

  await waitForObservedRequests(uuid, [createSellerReportURL(uuid), createBidderReportURL(uuid, "planes")]);
});

// Same as the test above, except that this uses two Fetch requests instead of
// one to retrieve the additional bids.
subsetTest(promise_test, async test => {
  const uuid = generateUuid(test);
  const auctionNonce = await navigator.createAuctionNonce();
  const seller = SINGLE_SELLER_AUCTION_SELLER;

  const buyer1 = OTHER_ORIGIN1;
  const additionalBid1 = createAdditionalBid(uuid, auctionNonce, seller, buyer1, "horses", 1.99);

  const buyer2 = OTHER_ORIGIN2;
  const additionalBid2 = createAdditionalBid(uuid, auctionNonce, seller, buyer2, "planes", 2.99);

  await runBasicFledgeAuctionAndNavigate(test, uuid, {
    interestGroupBuyers: [buyer1, buyer2],
    auctionNonce: auctionNonce,
    additionalBids: Promise.all([
      fetchAdditionalBids(seller, auctionNonce, [{ additionalBid: additionalBid1 }]),
      fetchAdditionalBids(seller, auctionNonce, [{ additionalBid: additionalBid2 }])
    ])
  });

  await waitForObservedRequests(uuid, [createSellerReportURL(uuid), createBidderReportURL(uuid, "planes")]);
});

// Single-seller auction with a two buyers competing with additional bids.
// The higher of these has a negative interest group specified, and that
// negative interest group has been joined, so the lower bid wins.
subsetTest(promise_test, async test => {
  const uuid = generateUuid(test);
  const auctionNonce = await navigator.createAuctionNonce();
  const seller = SINGLE_SELLER_AUCTION_SELLER;

  const negativeInterestGroupName = "already-owns-a-plane";

  const buyer1 = OTHER_ORIGIN1;
  const additionalBid1 = createAdditionalBid(uuid, auctionNonce, seller, buyer1, "horses", 1.99);

  const buyer2 = OTHER_ORIGIN2;
  const additionalBid2 = addNegativeInterestGroup(
    createAdditionalBid(uuid, auctionNonce, seller, buyer2, "planes", 2.99),
    negativeInterestGroupName);

  await joinNegativeInterestGroup(test, buyer2, negativeInterestGroupName, ADDITIONAL_BID_PUBLIC_KEY);

  await runBasicFledgeAuctionAndNavigate(test, uuid, {
    interestGroupBuyers: [buyer1, buyer2],
    auctionNonce: auctionNonce,
    additionalBids: fetchAdditionalBids(seller, auctionNonce,
      [{ additionalBid: additionalBid1 }, { additionalBid: additionalBid2, secretKeysForValidSignatures: [ADDITIONAL_BID_SECRET_KEY] }])
  });

  await waitForObservedRequests(uuid, [createSellerReportURL(uuid), createBidderReportURL(uuid, "horses")]);
});

// Same as above, except that the bid is signed incorrectly, so that the
// negative targeting interest group is ignored, and the higher bid, which
// would have otherwise been negative targeted, wins.
subsetTest(promise_test, async test => {
  const uuid = generateUuid(test);
  const auctionNonce = await navigator.createAuctionNonce();
  const seller = SINGLE_SELLER_AUCTION_SELLER;

  const negativeInterestGroupName = "already-owns-a-plane";

  const buyer1 = OTHER_ORIGIN1;
  const additionalBid1 = createAdditionalBid(uuid, auctionNonce, seller, buyer1, "horses", 1.99);

  const buyer2 = OTHER_ORIGIN2;
  const additionalBid2 = addNegativeInterestGroup(
    createAdditionalBid(uuid, auctionNonce, seller, buyer2, "planes", 2.99),
    negativeInterestGroupName);

  await joinNegativeInterestGroup(test, buyer2, negativeInterestGroupName, ADDITIONAL_BID_PUBLIC_KEY);

  await runBasicFledgeAuctionAndNavigate(test, uuid, {
    interestGroupBuyers: [buyer1, buyer2],
    auctionNonce: auctionNonce,
    additionalBids: fetchAdditionalBids(seller, auctionNonce,
      [{ additionalBid: additionalBid1 }, { additionalBid: additionalBid2, secretKeysForInvalidSignatures: [ADDITIONAL_BID_SECRET_KEY] }])
  });

  await waitForObservedRequests(uuid, [createSellerReportURL(uuid), createBidderReportURL(uuid, "planes")]);
});

// A test of an additional bid with multiple negative interest groups.
subsetTest(promise_test, async test => {
  const uuid = generateUuid(test);
  const auctionNonce = await navigator.createAuctionNonce();
  const seller = SINGLE_SELLER_AUCTION_SELLER;

  const negativeInterestGroupName = "already-owns-a-plane";

  const buyer1 = OTHER_ORIGIN1;
  const additionalBid1 = createAdditionalBid(uuid, auctionNonce, seller, buyer1, "horses", 1.99);

  const buyer2 = OTHER_ORIGIN2;
  const additionalBid2 = addNegativeInterestGroups(
    createAdditionalBid(uuid, auctionNonce, seller, buyer2, "planes", 2.99),
    [negativeInterestGroupName, "another-negative-interest-group"],
      /*joiningOrigin=*/window.location.origin);

  await joinNegativeInterestGroup(test, buyer2, negativeInterestGroupName, ADDITIONAL_BID_PUBLIC_KEY);

  await runBasicFledgeAuctionAndNavigate(test, uuid, {
    interestGroupBuyers: [buyer1, buyer2],
    auctionNonce: auctionNonce,
    additionalBids: fetchAdditionalBids(seller, auctionNonce,
      [{ additionalBid: additionalBid1 }, { additionalBid: additionalBid2, secretKeysForValidSignatures: [ADDITIONAL_BID_SECRET_KEY] }])
  });

  await waitForObservedRequests(uuid, [createSellerReportURL(uuid), createBidderReportURL(uuid, "horses")]);
});

// Same as above, but with a mismatched joining origin.
subsetTest(promise_test, async test => {
  const uuid = generateUuid(test);
  const auctionNonce = await navigator.createAuctionNonce();
  const seller = SINGLE_SELLER_AUCTION_SELLER;

  const negativeInterestGroupName = "already-owns-a-plane";

  const buyer1 = OTHER_ORIGIN1;
  const additionalBid1 = createAdditionalBid(uuid, auctionNonce, seller, buyer1, "horses", 1.99);

  const buyer2 = OTHER_ORIGIN2;
  const additionalBid2 = addNegativeInterestGroups(
    createAdditionalBid(uuid, auctionNonce, seller, buyer2, "planes", 2.99),
    [negativeInterestGroupName, "another-negative-interest-group"],
      /*joiningOrigin=*/OTHER_ORIGIN1);

  await joinNegativeInterestGroup(test, buyer2, negativeInterestGroupName, ADDITIONAL_BID_PUBLIC_KEY);

  await runBasicFledgeAuctionAndNavigate(test, uuid, {
    interestGroupBuyers: [buyer1, buyer2],
    auctionNonce: auctionNonce,
    additionalBids: fetchAdditionalBids(seller, auctionNonce,
      [{ additionalBid: additionalBid1 }, { additionalBid: additionalBid2, secretKeysForValidSignatures: [ADDITIONAL_BID_SECRET_KEY] }])
  });

  await waitForObservedRequests(uuid, [createSellerReportURL(uuid), createBidderReportURL(uuid, "planes")]);
});

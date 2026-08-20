// META: spec=https://w3c.github.io/payment-method-manifest/#fetch-pmm
// META: title=Initial HEAD request undergoing 3 same-site redirects succeeds (URL list size 4)
// META: script=/common/utils.js
// META: script=/payment-method-manifest/resources/helpers.js

promise_test(async t => {
  const testId = token();
  const pmiUrl = createPaymentMethodIdentifierUrl(testId, { hops: 3 });

  const request = new PaymentRequest(
    [{ supportedMethods: pmiUrl }],
    { total: { label: 'Total', amount: { currency: 'USD', value: '1.00' } } }
  );

  try {
    await request.canMakePayment();
  } catch (err) {}

  // 5 requests expected: 4 HEAD requests (hops=3, hops=2, hops=1, hops=0) + 1 manifest GET request
  const logs = await waitForServerAccessLogs(t, testId, 5);

  assert_equals(logs.length, 5, 'Browser must complete 3 redirects and fetch manifest');
  const pmiLogs = logs.filter(l => l.endpoint === 'payment-method-identifier');
  const manifestLogs = logs.filter(l => l.endpoint === 'payment-method-manifest');

  assert_equals(pmiLogs.length, 4, 'Must perform 4 HEAD requests during 3 redirect hops');
  pmiLogs.forEach((log, index) => {
    assert_equals(log.method, 'HEAD', `PMI request ${index + 1} must use HEAD method`);
  });

  assert_equals(manifestLogs.length, 1, 'Must fetch manifest after 3 redirect hops');
  assert_equals(manifestLogs[0].method, 'GET', 'Manifest request must use GET method');
}, 'Initial HEAD request undergoing 3 same-site redirects succeeds (URL list size 4)');

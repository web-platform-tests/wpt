// META: spec=https://w3c.github.io/payment-method-manifest/#fetch-pmm
// META: title=Manifest GET request with redirect mode error aborts on 302 redirect
// META: script=/common/utils.js
// META: script=/payment-method-manifest/resources/helpers.js

promise_test(async t => {
  const testId = token();
  const manifestFinalUrl = createPaymentMethodManifestUrl(testId);
  const redirectingManifestUrl = createPaymentMethodManifestUrl(testId, {
    redirect_location: manifestFinalUrl,
  });
  const pmiUrl = createPaymentMethodIdentifierUrl(testId, {
    link: `<${redirectingManifestUrl}>; rel="payment-method-manifest"`,
  });

  const request = new PaymentRequest(
    [{ supportedMethods: pmiUrl }],
    { total: { label: 'Total', amount: { currency: 'USD', value: '1.00' } } }
  );

  try {
    await request.canMakePayment();
  } catch (err) {}

  // 2 requests expected: HEAD to PMI and initial GET to manifest (which returns 302 redirect)
  const logs = await waitForServerAccessLogs(t, testId, 2);

  assert_equals(logs.length, 2, 'Browser must issue HEAD to PMI and GET to manifest');
  assert_equals(logs[0].endpoint, 'payment-method-identifier', 'First request must hit PMI URL');
  assert_equals(logs[0].method, 'HEAD', 'PMI request must use HEAD method');

  assert_equals(logs[1].endpoint, 'payment-method-manifest', 'Second request must hit manifest URL');
  assert_equals(logs[1].method, 'GET', 'Manifest request must use GET method');

  // Verify that redirect was not followed (redirect mode is error)
  const finalManifestLogs = logs.filter(l => l.url === manifestFinalUrl);
  assert_equals(finalManifestLogs.length, 0, 'Manifest GET request must not follow redirects (redirect mode: error)');
}, 'Manifest GET request with redirect mode error aborts on 302 redirect');

// META: spec=https://w3c.github.io/payment-method-manifest/#fetch-pmm
// META: title=Cross-site redirects on initial HEAD request are prohibited and abort fetch
// META: script=/common/utils.js
// META: script=/payment-method-manifest/resources/helpers.js

promise_test(async t => {
  const testId = token();
  const targetUrl = createPaymentMethodIdentifierUrl(testId, { host: '{{hosts[alt][]}}:{{ports[https][0]}}' });
  const pmiUrl = createPaymentMethodIdentifierUrl(testId, {
    host: '{{hosts[][]}}:{{ports[https][0]}}',
    redirect_location: targetUrl,
  });

  const request = new PaymentRequest(
    [{ supportedMethods: pmiUrl }],
    { total: { label: 'Total', amount: { currency: 'USD', value: '1.00' } } }
  );

  try {
    await request.canMakePayment();
  } catch (err) {}

  // Wait for initial HEAD request
  const logs = await waitForServerAccessLogs(t, testId, 1);

  assert_equals(logs.length, 1, 'Browser must issue only 1 server request before aborting');
  assert_equals(logs[0].endpoint, 'payment-method-identifier', 'First request must hit PMI URL');
  assert_equals(logs[0].method, 'HEAD', 'First request must use HEAD method');

  // Verify that cross-site redirect caused fetch to abort and no manifest GET was issued
  const manifestLogs = logs.filter(log => log.endpoint === 'payment-method-manifest');
  assert_equals(manifestLogs.length, 0, 'Cross-site redirect must abort fetch; manifest GET must not be performed');
}, 'Cross-site redirects on initial HEAD request are prohibited and abort fetch');

importScripts('/resources/testharness.js');

test(() => {
  assert_false('CanMakePaymentEvent' in self);
}, 'CanMakePaymentEvent constructor must not be exposed in worker');

test(() => {
  const ev = new CanMakePaymentEvent('test', {
    topOrigin: 'https://foo.com',
    paymentRequestOrigin: 'https://bar.com',
    methodData: [],
    modifiers: [],
  });
  assert_false(ev.isTrusted, 'constructed in script, so not be trusted');
  assert_equals(ev.topOrigin, 'https://foo.com');
  assert_equals(ev.paymentRequestOrigin, 'https://bar.com');
}, 'CanMakePaymentEvent can be constructed with a CanMakePaymentEventInit, even if not trusted');

test(() => {
  const ev = new CanMakePaymentEvent('test');
  self.addEventListener('test', evt => {
    assert_equals(ev, evt);
  });
  self.dispatchEvent(ev);
}, 'CanMakePaymentEvent can be dispatched, even if not trusted');

done();
